import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { DispatchTriggerError, triggerDispatchForBatch } from "@/lib/dispatch-service";
import { getSuperAdminSession } from "@/lib/super-admin-session";

const SEMESTER_VALUES = new Set(["FIRST", "SECOND", "THIRD"]);

type CsvRow = {
    matricNumber: string;
    studentName: string;
    department: string;
    faculty: string;
    level: number;
    gpa: number;
    cgpa: number | null;
    courseCode: string;
    courseTitle: string;
    unit: number;
    grade: string;
    score: number | null;
    parentName: string | null;
    parentEmail: string | null;
    parentPhone: string | null;
    relationship: string;
    preferredChannel: "WHATSAPP" | "EMAIL" | "SMS";
    ndprConsent: boolean;
};

function normalizeHeader(header: string): string {
    return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseBoolean(value: string | undefined): boolean {
    const normalized = (value ?? "").trim().toLowerCase();
    return ["true", "1", "yes", "y"].includes(normalized);
}

function parseNumber(value: string | undefined, fallback = 0): number {
    const parsed = Number((value ?? "").trim());
    return Number.isFinite(parsed) ? parsed : fallback;
}

function parseNullableNumber(value: string | undefined): number | null {
    const raw = (value ?? "").trim();
    if (!raw) {
        return null;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
}

function parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const nextChar = line[index + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    values.push(current.trim());
    return values;
}

function csvToRows(csvText: string): Array<Record<string, string>> {
    const lines = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length < 2) {
        return [];
    }

    const headers = parseCsvLine(lines[0]).map(normalizeHeader);
    const rows: Array<Record<string, string>> = [];

    for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
        const values = parseCsvLine(lines[rowIndex]);
        const row: Record<string, string> = {};

        headers.forEach((header, headerIndex) => {
            row[header] = values[headerIndex] ?? "";
        });

        rows.push(row);
    }

    return rows;
}

function mapRow(raw: Record<string, string>, fallbackDepartment: string): CsvRow | null {
    const matricNumber = (raw.matric_number ?? raw.matric ?? raw.matric_no ?? "").trim();
    const studentName = (raw.student_name ?? raw.full_name ?? raw.name ?? "").trim();

    if (!matricNumber || !studentName) {
        return null;
    }

    const preferred = (raw.preferred_channel ?? "WHATSAPP").trim().toUpperCase();
    const preferredChannel =
        preferred === "EMAIL" || preferred === "SMS" ? preferred : "WHATSAPP";

    return {
        matricNumber,
        studentName,
        department: (raw.department ?? fallbackDepartment).trim() || fallbackDepartment,
        faculty: (raw.faculty ?? "General").trim() || "General",
        level: parseNumber(raw.level, 100),
        gpa: parseNumber(raw.gpa, 0),
        cgpa: parseNullableNumber(raw.cgpa),
        courseCode: (raw.course_code ?? "GEN101").trim() || "GEN101",
        courseTitle: (raw.course_title ?? "General Studies").trim() || "General Studies",
        unit: parseNumber(raw.unit, 0),
        grade: (raw.grade ?? "").trim() || "N/A",
        score: parseNullableNumber(raw.score),
        parentName: (raw.parent_name ?? raw.guardian_name ?? "").trim() || null,
        parentEmail: (raw.parent_email ?? raw.email ?? "").trim() || null,
        parentPhone: (raw.parent_phone ?? raw.phone ?? "").trim() || null,
        relationship: (raw.relationship ?? "Parent").trim() || "Parent",
        preferredChannel,
        ndprConsent: parseBoolean(raw.ndpr_consent ?? "true"),
    };
}

type AggregatedRow = {
    matricNumber: string;
    studentName: string;
    department: string;
    faculty: string;
    level: number;
    gpa: number;
    cgpa: number | null;
    parentName: string | null;
    parentEmail: string | null;
    parentPhone: string | null;
    relationship: string;
    preferredChannel: "WHATSAPP" | "EMAIL" | "SMS";
    ndprConsent: boolean;
    courses: Array<{
        code: string;
        title: string;
        unit: number;
        grade: string;
        score: number | null;
    }>;
};

function aggregateRows(rows: CsvRow[]): AggregatedRow[] {
    const grouped = new Map<string, AggregatedRow>();

    for (const row of rows) {
        const existing = grouped.get(row.matricNumber);
        const course = {
            code: row.courseCode,
            title: row.courseTitle,
            unit: row.unit,
            grade: row.grade,
            score: row.score,
        };

        if (!existing) {
            grouped.set(row.matricNumber, {
                matricNumber: row.matricNumber,
                studentName: row.studentName,
                department: row.department,
                faculty: row.faculty,
                level: row.level,
                gpa: row.gpa,
                cgpa: row.cgpa,
                parentName: row.parentName,
                parentEmail: row.parentEmail,
                parentPhone: row.parentPhone,
                relationship: row.relationship,
                preferredChannel: row.preferredChannel,
                ndprConsent: row.ndprConsent,
                courses: [course],
            });
            continue;
        }

        existing.courses.push(course);
        if (row.gpa > 0) {
            existing.gpa = row.gpa;
        }
        if (row.cgpa !== null) {
            existing.cgpa = row.cgpa;
        }
    }

    return Array.from(grouped.values());
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
        return NextResponse.json({ error: "CSV file is required." }, { status: 400 });
    }

    if (!sessionLabel || !department || !SEMESTER_VALUES.has(semester)) {
        return NextResponse.json(
            { error: "session, semester (FIRST|SECOND|THIRD), and department are required." },
            { status: 400 },
        );
    }

    const csvText = await file.text();
    const parsedRows = csvToRows(csvText)
        .map((row) => mapRow(row, department))
        .filter((row): row is CsvRow => row !== null);

    if (parsedRows.length === 0) {
        return NextResponse.json(
            { error: "No valid student rows found. Ensure CSV contains matric_number and student_name." },
            { status: 422 },
        );
    }

    const groupedStudents = aggregateRows(parsedRows);
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
                source: "csv",
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
                            preferredChannel: studentRow.preferredChannel,
                            ndprConsent: studentRow.ndprConsent,
                            consentDate: studentRow.ndprConsent ? new Date() : guardian.consentDate,
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
                            preferredChannel: studentRow.preferredChannel,
                            ndprConsent: studentRow.ndprConsent,
                            consentDate: studentRow.ndprConsent ? new Date() : null,
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
                    rowCount: parsedRows.length,
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
            uploadedRows: parsedRows.length,
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
            uploadedRows: parsedRows.length,
            students: groupedStudents.length,
            dispatch,
        });
    } catch (error) {
        if (error instanceof DispatchTriggerError) {
            return NextResponse.json(
                {
                    batchId: batch.id,
                    uploadedRows: parsedRows.length,
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
                uploadedRows: parsedRows.length,
                students: groupedStudents.length,
                dispatch: null,
                error: "Upload completed but dispatch failed.",
            },
            { status: 500 },
        );
    }
}




