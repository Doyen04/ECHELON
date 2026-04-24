import {
    approvalBatches,
    channelDelivery,
    dispatchQueue,
    recentActivity,
    summaryMetrics,
    type ActivityLog,
    type ApprovalBatch,
    type ChannelDelivery,
    type DashboardNotification,
    type DispatchQueueEntry,
    type DispatchStatus,
    type Semester,
    type SummaryMetric,
    type TrendDirection,
} from "@/lib/dashboard-data";
import { prisma } from "@/lib/db";

export type DashboardViewData = {
    summaryMetrics: SummaryMetric[];
    approvalBatches: ApprovalBatch[];
    dispatchQueue: DispatchQueueEntry[];
    channelDelivery: ChannelDelivery[];
    recentActivity: ActivityLog[];
    notifications: DashboardNotification[];
};

function toSemester(value: string): Semester {
    const normalized = value.toLowerCase();
    if (normalized === "first") {
        return "first";
    }
    if (normalized === "second") {
        return "second";
    }
    return "third";
}

function toDispatchStatus(value: string): DispatchStatus {
    const normalized = value.toLowerCase();
    if (normalized === "processing") {
        return "processing";
    }
    if (normalized === "complete") {
        return "complete";
    }
    if (normalized === "partial_failure") {
        return "partial_failure";
    }
    return "queued";
}

function numberLabel(value: number) {
    return new Intl.NumberFormat("en-US").format(value);
}

