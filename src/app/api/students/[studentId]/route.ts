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
            select: {
                id: true,
                fullName: true,
                matricNumber: true,
                department: true,
                faculty: true,
                level: true,
                guardians: true,
                studentResults: {
                    orderBy: { id: "desc" },
                    select: {
                        id: true,
                        gpa: true,
                        cgpa: true,
                        status: true,
                        batchId: true,
                        batch: {
                            select: {
                                session: true,
                                semester: true,
                            }
                        },
                        portalTokens: {
                            orderBy: { createdAt: "desc" },
                            take: 1,
                            select: { token: true, expiresAt: true }
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
