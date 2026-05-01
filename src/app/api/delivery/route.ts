import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET() {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const dispatches = await prisma.notificationDispatch.findMany({
            orderBy: { triggeredAt: "desc" },
            take: 25,
            include: {
                batch: { select: { department: true, session: true, semester: true } },
                triggeredBy: { select: { name: true } },
                _count: { select: { notificationLogs: true } },
            },
        });

        return NextResponse.json({ dispatches });
    } catch (error) {
        console.error("Error fetching dispatches:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
