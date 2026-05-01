import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET() {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const guardians = await prisma.guardian.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        matricNumber: true,
                        department: true,
                        faculty: true,
                        level: true,
                    },
                },
            },
        });

        return NextResponse.json({ guardians });
    } catch (error) {
        console.error("Error fetching guardians:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
