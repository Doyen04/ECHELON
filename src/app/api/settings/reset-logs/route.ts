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

export async function POST() {
    try {
        const session = await requireSuperAdminSession();
        const institutionId = await getInstitutionId(session.user.id);

        // Find all dispatch IDs for this institution's batches
        const batches = await db.resultBatch.findMany({
            where: { institutionId },
            select: { id: true },
        });
        const batchIds = batches.map((b: any) => b.id);

        const dispatches = await db.notificationDispatch.findMany({
            where: { batchId: { in: batchIds } },
            select: { id: true },
        });
        const dispatchIds = dispatches.map((d: any) => d.id);

        const result = await db.notificationLog.deleteMany({
            where: { dispatchId: { in: dispatchIds } },
        });

        return NextResponse.json({ deleted: result.count });
    } catch {
        return NextResponse.json({ error: "Failed to reset logs" }, { status: 500 });
    }
}
