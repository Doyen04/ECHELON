import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ dispatchId: string }> }
) {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const p = await params;
        const dispatchId = p.dispatchId;

        const dispatch = await prisma.notificationDispatch.findUnique({
            where: { id: dispatchId },
            include: {
                batch: {
                    select: { department: true, session: true, semester: true },
                },
                triggeredBy: {
                    select: { name: true },
                },
            },
        });

        if (!dispatch) {
            return NextResponse.json({ error: "Dispatch not found" }, { status: 404 });
        }

        const notificationLogs = await prisma.notificationLog.findMany({
            where: { dispatchId },
            orderBy: { attemptedAt: "desc" },
        });

        const studentIds = [
            ...new Set(
                notificationLogs.map((log) => log.studentId).filter(Boolean),
            ),
        ] as string[];
        const guardianIds = [
            ...new Set(
                notificationLogs.map((log) => log.guardianId).filter(Boolean),
            ),
        ] as string[];

        const [students, guardians] = await Promise.all([
            studentIds.length > 0
                ? prisma.student.findMany({
                    where: { id: { in: studentIds } },
                    select: { id: true, fullName: true, matricNumber: true },
                })
                : [],
            guardianIds.length > 0
                ? prisma.guardian.findMany({
                    where: { id: { in: guardianIds } },
                    select: { id: true, name: true },
                })
                : [],
        ]);

        return NextResponse.json({ dispatch, notificationLogs, students, guardians });
    } catch (error) {
        console.error("Error fetching dispatch details:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
