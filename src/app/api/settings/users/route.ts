import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

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

export async function GET() {
    try {
        const session = await requireSuperAdminSession();
        const institutionId = await getInstitutionId(session.user.id);

        const users = await db.user.findMany({
            where: { institutionId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({ users });
    } catch {
        return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await requireSuperAdminSession();
        const institutionId = await getInstitutionId(session.user.id);

        const body = await request.json();
        const { name, email, password, role } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
        }

        const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existing) {
            return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await db.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                passwordHash,
                role: role ?? "super_admin",
                institutionId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ user }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}
