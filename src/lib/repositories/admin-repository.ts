import { prisma } from "@/lib/db";

const db = prisma as any;

export async function findStudentDetails(studentId: string) {
    return db.student.findUnique({
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
}

export async function findPortalTokenDetails(token: string) {
    return db.portalToken.findUnique({
        where: { token },
        include: {
            studentResult: {
                include: {
                    student: {
                        include: {
                            guardians: true,
                        },
                    },
                    batch: true,
                },
            },
        },
    });
}

export async function updatePortalTokenViewedAt(token: string, viewedAt: Date) {
    return db.portalToken.update({
        where: { token },
        data: { viewedAt },
    });
}

export async function listGuardiansWithStudent() {
    return db.guardian.findMany({
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
}

export async function findDispatchDetails(dispatchId: string) {
    return db.notificationDispatch.findUnique({
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
}

export async function listDispatchNotificationLogs(dispatchId: string) {
    return db.notificationLog.findMany({
        where: { dispatchId },
        orderBy: { attemptedAt: "desc" },
    });
}

export async function listStudentsByIds(studentIds: string[]) {
    if (studentIds.length === 0) {
        return [];
    }

    return db.student.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, fullName: true, matricNumber: true },
    });
}

export async function listGuardiansByIds(guardianIds: string[]) {
    if (guardianIds.length === 0) {
        return [];
    }

    return db.guardian.findMany({
        where: { id: { in: guardianIds } },
        select: { id: true, name: true },
    });
}

export async function listPendingAndReviewedBatches() {
    return Promise.all([
        db.resultBatch.findMany({
            where: { status: { in: ["PENDING", "IN_REVIEW"] } },
            orderBy: { uploadedAt: "desc" },
            include: {
                uploadedBy: { select: { name: true } },
                studentResults: { select: { status: true } },
            },
        }),
        db.resultBatch.findMany({
            where: { status: { in: ["APPROVED", "DISPATCHED"] } },
            orderBy: { approvedAt: "desc" },
            take: 12,
            include: {
                approvedBy: { select: { name: true } },
                studentResults: { select: { status: true } },
            },
        }),
    ]);
}

export async function listRecentDispatches() {
    return db.notificationDispatch.findMany({
        orderBy: { triggeredAt: "desc" },
        take: 25,
        include: {
            batch: { select: { department: true, session: true, semester: true } },
            triggeredBy: { select: { name: true } },
            _count: { select: { notificationLogs: true } },
        },
    });
}

export async function findBatchDetails(batchId: string) {
    return db.resultBatch.findUnique({
        where: { id: batchId },
        include: {
            uploadedBy: { select: { name: true } },
            approvedBy: { select: { name: true } },
            studentResults: {
                orderBy: { id: "desc" },
                include: {
                    student: { select: { fullName: true, matricNumber: true } },
                    portalTokens: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                    },
                },
            },
            dispatches: {
                orderBy: { triggeredAt: "desc" },
                take: 5,
                include: {
                    triggeredBy: { select: { name: true } },
                    _count: { select: { notificationLogs: true } },
                },
            },
        },
    });
}

export async function findBatchDispatchDetails(batchId: string) {
    return db.resultBatch.findUnique({
        where: { id: batchId },
        include: {
            uploadedBy: { select: { name: true } },
            studentResults: {
                select: { status: true },
            },
            dispatches: {
                orderBy: { triggeredAt: "desc" },
                include: {
                    triggeredBy: { select: { name: true } },
                    notificationLogs: {
                        select: { status: true },
                    },
                },
            },
        },
    });
}

export async function listBatchesSummary() {
    return db.resultBatch.findMany({
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
}

export async function findAuthUserByEmail(email: string) {
    return db.user.findUnique({
        where: { email },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            passwordHash: true,
        },
    });
}
