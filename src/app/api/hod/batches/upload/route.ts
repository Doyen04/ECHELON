import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHodSession } from "@/lib/hod-session";
import {
    parseStudentRowsFromCsv,
    parseStudentRowsFromPdf,
} from "@/lib/result-import-old";
import {
    validateLevelConsistency,
    checkDuplicateBatch,
    parseSemester,
} from "@/lib/hod-upload-validation";

export async function POST(request: Request) {
    const session = await getHodSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) {
        return NextResponse.json(
            { error: "Invalid multipart payload." },
            { status: 400 },
        );
    }

    const file = formData.get("file");
    const programId = String(formData.get("programId") ?? "").trim();
    const sessionLabel = String(formData.get("session") ?? "").trim();
    const semester = parseSemester(String(formData.get("semester") ?? ""));
    const levelStr = String(formData.get("level") ?? "").trim();

    if (!(file instanceof File)) {
        return NextResponse.json(
            { error: "Result file (CSV or PDF) is required." },
            { status: 400 },
        );
    }

    const level = parseInt(levelStr, 10);
    if (!programId || !sessionLabel || !semester || isNaN(level)) {
        return NextResponse.json(
            {
                error: "programId, session, semester, and level are required.",
            },
            { status: 400 },
        );
    }

    // Verify program belongs to HOD's department
    const program = await prisma.program.findUnique({
        where: { id: programId },
        select: { departmentId: true, code: true, name: true },
    });

    if (!program || program.departmentId !== session.user.departmentId) {
        return NextResponse.json(
            { error: "Program not found or unauthorized." },
            { status: 403 },
        );
    }

    // Parse file
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    let studentRows: any[] = [];
    try {
        if (isPdf) {
            const buffer = Buffer.from(await file.arrayBuffer());
            studentRows = await parseStudentRowsFromPdf(buffer, program.name);
        } else {
            const text = await file.text();
            studentRows = await parseStudentRowsFromCsv(text, program.name);
        }
    } catch (error) {
        console.error("[HOD upload] Parse error:", error);
        return NextResponse.json(
            { error: "Failed to parse file. Check CSV/PDF format." },
            { status: 422 },
        );
    }

    if (studentRows.length === 0) {
        return NextResponse.json(
            { error: "No valid student records extracted from file." },
            { status: 422 },
        );
    }

    // Validate level consistency
    const levelCheck = await validateLevelConsistency(studentRows);
    if (!levelCheck.valid) {
        return NextResponse.json({ error: levelCheck.message }, { status: 422 });
    }

    // Check duplicate
    const duplicate = await checkDuplicateBatch(
        programId,
        sessionLabel,
        semester,
        level,
    );

    if (duplicate) {
        return NextResponse.json(
            {
                batchId: null,
                isDuplicate: true,
                existingBatchId: duplicate.id,
                existingStatus: duplicate.status,
                existingUploadDate: duplicate.uploadedAt,
                message: `A batch already exists for ${program.name} Level ${level} in ${semester} ${sessionLabel}.`,
                studentCount: studentRows.length,
            },
            { status: 409 },
        );
    }

    // Create batch
    const actor = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, institutionId: true },
    });

    if (!actor) {
        return NextResponse.json(
            { error: "Authenticated user not found." },
            { status: 404 },
        );
    }

    try {
        const batch = await prisma.$transaction(
            async (tx) => {
                const createdBatch = await tx.resultBatch.create({
                    data: {
                        institutionId: actor.institutionId,
                        programId,
                        session: sessionLabel,
                        semester,
                        level,
                        status: "PENDING",
                        uploadedById: actor.id,
                        source: isPdf ? "pdf" : "csv",
                        rawFileUrl: null,
                        department: program.name, // Keep for legacy compatibility
                    },
                });

                // Process students
                for (const row of studentRows) {
                    const student = await tx.student.upsert({
                        where: { matricNumber: row.matricNumber },
                        update: {
                            fullName: row.studentName,
                            department: row.department,
                            faculty: row.faculty,
                            level: row.level,
                        },
                        create: {
                            institutionId: actor.institutionId,
                            matricNumber: row.matricNumber,
                            fullName: row.studentName,
                            department: row.department,
                            faculty: row.faculty,
                            level: row.level,
                        },
                    });

                    // Update or create guardian
                    const guardian = await tx.guardian.findFirst({
                        where: { studentId: student.id },
                    });

                    if (guardian) {
                        await tx.guardian.update({
                            where: { id: guardian.id },
                            data: {
                                name: row.parentName ?? guardian.name,
                                relationship: row.relationship,
                                email: row.parentEmail ?? guardian.email,
                                phone: row.parentPhone ?? guardian.phone,
                            },
                        });
                    } else if (row.parentEmail || row.parentPhone) {
                        await tx.guardian.create({
                            data: {
                                studentId: student.id,
                                name: row.parentName ?? `${row.studentName} Guardian`,
                                relationship: row.relationship,
                                email: row.parentEmail,
                                phone: row.parentPhone,
                            },
                        });
                    }

                    // Create result
                    await tx.studentResult.create({
                        data: {
                            batchId: createdBatch.id,
                            studentId: student.id,
                            courses: row.courses,
                            gpa: row.gpa,
                            cgpa: row.cgpa ?? null,
                            status: "PENDING",
                        },
                    });
                }

                // Audit log
                await tx.auditLog.create({
                    data: {
                        institutionId: actor.institutionId,
                        actorId: actor.id,
                        action: "batch.uploaded",
                        entityType: "result_batch",
                        entityId: createdBatch.id,
                        metadata: {
                            filename: file.name,
                            studentCount: studentRows.length,
                            programId,
                            level,
                            uploadedByRole: "hod",
                        },
                    },
                });

                return createdBatch;
            },
            { timeout: 60000 },
        );

        return NextResponse.json({
            batchId: batch.id,
            programId,
            level,
            uploadedRows: studentRows.length,
            isDuplicate: false,
        });
    } catch (error: any) {
        console.error("[HOD upload] Transaction error:", error);
        return NextResponse.json(
            { error: "Failed to save results to database: " + error.message },
            { status: 500 },
        );
    }
}
