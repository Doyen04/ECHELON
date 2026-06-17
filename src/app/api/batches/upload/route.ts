import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { DispatchTriggerError, triggerDispatchForBatch } from "@/lib/dispatch-service";
import {
    calculateGpaFromCourses,
    parseStudentRowsFromCsv,
    parseStudentRowsFromPdf,
    type StudentImportRow,
} from "@/lib/result-import-old";
import { getSuperAdminSession } from "@/lib/super-admin-session";

const SEMESTER_VALUES = new Set(["FIRST", "SECOND", "THIRD"]);

function isComputerScienceDepartment(department: string): boolean {
    const normalized = department.trim().toLowerCase();
    return normalized === "cs" || normalized.includes("computer science");
}

function parseBoolean(value: string | undefined): boolean {
    const normalized = (value ?? "").trim().toLowerCase();
    return ["true", "1", "yes", "y"].includes(normalized);
}

async function parseStudentRowsFromFile(file: File, fallbackDepartment: string): Promise<StudentImportRow[]> {
    const loweredFileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();
    const isPdf = loweredFileName.endsWith(".pdf") || mimeType.includes("pdf");
    const isCsv =
        loweredFileName.endsWith(".csv") ||
        mimeType.includes("csv") ||
        mimeType === "text/plain";

    if (!isPdf && !isCsv) {
        throw new Error("Only CSV or PDF uploads are supported.");
    }

    if (isPdf) {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        return parseStudentRowsFromPdf(fileBuffer, fallbackDepartment);
    }

    const csvText = await file.text();
    return parseStudentRowsFromCsv(csvText, fallbackDepartment);
}

export async function POST(request: Request) {
    try {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) {
        return NextResponse.json({ error: "Invalid multipart payload." }, { status: 400 });
    }

    const file = formData.get("file");
    const sessionLabel = String(formData.get("session") ?? "").trim();
    const semester = String(formData.get("semester") ?? "").trim().toUpperCase();
    const programId = String(formData.get("programId") ?? "").trim();
    const levelStr = String(formData.get("level") ?? "").trim();

    if (!(file instanceof File)) {
        return NextResponse.json({ error: "Result file (CSV or PDF) is required." }, { status: 400 });
    }

    const level = parseInt(levelStr, 10);
    if (!sessionLabel || !programId || isNaN(level) || !SEMESTER_VALUES.has(semester)) {
        return NextResponse.json(
            { error: "session, semester (FIRST|SECOND|THIRD), programId, and level are required." },
            { status: 400 },
        );
    }

    // Verify program exists
    const program = await prisma.program.findUnique({
        where: { id: programId },
        select: { name: true, departmentId: true },
    });

    if (!program) {
        return NextResponse.json({ error: "Invalid program selected." }, { status: 400 });
    }

    const overwrite = parseBoolean(String(formData.get("overwrite") ?? ""));

    // Check duplicate
    const duplicate = await prisma.resultBatch.findFirst({
        where: { programId, session: sessionLabel, semester: semester as any, level },
        select: { id: true, uploadedAt: true, status: true },
    });

    if (duplicate && !overwrite) {
        return NextResponse.json(
            {
                isDuplicate: true,
                existingBatchId: duplicate.id,
                message: `A batch already exists for ${program.name} Level ${level} in ${semester} ${sessionLabel}.`,
            },
            { status: 409 },
        );
    }

    const groupedStudents = await parseStudentRowsFromFile(file, program.name).catch((err: unknown) => {
        console.error("[upload] File parse error:", err);
        return [] as StudentImportRow[];
    });

    const isUploadedPdf = file.name.toLowerCase().endsWith(".pdf") || file.type.toLowerCase().includes("pdf");

    if (groupedStudents.length === 0) {
        return NextResponse.json(
            {
                error:
                    "No valid student results were extracted from the uploaded file. Check file format and include matric number and student name per student.",
            },
            { status: 422 },
        );
    }
    const db = prisma as any;

    const actor = await db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, institutionId: true },
    });

    if (!actor) {
        return NextResponse.json({ error: "Authenticated user not found." }, { status: 404 });
    }

    const batch = await db.$transaction(async (tx: any) => {
        if (overwrite && duplicate) {
            await tx.resultBatch.delete({
                where: { id: duplicate.id }
            });
        }

        const createdBatch = await tx.resultBatch.create({
            data: {
                institutionId: actor.institutionId,
                programId,
                session: sessionLabel,
                semester,
                level,
                status: "PENDING",
                uploadedById: actor.id,
                approvedById: null,
                approvedAt: null,
                source: isUploadedPdf ? "pdf" : "csv",
                rawFileUrl: null,
                department: program.name, // Keep for legacy compatibility
            },
        });

        for (const studentRow of groupedStudents) {
            const computedGpa = calculateGpaFromCourses(studentRow.courses);
            const effectiveGpa =
                isComputerScienceDepartment(studentRow.department) && computedGpa !== null
                    ? computedGpa
                    : studentRow.gpa;

            const student = await tx.student.upsert({
                where: { matricNumber: studentRow.matricNumber },
                update: {
                    fullName: studentRow.studentName,
                    department: studentRow.department,
                    faculty: studentRow.faculty,
                    level: studentRow.level,
                },
                create: {
                    institutionId: actor.institutionId,
                    matricNumber: studentRow.matricNumber,
                    fullName: studentRow.studentName,
                    department: studentRow.department,
                    faculty: studentRow.faculty,
                    level: studentRow.level,
                },
            });

            const guardian = await tx.guardian.findFirst({
                where: { studentId: student.id },
            });

            const guardianName = studentRow.parentName ?? guardian?.name ?? `${studentRow.studentName} Guardian`;

            if (guardian) {
                await tx.guardian.update({
                    where: { id: guardian.id },
                    data: {
                        name: guardianName,
                        relationship: studentRow.relationship,
                        email: studentRow.parentEmail ?? guardian.email,
                        phone: studentRow.parentPhone ?? guardian.phone,
                    },
                });
            } else {
                await tx.guardian.create({
                    data: {
                        studentId: student.id,
                        name: guardianName,
                        relationship: studentRow.relationship,
                        email: studentRow.parentEmail,
                        phone: studentRow.parentPhone,
                    },
                });
            }

            await tx.studentResult.create({
                data: {
                    batchId: createdBatch.id,
                    studentId: student.id,
                    courses: studentRow.courses,
                    gpa: effectiveGpa,
                    cgpa: studentRow.cgpa,
                    status: "PENDING",
                },
            });
        }

        await tx.auditLog.create({
            data: {
                institutionId: actor.institutionId,
                actorId: actor.id,
                action: "batch.uploaded",
                entityType: "result_batch",
                entityId: createdBatch.id,
                metadata: {
                    filename: file.name,
                    studentCount: groupedStudents.length,
                    programId,
                    level,
                    autoDispatch: false,
                },
            },
        });

        return createdBatch;
    }, { timeout: 60000 });

    return NextResponse.json({
        batchId: batch.id,
        uploadedRows: groupedStudents.length,
        students: groupedStudents.length,
        dispatch: null,
    });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected server error.";
        const code = (error as any)?.code ?? null;
        console.error("[POST /api/batches/upload]", error);
        return NextResponse.json(
            { error: message, code, stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : null) : undefined },
            { status: 500 },
        );
    }
}




