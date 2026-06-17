import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireSuperAdminSession } from "@/lib/super-admin-session";

const db = prisma as any;

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await requireSuperAdminSession();
        const { id } = await params;

        if (id === session.user.id) {
            return NextResponse.json({ error: "You cannot remove your own account" }, { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await db.user.delete({ where: { id } });

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Failed to remove user" }, { status: 500 });
    }
}
