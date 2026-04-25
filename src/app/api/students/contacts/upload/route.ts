import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { parseParentContactsFromCsv } from "@/lib/result-import";
import { getSuperAdminSession } from "@/lib/super-admin-session";

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
    if (!(file instanceof File)) {
        return NextResponse.json({ error: "Contacts CSV file is required." }, { status: 400 });
    }

    const csvText = await file.text();
    const rows = parseParentContactsFromCsv(csvText);
    if (rows.length === 0) {
        return NextResponse.json(
            {
                error: "No valid rows found. Include at least matric_number.",
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

    const matricNumbers = Array.from(new Set(rows.map((row) => row.matricNumber)));
    const students = await db.student.findMany({
        where: {
            matricNumber: { in: matricNumbers },
            institutionId: actor.institutionId,
        },
        select: { id: true, matricNumber: true, fullName: true },
    });

    const studentByMatric = new Map<string, any>(
        students.map((student: any) => [String(student.matricNumber).toUpperCase(), student]),
    );

    let matched = 0;
    let created = 0;
    let updated = 0;
    const unmatchedMatricNumbers = new Set<string>();

    await db.$transaction(async (tx: any) => {
        for (const row of rows) {
            const student = studentByMatric.get(row.matricNumber);
            if (!student) {
                unmatchedMatricNumbers.add(row.matricNumber);
                continue;
            }

            matched += 1;
            const hasContactDetails = Boolean(row.parentEmail || row.parentPhone);
            const existing = await tx.guardian.findFirst({
                where: hasContactDetails
                    ? {
                          studentId: student.id,
                          OR: [
                              row.parentEmail ? { email: row.parentEmail } : undefined,
                              row.parentPhone ? { phone: row.parentPhone } : undefined,
                          ].filter(Boolean),
                      }
                    : {
                          studentId: student.id,
                          email: null,
                          phone: null,
                      },
            });

            const guardianName = row.parentName ?? "";
            const relationship = row.relationship ?? "Parent";

            if (existing) {
                await tx.guardian.update({
                    where: { id: existing.id },
                    data: {
                        name: guardianName,
                        relationship,
                        email: row.parentEmail,
                        phone: row.parentPhone,
                    },
                });
                updated += 1;
            } else {
                await tx.guardian.create({
                    data: {
                        studentId: student.id,
                        name: guardianName,
                        relationship,
                        email: row.parentEmail,
                        phone: row.parentPhone,
                    },
                });
                created += 1;
            }
        }

        await tx.auditLog.create({
            data: {
                institutionId: actor.institutionId,
                actorId: actor.id,
                action: "contacts.uploaded",
                entityType: "guardian",
                entityId: actor.id,
                metadata: {
                    filename: file.name,
                    totalRows: rows.length,
                    matched,
                    created,
                    updated,
                    unmatched: Array.from(unmatchedMatricNumbers),
                },
            },
        });
    });

    return NextResponse.json({
        totalRows: rows.length,
        matched,
        created,
        updated,
        unmatched: Array.from(unmatchedMatricNumbers),
    });
}
