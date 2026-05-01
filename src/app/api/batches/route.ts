import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET() {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const batches = await prisma.resultBatch.findMany({
            orderBy: { uploadedAt: "desc" },
            take: 100,
            select: {
                id: true,
                session: true,
                semester: true,
                department: true,
                source: true,
                status: true,
                uploadedAt: true,
                uploadedBy: { select: { name: true } },
                _count: {
                    select: {
                        studentResults: true,
                    },
                },
            },
        });

        return NextResponse.json(batches);
    } catch (error) {
        console.error("Error fetching batches:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