function relativeTimeFromNow(date: Date | null | undefined) {
    if (!date) {
        return "N/A";
    }

    const now = Date.now();
    const diffMs = Math.max(now - date.getTime(), 0);
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
        return "just now";
    }
    if (diffMinutes < 60) {
        return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
        return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function metricTrend(value: number, threshold: number): TrendDirection {
    if (value > threshold) {
        return "up";
    }
    if (value < threshold) {
        return "down";
    }
    return "steady";
}

function fallbackDashboardData(): DashboardViewData {
    return {
        summaryMetrics,
        approvalBatches,
        dispatchQueue,
        channelDelivery,
        recentActivity,
        notifications: [],
    };
}

export async function getDashboardViewData(): Promise<DashboardViewData> {
    const db = prisma as any;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    try {
        const [
            pendingReviewCount,
            approvedResultCount,
            attemptedDeliveries,
            deliveredCount,
            batchRows,
            dispatchRows,
            notificationRows,
            activityRows,
            dispatchFailureRows,
        ] = await Promise.all([
            db.studentResult.count({ where: { status: "PENDING" } }),
            db.studentResult.count({ where: { status: "APPROVED" } }),
            db.notificationLog.count({
                where: {
                    attemptedAt: { gte: sevenDaysAgo },
                    status: { in: ["SENT", "DELIVERED", "FAILED"] },
                },
            }),
            db.notificationLog.count({
                where: {
                    attemptedAt: { gte: sevenDaysAgo },
                    status: "DELIVERED",
                },
            }),
            db.resultBatch.findMany({
                take: 4,
                orderBy: { uploadedAt: "desc" },
                include: {
                    studentResults: {
                        include: {
                            student: {
                                include: { guardians: true },
                            },
                        },
                    },
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
                where: { attemptedAt: { gte: sevenDaysAgo } },
                select: { channel: true, status: true },
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
                        where: { channel: "EMAIL" },
                        select: { status: true },
                    },
                },
            }),
        ]);

        const deliveryRate =
            attemptedDeliveries === 0
                ? 0
                : Number(((deliveredCount / attemptedDeliveries) * 100).toFixed(1));

        const metrics: SummaryMetric[] = [
            {
                label: "Pending Result Reviews",
                value: numberLabel(pendingReviewCount),
                change: "Live",
                trend: "steady",
                helper: "Across active batches",
            },
            {
                label: "Approved For Dispatch",
                value: numberLabel(approvedResultCount),
                change: "Live",
                trend: metricTrend(approvedResultCount, 0),
                helper: "Ready for notification queue",
            },
            {
                label: "Delivery Success Rate",
                value: `${deliveryRate}%`,
                change: "7 days",
                trend: metricTrend(deliveryRate, 95),
                helper: "From attempted notifications",
            },
        ];

        const approvalRows: ApprovalBatch[] = batchRows.map((batch: any) => {
            const pending = batch.studentResults.filter(
                (result: any) => result.status === "PENDING",
            ).length;
            const approved = batch.studentResults.filter(
                (result: any) => result.status === "APPROVED",
            ).length;
            const withheld = batch.studentResults.filter(
                (result: any) => result.status === "WITHHELD",
            ).length;

            const studentIds = new Set<string>();
            const coveredStudentIds = new Set<string>();

            batch.studentResults.forEach((result: any) => {
                studentIds.add(result.studentId);

                const hasValidContact = result.student.guardians.some(
                    (guardian: any) => guardian.phone || guardian.email,
                );

                if (hasValidContact) {
                    coveredStudentIds.add(result.studentId);
                }
            });

            const totalStudents = studentIds.size;
            const contactCoverage =
                totalStudents === 0
                    ? 0
                    : Math.round((coveredStudentIds.size / totalStudents) * 100);

            return {
                id: batch.id,
                department: batch.department,
                session: batch.session,
                semester: toSemester(batch.semester),
                pending,
                approved,
                withheld,
                contactCoverage,
                lastActionAt: relativeTimeFromNow(batch.approvedAt ?? batch.uploadedAt),
            } satisfies ApprovalBatch;
        });

        const dispatchRowsMapped: DispatchQueueEntry[] = dispatchRows.map(
            (dispatch: any) => {
                const attempted = dispatch.notificationLogs.filter(
                    (log: any) => log.status !== "QUEUED",
                ).length;
                const successful = dispatch.notificationLogs.filter(
                    (log: any) => log.status === "SENT" || log.status === "DELIVERED",
                ).length;
                const successRate =
                    attempted === 0
                        ? 0
                        : Number(((successful / attempted) * 100).toFixed(1));

                const status = toDispatchStatus(dispatch.status);
                const processedStudents = dispatch.sentCount + dispatch.failedCount;

                return {
                    id: dispatch.id,
                    batchLabel: `${dispatch.batch.department} | ${dispatch.batch.session} | ${dispatch.batch.semester}`,
                    totalStudents: dispatch.totalCount,
                    processedStudents,
                    successRate,
                    eta:
                        status === "complete"
                            ? "Completed"
                            : status === "queued"
                                ? "Queued"
                                : "Processing",
                    status,
                } satisfies DispatchQueueEntry;
            },
        );

        const channelMap: Record<"whatsapp" | "email" | "sms", ChannelDelivery> = {
            whatsapp: {
                channel: "whatsapp",
                queued: 0,
                sent: 0,
                delivered: 0,
                failed: 0,
            },
            email: {
                channel: "email",
                queued: 0,
                sent: 0,
                delivered: 0,
                failed: 0,
            },
            sms: {
                channel: "sms",
                queued: 0,
                sent: 0,
                delivered: 0,
                failed: 0,
            },
        };

        notificationRows.forEach((row: any) => {
            const channel = row.channel.toLowerCase() as "whatsapp" | "email" | "sms";
            const status = row.status.toLowerCase();

            if (status === "queued") {
                channelMap[channel].queued += 1;
            } else if (status === "sent") {
                channelMap[channel].sent += 1;
            } else if (status === "delivered") {
                channelMap[channel].delivered += 1;
            } else if (status === "failed") {
                channelMap[channel].failed += 1;
            }
        });

        const activities: ActivityLog[] = activityRows.map((row: any) => ({
            id: row.id,
            actor: row.actor?.name ?? "System",
            role: "super_admin",
            action: row.action,
            target: `${row.entityType} ${row.entityId}`,
            time: row.createdAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        }));

        const notifications: DashboardNotification[] = dispatchFailureRows
            .map((dispatch: any) => {
                const emailLogs = dispatch.notificationLogs as Array<{ status: string }>;
                const attempts = emailLogs.filter((log) => log.status !== "QUEUED").length;
                const failed = emailLogs.filter((log) => log.status === "FAILED").length;

                if (attempts === 0 || failed === 0) {
                    return null;
                }

                const allFailed = failed === attempts;
                const batchLabel = `${dispatch.batch.department} | ${dispatch.batch.session} | ${dispatch.batch.semester}`;

                return {
                    id: `dispatch-${dispatch.id}`,
                    title: allFailed
                        ? "All email deliveries failed"
                        : "Some email deliveries failed",
                    detail: allFailed
                        ? `${failed}/${attempts} email attempts failed for ${batchLabel}.`
                        : `${failed}/${attempts} email attempts failed for ${batchLabel}.`,
                    time: relativeTimeFromNow(dispatch.triggeredAt),
                    level: allFailed ? "error" : "warning",
                } satisfies DashboardNotification;
            })
            .filter((item: DashboardNotification | null): item is DashboardNotification => Boolean(item));

        return {
            summaryMetrics: metrics,
            approvalBatches: approvalRows.length > 0 ? approvalRows : approvalBatches,
            dispatchQueue: dispatchRowsMapped.length > 0 ? dispatchRowsMapped : dispatchQueue,
            channelDelivery: Object.values(channelMap),
            recentActivity: activities.length > 0 ? activities : recentActivity,
            notifications,
        };
    } catch {
        return fallbackDashboardData();
    }
}
