import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "15", 10));
    const skip = (page - 1) * limit;
    const query = searchParams.get("q")?.trim();

    const where = {
        institutionId: actor.institutionId,
        ...(query
            ? {
                OR: [
                    { action: { contains: query, mode: "insensitive" } },
                    { entityType: { contains: query, mode: "insensitive" } },
                    { entityId: { contains: query, mode: "insensitive" } },
                    { ipAddress: { contains: query, mode: "insensitive" } },
                    { actor: { name: { contains: query, mode: "insensitive" } } },
                ],
            }
            : {}),
    };

    const [auditLogs, total] = await Promise.all([
        db.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: skip,
            include: {
                actor: { select: { name: true } },
            },
        }),
        db.auditLog.count({ where })
    ]);

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
        pagination: {
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            limit
        }
    });
}
