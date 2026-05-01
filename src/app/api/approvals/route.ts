import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET() {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {

        const [pendingBatches, reviewedBatches] = await Promise.all([
            prisma.resultBatch.findMany({
                where: { status: { in: ["PENDING", "IN_REVIEW"] } },
                orderBy: { uploadedAt: "desc" },
                include: {
                    uploadedBy: { select: { name: true } },
                    studentResults: { select: { status: true } },
                },
            }),
            prisma.resultBatch.findMany({
                where: { status: { in: ["APPROVED", "DISPATCHED"] } },
                orderBy: { approvedAt: "desc" },
                take: 12,
                include: {
                    approvedBy: { select: { name: true } },
                    studentResults: { select: { status: true } },
                },
            }),
        ]);

        return NextResponse.json({ pendingBatches, reviewedBatches });
    } catch (error) {
        console.error("Error fetching approvals:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
