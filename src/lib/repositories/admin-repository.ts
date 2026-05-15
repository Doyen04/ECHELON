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

export async function listGuardiansWithStudent(options?: {
    skip?: number;
    take?: number;
    query?: string;
}) {
    const skip = options?.skip ?? 0;
    const take = options?.take ?? 50;
    const query = options?.query?.trim();

    const where = query
        ? {
              OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { relationship: { contains: query, mode: "insensitive" } },
                  { email: { contains: query, mode: "insensitive" } },
                  { phone: { contains: query, mode: "insensitive" } },
                  {
                      student: {
                          OR: [
                              { fullName: { contains: query, mode: "insensitive" } },
                              { matricNumber: { contains: query, mode: "insensitive" } },
                              { department: { contains: query, mode: "insensitive" } },
                          ],
                      },
                  },
              ],
          }
        : undefined;

    const [guardians, total] = await Promise.all([
        db.guardian.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
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
        }),
        db.guardian.count({ where }),
    ]);

    return { guardians, total };
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

export async function listDispatchNotificationLogs(
    dispatchId: string,
    options?: {
        skip?: number;
        take?: number;
        query?: string;
    },
) {
    const skip = options?.skip ?? 0;
    const take = options?.take ?? 20;
    const query = options?.query?.trim();

    const where = {
        dispatchId,
        ...(query
            ? {
                  OR: [
                      { status: { contains: query, mode: "insensitive" } },
                      { channel: { contains: query, mode: "insensitive" } },
                      { studentId: { contains: query, mode: "insensitive" } },
                      { guardianId: { contains: query, mode: "insensitive" } },
                      { failureReason: { contains: query, mode: "insensitive" } },
                      { providerMessageId: { contains: query, mode: "insensitive" } },
                  ],
              }
            : {}),
    };

    const [logs, total] = await Promise.all([
        db.notificationLog.findMany({
            where,
            orderBy: { attemptedAt: "desc" },
            skip,
            take,
        }),
        db.notificationLog.count({ where }),
    ]);

    return { logs, total };
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

export async function listPendingAndReviewedBatches(options?: {
    reviewedSkip?: number;
    reviewedTake?: number;
}) {
    const reviewedSkip = options?.reviewedSkip ?? 0;
    const reviewedTake = options?.reviewedTake ?? 12;

    const [pendingBatches, reviewedBatches, reviewedTotal] = await Promise.all([
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
            skip: reviewedSkip,
            take: reviewedTake,
            include: {
                approvedBy: { select: { name: true } },
                studentResults: { select: { status: true } },
            },
        }),
        db.resultBatch.count({
            where: { status: { in: ["APPROVED", "DISPATCHED"] } },
        }),
    ]);

    return { pendingBatches, reviewedBatches, reviewedTotal };
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

export async function findBatchDetails(
    batchId: string,
    options?: {
        skip?: number;
        take?: number;
        query?: string;
    },
) {
    const skip = options?.skip ?? 0;
    const take = options?.take ?? 10;
    const query = options?.query?.trim();

    const studentResultWhere = {
        batchId,
        ...(query
            ? {
                  student: {
                      OR: [
                          { fullName: { contains: query, mode: "insensitive" } },
                          { matricNumber: { contains: query, mode: "insensitive" } },
                      ],
                  },
              }
            : {}),
    };

    const [batch, studentResults, studentResultsTotal, statusGroups, gpaAggregate] = await Promise.all([
        db.resultBatch.findUnique({
            where: { id: batchId },
            include: {
                uploadedBy: { select: { name: true } },
                approvedBy: { select: { name: true } },
                dispatches: {
                    orderBy: { triggeredAt: "desc" },
                    take: 5,
                    include: {
                        triggeredBy: { select: { name: true } },
                        _count: { select: { notificationLogs: true } },
                    },
                },
            },
        }),
        db.studentResult.findMany({
            where: studentResultWhere,
            orderBy: { id: "desc" },
            skip,
            take,
            include: {
                student: { select: { fullName: true, matricNumber: true } },
                portalTokens: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        }),
        db.studentResult.count({ where: studentResultWhere }),
        db.studentResult.groupBy({
            by: ["status"],
            where: { batchId },
            _count: { _all: true },
        }),
        db.studentResult.aggregate({
            where: { batchId },
            _avg: { gpa: true },
        }),
    ]);

    if (!batch) {
        return null;
    }

    return {
        ...batch,
        studentResults,
        studentResultsTotal,
        statusCounts: statusGroups.reduce(
            (acc: Record<string, number>, row: { status: string; _count: { _all: number } }) => {
                acc[row.status] = row._count._all;
                return acc;
            },
            {},
        ),
        averageGpa: gpaAggregate?._avg?.gpa ?? null,
    };
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

export async function listBatchesSummary(options?: {
    skip?: number;
    take?: number;
    departmentId?: string | null;
    programId?: string | null;
    level?: string | null;
    query?: string | null;
}) {
    const skip = options?.skip ?? 0;
    const take = options?.take ?? 20;
    const departmentId = options?.departmentId;
    const programId = options?.programId;
    const level = options?.level;
    const query = options?.query?.trim();

    const where = {
        ...(departmentId ? { program: { departmentId } } : {}),
        ...(programId ? { programId } : {}),
        ...(level ? { level: Number(level) } : {}),
        ...(query
            ? {
                  OR: [
                      { id: { contains: query, mode: "insensitive" } },
                      { department: { contains: query, mode: "insensitive" } },
                      { session: { contains: query, mode: "insensitive" } },
                      { program: { name: { contains: query, mode: "insensitive" } } },
                  ],
              }
            : {}),
    };

    const [batches, total] = await Promise.all([
        db.resultBatch.findMany({
            where,
            orderBy: { uploadedAt: "desc" },
            skip,
            take,
            select: {
                id: true,
                session: true,
                semester: true,
                department: true,
                source: true,
                status: true,
                uploadedAt: true,
                level: true,
                program: { select: { name: true } },
                uploadedBy: { select: { name: true } },
                _count: {
                    select: {
                        studentResults: true,
                    },
                },
            },
        }),
        db.resultBatch.count({ where }),
    ]);

    return { batches, total };
}

export async function findAuthUserByEmail(email: string) {
    return db.user.findUnique({
        where: { email },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
            passwordHash: true,
        },
    });
}
