import { NextResponse } from "next/server";

import { buildCsv } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

type RouteContext = {
    params: Promise<{
        dispatchId: string;
    }>;
};

function formatDateTime(value: Date | null | undefined): string {
    return value ? value.toISOString() : "";
}

export async function GET(_request: Request, context: RouteContext) {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dispatchId } = await context.params;
    if (!dispatchId) {
        return NextResponse.json({ error: "Dispatch id is required." }, { status: 400 });
    }

    const db = prisma as any;
    const actor = await db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, institutionId: true },
    });

    if (!actor) {
        return NextResponse.json({ error: "Authenticated user not found." }, { status: 404 });
    }

    const dispatch = await db.notificationDispatch.findUnique({
        where: { id: dispatchId },
        include: {
            batch: {
                select: {
                    id: true,
                    department: true,
                    session: true,
                    semester: true,
                    institutionId: true,
                },
            },
        },
    });

    if (!dispatch || dispatch.batch.institutionId !== actor.institutionId) {
        return NextResponse.json({ error: "Dispatch not found." }, { status: 404 });
    }

    const logs = await db.notificationLog.findMany({
        where: { dispatchId },
        orderBy: { attemptedAt: "desc" },
        include: {
            student: {
                select: {
                    fullName: true,
                    matricNumber: true,
                },
            },
            guardian: {
                select: {
                    name: true,
                },
            },
        },
    });

    const headers = [
        "dispatch_id",
        "batch_id",
        "department",
        "session",
        "semester",
        "student_name",
        "matric_number",
        "guardian_name",
        "channel",
        "status",
        "attempted_at",
        "delivered_at",
        "provider_message_id",
        "failure_reason",
    ];

    const rows = logs.map((log: any) => [
        dispatch.id,
        dispatch.batch.id,
        dispatch.batch.department,
        dispatch.batch.session,
        String(dispatch.batch.semester),
        log.student?.fullName ?? "Unknown student",
        log.student?.matricNumber ?? log.studentId,
        log.guardian?.name ?? "Unknown guardian",
        String(log.channel),
        String(log.status),
        formatDateTime(log.attemptedAt),
        formatDateTime(log.deliveredAt),
        log.providerMessageId ?? "",
        log.failureReason ?? "",
    ]);

    const csv = buildCsv(headers, rows);
    const filename = `delivery-${dispatch.id}.csv`;

    return new Response(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename=\"${filename}\"`,
            "Cache-Control": "no-store",
        },
    });
}
