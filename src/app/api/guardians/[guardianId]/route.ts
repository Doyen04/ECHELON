import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

const updateSchema = z.object({
    name: z.string().trim().min(1).optional(),
    relationship: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional().nullable(),
    phone: z.string().trim().min(1).optional().nullable(),
});

type RouteContext = {
    params: Promise<{
        guardianId: string;
    }>;
};

export async function PATCH(request: Request, context: RouteContext) {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { guardianId } = await context.params;
    if (!guardianId) {
        return NextResponse.json({ error: "Guardian id is required." }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid guardian update payload." }, { status: 400 });
    }

    const db = prisma as any;
    const actor = await db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, institutionId: true },
    });

    if (!actor) {
        return NextResponse.json({ error: "Authenticated user not found." }, { status: 404 });
    }

    const guardian = await db.guardian.findUnique({
        where: { id: guardianId },
        include: {
            student: {
                select: { institutionId: true, fullName: true },
            },
        },
    });

    if (!guardian || guardian.student.institutionId !== actor.institutionId) {
        return NextResponse.json({ error: "Guardian not found." }, { status: 404 });
    }

    const updated = await db.guardian.update({
        where: { id: guardianId },
        data: {
            name: parsed.data.name,
            relationship: parsed.data.relationship,
            email: parsed.data.email,
            phone: parsed.data.phone,
        },
    });

    await db.auditLog.create({
        data: {
            institutionId: actor.institutionId,
            actorId: actor.id,
            action: "guardian.updated",
            entityType: "guardian",
            entityId: guardianId,
            metadata: parsed.data,
        },
    });

    return NextResponse.json({ guardian: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { guardianId } = await context.params;
    if (!guardianId) {
        return NextResponse.json({ error: "Guardian id is required." }, { status: 400 });
    }

    const db = prisma as any;
    const actor = await db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, institutionId: true },
    });

    if (!actor) {
        return NextResponse.json({ error: "Authenticated user not found." }, { status: 404 });
    }

    const guardian = await db.guardian.findUnique({
        where: { id: guardianId },
        include: {
            student: {
                select: { institutionId: true },
            },
        },
    });

    if (!guardian || guardian.student.institutionId !== actor.institutionId) {
        return NextResponse.json({ error: "Guardian not found." }, { status: 404 });
    }

    await db.guardian.delete({ where: { id: guardianId } });

    await db.auditLog.create({
        data: {
            institutionId: actor.institutionId,
            actorId: actor.id,
            action: "guardian.deleted",
            entityType: "guardian",
            entityId: guardianId,
            metadata: {
                studentId: guardian.studentId,
                studentName: guardian.student?.fullName ?? null,
            },
        },
    });

    return NextResponse.json({ ok: true });
}
