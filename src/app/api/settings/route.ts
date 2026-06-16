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

        const institution = await db.institution.findUnique({
            where: { id: institutionId },
            select: {
                id: true,
                name: true,
                logoUrl: true,
                contactEmail: true,
                gpaScale: true,
                messageTemplates: true,
            },
        });

        if (!institution) {
            return NextResponse.json({ error: "Institution not found" }, { status: 404 });
        }

        return NextResponse.json({ institution });
    } catch {
        return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await requireSuperAdminSession();
        const institutionId = await getInstitutionId(session.user.id);

        const body = await request.json();
        const { name, contactEmail, gpaScale, messageTemplates } = body;

        const updated = await db.institution.update({
            where: { id: institutionId },
            data: {
                ...(name !== undefined && { name }),
                ...(contactEmail !== undefined && { contactEmail }),
                ...(gpaScale !== undefined && { gpaScale }),
                ...(messageTemplates !== undefined && { messageTemplates }),
            },
            select: {
                id: true,
                name: true,
                logoUrl: true,
                contactEmail: true,
                gpaScale: true,
                messageTemplates: true,
            },
        });

        return NextResponse.json({ institution: updated });
    } catch {
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
}
