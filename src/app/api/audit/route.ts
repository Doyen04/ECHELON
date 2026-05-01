import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET() {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = prisma as any;
    let actor = await db.user.findUnique({
        where: { id: session.user.id },
        select: { institutionId: true },
    });

    if (!actor && session.user.email) {
        actor = await db.user.findUnique({
            where: { email: session.user.email },
            select: { institutionId: true },
        });
    }

    if (!actor) {
        return NextResponse.json({ error: "Authenticated user not found." }, { status: 404 });
    }

    const auditLogs = await db.auditLog.findMany({
        where: { institutionId: actor.institutionId },
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
            actor: { select: { name: true } },
        },
    });

    return NextResponse.json({
        logs: auditLogs.map((log: any) => ({
            id: log.id,
            createdAt: log.createdAt.toISOString(),
            actorName: log.actor?.name ?? "System",
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            ipAddress: log.ipAddress ?? null,
            metadata: log.metadata ?? null,
        })),
    });
}
