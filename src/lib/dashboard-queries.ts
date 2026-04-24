import {
    type ActivityLog,
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

function emptySummaryMetrics(): SummaryMetric[] {
    return [
        {
            label: "Pending Result Reviews",
            value: "0",
            change: "Live",
            trend: "steady",
            helper: "Across active batches",
        },
        {
            label: "Approved For Dispatch",
            value: "0",
            change: "Live",
            trend: "steady",
            helper: "Ready for notification queue",
        },
        {
            label: "Delivery Success Rate",
            value: "0%",
            change: "7 days",
            trend: "steady",
            helper: "From attempted notifications",
        },
    ];
}

function fallbackDashboardData(): DashboardViewData {
    return {
        summaryMetrics: emptySummaryMetrics(),
        dispatchQueue: [],
        channelDelivery: [],
        recentActivity: [],
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
                    attemptedAt: { gte: sevenDaysAgo },
                    status: "SENT",
                },
            }),
            db.notificationLog.count({
                where: {
                    attemptedAt: { gte: sevenDaysAgo },
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
                where: { attemptedAt: { gte: sevenDaysAgo } },
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
                        where: { channel: "EMAIL" },
                        select: { status: true },
                    },
                },
            }),
        ]);

        const totalAttempted = sentCount + failedCount;
        const deliveryRate =
            totalAttempted === 0
                ? 0
                : Number(((sentCount / totalAttempted) * 100).toFixed(1));


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



        const dispatchRowsMapped: DispatchQueueEntry[] = dispatchRows.map(
            (dispatch: any) => {
                const attempted = dispatch.notificationLogs.filter(
                    (log: any) => log.status !== "QUEUED",
                ).length;
                const successful = dispatch.notificationLogs.filter(
                    (log: any) => log.status === "SENT",
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
                failed: 0,
            },
            email: {
                channel: "email",
                queued: 0,
                sent: 0,
                failed: 0,
            },
            sms: {
                channel: "sms",
                queued: 0,
                sent: 0,
                failed: 0,
            },
        };

        const channelPriority: Record<"email" | "whatsapp" | "sms", number> = {
            email: 3,
            whatsapp: 2,
            sms: 1,
        };

        const studentOutcomeMap = new Map<string, {
            sentChannel: "whatsapp" | "email" | "sms" | null;
            failedChannel: "whatsapp" | "email" | "sms" | null;
            hasQueued: boolean;
        }>();

        notificationRows.forEach((row: any) => {
            const key = String(row.studentResultId ?? "");
            const channel = row.channel.toLowerCase() as "whatsapp" | "email" | "sms";
            const status = row.status.toLowerCase();

            if (!key) {
                return;
            }

            const current = studentOutcomeMap.get(key) ?? {
                sentChannel: null,
                failedChannel: null,
                hasQueued: false,
            };

            if (status === "queued") {
                current.hasQueued = true;
            } else if (status === "sent") {
                if (!current.sentChannel || channelPriority[channel] > channelPriority[current.sentChannel]) {
                    current.sentChannel = channel;
                }
            } else if (status === "failed") {
                if (!current.failedChannel || channelPriority[channel] > channelPriority[current.failedChannel]) {
                    current.failedChannel = channel;
                }
            }

            studentOutcomeMap.set(key, current);
        });

        studentOutcomeMap.forEach((outcome) => {
            if (outcome.sentChannel) {
                channelMap[outcome.sentChannel].sent += 1;
                return;
            }

            if (outcome.failedChannel) {
                channelMap[outcome.failedChannel].failed += 1;
                return;
            }

            if (outcome.hasQueued) {
                channelMap.email.queued += 1;
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
            dispatchQueue: dispatchRowsMapped,
            channelDelivery: Object.values(channelMap),
            recentActivity: activities,
            notifications,
        };
    } catch {
        return fallbackDashboardData();
    }
}
