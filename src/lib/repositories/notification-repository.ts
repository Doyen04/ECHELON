import { prisma } from "@/lib/db";

const db = prisma as any;

export async function findValidPortalToken(studentResultId: string, now: Date) {
    return db.portalToken.findFirst({
        where: {
            studentResultId,
            invalidated: false,
            expiresAt: { gt: now },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function createPortalToken(data: {
    studentResultId: string;
    token: string;
    expiresAt: Date;
}) {
    return db.portalToken.create({ data });
}

export async function createNotificationLog(input: any) {
    const data = input?.data ?? input;
    return db.notificationLog.create({ data });
}

export async function updateNotificationLog(id: string, data: any) {
    return db.notificationLog.update({
        where: { id },
        data,
    });
}

export async function incrementDispatchProgress(dispatchId: string, ok: boolean) {
    return db.notificationDispatch.update({
        where: { id: dispatchId },
        data: {
            status: "PROCESSING",
            sentCount: { increment: ok ? 1 : 0 },
            failedCount: { increment: ok ? 0 : 1 },
        },
    });
}

export async function findNotificationDispatchById(dispatchId: string) {
    return db.notificationDispatch.findUnique({ where: { id: dispatchId } });
}

export async function updateDispatchStatus(dispatchId: string, status: "PARTIAL_FAILURE" | "COMPLETE") {
    return db.notificationDispatch.update({
        where: { id: dispatchId },
        data: { status },
    });
}

export async function findStudentResultForDispatch(studentResultId: string) {
    return db.studentResult.findUnique({
        where: { id: studentResultId },
        include: {
            student: {
                include: {
                    institution: {
                        select: {
                            name: true,
                            logoUrl: true,
                        },
                    },
                    guardians: true,
                },
            },
            batch: {
                include: {
                    institution: {
                        select: {
                            name: true,
                            logoUrl: true,
                        },
                    },
                },
            },
        },
    });
}

export async function listFailedNotificationLogs(dispatchId: string) {
    return db.notificationLog.findMany({
        where: {
            dispatchId,
            status: "FAILED",
        },
        orderBy: { attemptedAt: "desc" },
        select: {
            id: true,
            dispatchId: true,
            studentResultId: true,
            failureReason: true,
            attemptedAt: true,
            student: {
                select: {
                    fullName: true,
                    matricNumber: true,
                    guardians: {
                        orderBy: { createdAt: "desc" },
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            relationship: true,
                        },
                    },
                },
            },
            guardian: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    relationship: true,
                },
            },
        },
    });
}

export async function findDispatchBatchSessionSemester(dispatchId: string) {
    return db.notificationDispatch.findUnique({
        where: { id: dispatchId },
        select: {
            batch: {
                select: {
                    session: true,
                    semester: true,
                },
            },
        },
    });
}

export async function findStudentResultForRetry(studentResultId: string) {
    return db.studentResult.findUnique({
        where: { id: studentResultId },
        select: {
            gpa: true,
            cgpa: true,
            courses: true,
            student: {
                select: {
                    fullName: true,
                    matricNumber: true,
                    department: true,
                    faculty: true,
                    level: true,
                    institution: {
                        select: {
                            name: true,
                            logoUrl: true,
                        },
                    },
                },
            },
            batch: {
                select: {
                    id: true,
                    session: true,
                    semester: true,
                    institution: {
                        select: {
                            name: true,
                            logoUrl: true,
                        },
                    },
                },
            },
        },
    });
}

export async function countNotificationLogsByStatus(dispatchId: string, status: "SENT" | "FAILED") {
    return db.notificationLog.count({
        where: { dispatchId, status },
    });
}

export async function updateNotificationDispatchCounts(dispatchId: string, sentCount: number, failedCount: number) {
    return db.notificationDispatch.update({
        where: { id: dispatchId },
        data: {
            sentCount,
            failedCount,
        },
    });
}

export async function findDispatchBatchWithApprovedResults(batchId: string) {
    return db.resultBatch.findUnique({
        where: { id: batchId },
        include: {
            studentResults: {
                where: { status: "APPROVED" },
                select: { id: true },
            },
        },
    });
}

export async function createNotificationDispatch(data: {
    batchId: string;
    triggeredById: string;
    totalCount: number;
    status: "QUEUED";
}) {
    return db.notificationDispatch.create({ data });
}

export async function createAuditLog(data: any) {
    return db.auditLog.create({ data });
}

export async function updateResultBatchStatus(batchId: string, status: "DISPATCHED") {
    return db.resultBatch.update({
        where: { id: batchId },
        data: { status },
    });
}

export async function getDashboardSnapshot(dashboardWindowStart: Date) {
    const [
        pendingReviewCount,
        approvedResultCount,
        sentCount,
        failedCount,
        dispatchRows,
        notificationRows,
        activityRows,
        dispatchFailureRows,
    ] = await Promise.all([
        db.studentResult.count({ where: { status: "PENDING" } }),
        db.studentResult.count({ where: { status: "APPROVED" } }),
        db.notificationLog.count({
            where: {
                attemptedAt: { gte: dashboardWindowStart },
                status: "SENT",
            },
        }),
        db.notificationLog.count({
            where: {
                attemptedAt: { gte: dashboardWindowStart },
                status: "FAILED",
            },
        }),
        db.notificationDispatch.findMany({
            take: 3,
            orderBy: { triggeredAt: "desc" },
            include: {
                batch: {
                    select: { department: true, session: true, semester: true },
                },
                notificationLogs: {
                    select: { status: true },
                },
            },
        }),
        db.notificationLog.findMany({
            where: { attemptedAt: { gte: dashboardWindowStart } },
            select: { studentResultId: true, channel: true, status: true },
        }),
        db.auditLog.findMany({
            take: 4,
            orderBy: { createdAt: "desc" },
            include: {
                actor: {
                    select: { name: true },
                },
            },
        }),
        db.notificationDispatch.findMany({
            take: 8,
            orderBy: { triggeredAt: "desc" },
            include: {
                batch: {
                    select: { department: true, session: true, semester: true },
                },
                notificationLogs: {
                    select: { status: true },
                },
            },
        }),
    ]);

    return {
        pendingReviewCount,
        approvedResultCount,
        sentCount,
        failedCount,
        dispatchRows,
        notificationRows,
        activityRows,
        dispatchFailureRows,
    };
}
