import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ studentId: string }> }
) {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const p = await params;
        const studentId = p.studentId;
        
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                guardians: true,
                studentResults: {
                    orderBy: { id: "desc" },
                    include: {
                        batch: true,
                        portalTokens: {
                            orderBy: { createdAt: "desc" },
                            take: 1,
                        },
                    },
                },
                notificationLogs: {
                    orderBy: {
                        attemptedAt: "desc",
                    },
                    take: 20,
                },
            },
        });

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        return NextResponse.json(student);
    } catch (error) {
        console.error("Error fetching student:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
