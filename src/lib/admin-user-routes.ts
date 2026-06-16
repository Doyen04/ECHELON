import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/hod-session";

const updateUserSchema = z.object({
    name: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
    role: z.enum(["super_admin", "hod"]).optional(),
    departmentId: z.string().trim().min(1).optional().nullable(),
});

const passwordSchema = z.object({
    password: z.string().min(8),
});

type RouteContext = {
    params: Promise<{
        userId: string;
    }>;
};

async function getActor() {
    const session = await requireAdminSession();
    if (!session) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const actor = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, institutionId: true },
    });

    if (!actor) {
        return { error: NextResponse.json({ error: "Authenticated user not found" }, { status: 404 }) };
    }

    return { actor };
}

async function getTargetUser(userId: string, institutionId: string) {
    return prisma.user.findFirst({
        where: {
            id: userId,
            institutionId,
        },
        include: {
            department: {
                select: { id: true, name: true },
            },
        },
    });
}

type UserResponseLike = {
    id: string;
    name: string;
    email: string;
    role: string;
    departmentId: string | null;
    department: { id: string; name: string } | null;
    updatedAt: Date;
};

function buildUserResponse(user: UserResponseLike) {
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            departmentId: user.departmentId,
            department: user.department,
            updatedAt: user.updatedAt,
        },
    };
}

export async function patchUser(request: Request, context: RouteContext) {
    const auth = await getActor();
    if ("error" in auth) {
        return auth.error;
    }

    const { userId } = await context.params;
    if (!userId) {
        return NextResponse.json({ error: "User id is required" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid request body: " + parsed.error.message },
            { status: 400 },
        );
    }

    const targetUser = await getTargetUser(userId, auth.actor.institutionId);
    if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const nextRole = parsed.data.role ?? targetUser.role;
    const nextDepartmentId =
        nextRole === "hod" ? (parsed.data.departmentId ?? targetUser.departmentId) : null;

    if (nextRole === "hod" && !nextDepartmentId) {
        return NextResponse.json(
            { error: "Department required for HOD role" },
            { status: 400 },
        );
    }

    if (parsed.data.email && parsed.data.email !== targetUser.email) {
        const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (existing && existing.id !== targetUser.id) {
            return NextResponse.json({ error: "Email already in use" }, { status: 409 });
        }
    }

    const updated = await prisma.user.update({
        where: { id: targetUser.id },
        data: {
            name: parsed.data.name,
            email: parsed.data.email,
            role: parsed.data.role,
            departmentId: nextDepartmentId,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
            updatedAt: true,
            department: {
                select: { id: true, name: true },
            },
        },
    });

    await prisma.auditLog.create({
        data: {
            institutionId: auth.actor.institutionId,
            actorId: auth.actor.id,
            action: "admin.user.updated",
            entityType: "user",
            entityId: updated.id,
            metadata: {
                name: parsed.data.name ?? null,
                email: parsed.data.email ?? null,
                role: nextRole,
                departmentId: nextDepartmentId,
            },
        },
    });

    return NextResponse.json(buildUserResponse(updated));
}

export async function patchUserPassword(request: Request, context: RouteContext) {
    const auth = await getActor();
    if ("error" in auth) {
        return auth.error;
    }

    const { userId } = await context.params;
    if (!userId) {
        return NextResponse.json({ error: "User id is required" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid request body: " + parsed.error.message },
            { status: 400 },
        );
    }

    const targetUser = await getTargetUser(userId, auth.actor.institutionId);
    if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await prisma.user.update({
        where: { id: targetUser.id },
        data: { passwordHash },
    });

    await prisma.auditLog.create({
        data: {
            institutionId: auth.actor.institutionId,
            actorId: auth.actor.id,
            action: "admin.user.password_updated",
            entityType: "user",
            entityId: targetUser.id,
            metadata: { changed: true },
        },
    });

    return NextResponse.json({ ok: true });
}
