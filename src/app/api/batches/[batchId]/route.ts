import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ batchId: string }> }
) {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const p = await params;
        const batchId = p.batchId;

        const batch = await prisma.resultBatch.findUnique({
            where: { id: batchId },
            include: {
                uploadedBy: { select: { name: true } },
                approvedBy: { select: { name: true } },
                studentResults: {
                    orderBy: { id: "desc" },
                    take: 100,
                    select: {
                        id: true,
                        gpa: true,
                        cgpa: true,
                        status: true,
                        withheldReason: true,
                        student: { select: { fullName: true, matricNumber: true } },
                        portalTokens: {
                            orderBy: { createdAt: "desc" },
                            take: 1,
                            select: { token: true, expiresAt: true, createdAt: true }
                        },
                    },
                },
                dispatches: {
                    orderBy: { triggeredAt: "desc" },
                    take: 5,
                    select: {
                        id: true,
                        status: true,
                        triggeredAt: true,
                        totalCount: true,
                        sentCount: true,
                        failedCount: true,
                        triggeredBy: { select: { name: true } },
                        _count: { select: { notificationLogs: true } },
                    },
                },
            },
        });

        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        return NextResponse.json(batch);
    } catch (error) {
        console.error("Error fetching batch details:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
