import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireSuperAdminSession } from "@/lib/super-admin-session";

const db = prisma as any;

async function getInstitutionId(userId: string): Promise<string> {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { institutionId: true },
    });
    if (!user) throw new Error("User not found");
    return user.institutionId as string;
}

function escapeCell(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export async function GET() {
    try {
        const session = await requireSuperAdminSession();
        const institutionId = await getInstitutionId(session.user.id);

        const logs = await db.notificationLog.findMany({
            where: {
                student: { institutionId },
            },
            include: {
                student: { select: { fullName: true, matricNumber: true } },
                dispatch: {
                    include: {
                        batch: { select: { session: true, semester: true, department: true } },
                    },
                },
                guardian: { select: { name: true, relationship: true } },
            },
            orderBy: { attemptedAt: "desc" },
        });

        const headers = [
            "Student Name", "Matric Number", "Session", "Semester", "Department",
            "Guardian Name", "Relationship", "Channel", "Status",
            "Provider Message ID", "Failure Reason", "Attempted At", "Delivered At",
        ];

        const rows = logs.map((log: any) => [
            log.student?.fullName,
            log.student?.matricNumber,
            log.dispatch?.batch?.session,
            log.dispatch?.batch?.semester,
            log.dispatch?.batch?.department,
            log.guardian?.name,
            log.guardian?.relationship,
            log.channel,
            log.status,
            log.providerMessageId,
            log.failureReason,
            log.attemptedAt ? new Date(log.attemptedAt).toISOString() : null,
            log.deliveredAt ? new Date(log.deliveredAt).toISOString() : null,
        ].map(escapeCell).join(","));

        const csv = [headers.join(","), ...rows].join("\n");

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="dispatch-export-${new Date().toISOString().slice(0, 10)}.csv"`,
            },
        });
    } catch {
        return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
    }
}
