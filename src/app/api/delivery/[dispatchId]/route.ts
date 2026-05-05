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

        const studentIds: string[] = Array.from(
            new Set<string>(
                notificationLogs
                    .map((log: { studentId: string | null }) => log.studentId)
                    .filter((id: string | null): id is string => Boolean(id)),
            ),
        );
        const guardianIds: string[] = Array.from(
            new Set<string>(
                notificationLogs
                    .map((log: { guardianId: string | null }) => log.guardianId)
                    .filter((id: string | null): id is string => Boolean(id)),
            ),
        );

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
