import { NextResponse } from "next/server";
import { buildCsv } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET() {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = prisma as any;
    const actor = await db.user.findUnique({
        where: { id: session.user.id },
        select: { institutionId: true },
    });

    if (!actor) {
        return NextResponse.json({ error: "Authenticated user not found." }, { status: 404 });
    }

    const auditLogs = await db.auditLog.findMany({
        where: { institutionId: actor.institutionId },
        orderBy: { createdAt: "desc" },
        include: {
            actor: { select: { name: true, email: true } },
        },
    });

    const headers = [
        "timestamp",
        "actor_name",
        "actor_email",
        "action",
        "entity_type",
        "entity_id",
        "ip_address",
        "metadata",
    ];

    const rows = auditLogs.map((log: any) => [
        log.createdAt.toISOString(),
        log.actor?.name ?? "System",
        log.actor?.email ?? "",
        log.action,
        log.entityType,
        log.entityId,
        log.ipAddress ?? "",
        log.metadata ? JSON.stringify(log.metadata) : "",
    ]);

    const csv = buildCsv(headers, rows);
    const filename = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;

    return new Response(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename=\"${filename}\"`,
            "Cache-Control": "no-store",
        },
    });
}
