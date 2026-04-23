import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { DispatchTriggerError, triggerDispatchForBatch } from "@/lib/dispatch-service";
import { parseStudentRowsFromCsv, parseStudentRowsFromPdf, type StudentImportRow } from "@/lib/result-import";
import { getSuperAdminSession } from "@/lib/super-admin-session";

const SEMESTER_VALUES = new Set(["FIRST", "SECOND", "THIRD"]);

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
    const department = String(formData.get("department") ?? "").trim();
    const autoDispatch = parseBoolean(String(formData.get("autoDispatch") ?? "true"));

    if (!(file instanceof File)) {
        return NextResponse.json({ error: "Result file (CSV or PDF) is required." }, { status: 400 });
    }

    if (!sessionLabel || !department || !SEMESTER_VALUES.has(semester)) {
        return NextResponse.json(
            { error: "session, semester (FIRST|SECOND|THIRD), and department are required." },
            { status: 400 },
        );
    }

    const groupedStudents = await parseStudentRowsFromFile(file, department).catch(() => []);

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
        const createdBatch = await tx.resultBatch.create({
            data: {
                institutionId: actor.institutionId,
                session: sessionLabel,
                semester,
                department,
                status: autoDispatch ? "APPROVED" : "PENDING",
                uploadedById: actor.id,
                approvedById: autoDispatch ? actor.id : null,
                approvedAt: autoDispatch ? new Date() : null,
                source: file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "csv",
                rawFileUrl: null,
            },
        });

        for (const studentRow of groupedStudents) {
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

            if (studentRow.parentEmail || studentRow.parentPhone) {
                const guardian = await tx.guardian.findFirst({
                    where: {
                        studentId: student.id,
                        OR: [
                            studentRow.parentEmail ? { email: studentRow.parentEmail } : undefined,
                            studentRow.parentPhone ? { phone: studentRow.parentPhone } : undefined,
                        ].filter(Boolean),
                    },
                });

                if (guardian) {
                    await tx.guardian.update({
                        where: { id: guardian.id },
                        data: {
                            name: studentRow.parentName ?? guardian.name,
                            relationship: studentRow.relationship,
                            email: studentRow.parentEmail,
                            phone: studentRow.parentPhone,
                        },
                    });
                } else {
                    await tx.guardian.create({
                        data: {
                            studentId: student.id,
                            name: studentRow.parentName ?? `${studentRow.studentName} Guardian`,
                            relationship: studentRow.relationship,
                            email: studentRow.parentEmail,
                            phone: studentRow.parentPhone,
                        },
                    });
                }
            }

            await tx.studentResult.create({
                data: {
                    batchId: createdBatch.id,
                    studentId: student.id,
                    courses: studentRow.courses,
                    gpa: studentRow.gpa,
                    cgpa: studentRow.cgpa,
                    status: autoDispatch ? "APPROVED" : "PENDING",
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
                    autoDispatch,
                },
            },
        });

        return createdBatch;
    }, { timeout: 60000, maxWait: 10000 });

    if (!autoDispatch) {
        return NextResponse.json({
            batchId: batch.id,
            uploadedRows: groupedStudents.length,
            students: groupedStudents.length,
            dispatch: null,
        });
    }

    try {
        const dispatch = await triggerDispatchForBatch({
            batchId: batch.id,
            triggeredById: actor.id,
        });

        return NextResponse.json({
            batchId: batch.id,
            uploadedRows: groupedStudents.length,
            students: groupedStudents.length,
            dispatch,
        });
    } catch (error) {
        if (error instanceof DispatchTriggerError) {
            return NextResponse.json(
                {
                    batchId: batch.id,
                    uploadedRows: groupedStudents.length,
                    students: groupedStudents.length,
                    dispatch: null,
                    error: error.message,
                },
                { status: error.statusCode },
            );
        }

        return NextResponse.json(
            {
                batchId: batch.id,
                uploadedRows: groupedStudents.length,
                students: groupedStudents.length,
                dispatch: null,
                error: "Upload completed but dispatch failed.",
            },
            { status: 500 },
        );
    }
}




