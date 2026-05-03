import { NextResponse } from "next/server";
import {
    findDispatchDetails,
    listDispatchNotificationLogs,
    listGuardiansByIds,
    listStudentsByIds,
} from "@/lib/repositories/admin-repository";
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

        const dispatch = await findDispatchDetails(dispatchId);

        if (!dispatch) {
            return NextResponse.json({ error: "Dispatch not found" }, { status: 404 });
        }

        const notificationLogs = await listDispatchNotificationLogs(dispatchId);

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
            listStudentsByIds(studentIds),
            listGuardiansByIds(guardianIds),
        ]);

        return NextResponse.json({ dispatch, notificationLogs, students, guardians });
    } catch (error) {
        console.error("Error fetching dispatch details:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
