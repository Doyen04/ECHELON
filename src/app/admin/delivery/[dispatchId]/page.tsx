import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";

import { RetryFailedSendsButton } from "@/components/admin/retry-failed-sends-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, ChannelBadge } from "@/components/ui/badges";
import { prisma } from "@/lib/db";
// Ensure this page always fetches fresh data from the database
export const dynamic = "force-dynamic";

type DeliveryPageProps = {
    params: Promise<{
        dispatchId: string;
    }>;
};

export const metadata: Metadata = {
    title: "Delivery Log",
    description: "Dispatch delivery detail and notification logs.",
};

function formatDateTime(value: Date | string | null | undefined) {
    if (!value) {
        return "N/A";
    }

    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

export default async function DeliveryLogPage({ params }: DeliveryPageProps) {
    const db = prisma as any;
    const { dispatchId } = await params;

    if (!dispatchId) {
        notFound();
    }

    const dispatch = await db.notificationDispatch.findUnique({
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
        notFound();
    }

    const notificationLogs = await db.notificationLog.findMany({
        where: { dispatchId },
        orderBy: { attemptedAt: "desc" },
    });

    const studentIds = [...new Set(notificationLogs.map((log: any) => log.studentId).filter(Boolean))];
    const guardianIds = [...new Set(notificationLogs.map((log: any) => log.guardianId).filter(Boolean))];

    const [students, guardians] = await Promise.all([
        studentIds.length > 0
            ? db.student.findMany({
                where: { id: { in: studentIds } },
                select: { id: true, fullName: true, matricNumber: true },
            })
            : [],
        guardianIds.length > 0
            ? db.guardian.findMany({
                where: { id: { in: guardianIds } },
                select: { id: true, name: true },
            })
            : [],
    ]);

    const studentById = new Map(students.map((student: any) => [student.id, student]));
    const guardianById = new Map(guardians.map((guardian: any) => [guardian.id, guardian]));

    const total = dispatch.totalCount ?? notificationLogs.length;
    const sent = dispatch.sentCount ?? 0;
    const failed = dispatch.failedCount ?? 0;
    const processed = sent + failed;
    const queued = Math.max(total - processed, 0);
    const successRate = total === 0 ? 0 : Math.round((sent / total) * 100);

    return (
        <div className="dashboard-root min-h-screen bg-background">
            <PageHeader
                title="Delivery Log"
                breadcrumbs={
                    <div className="flex items-center gap-1">
                        <Link href="/admin/delivery" className="hover:text-foreground transition-colors">
                            Delivery
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">{dispatch.id}</span>
                    </div>
                }
                action={
                    <Button variant="outline" className="rounded-full">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                }
            />

            <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <Card className="rounded-3xl p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                                Dispatch Activity
                            </p>
                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                                {dispatch.batch.department}
                            </h1>
                            <p className="mt-2 text-sm text-(--text-secondary)">
                                {dispatch.batch.session} • {String(dispatch.batch.semester).toLowerCase()} semester • Triggered by {dispatch.triggeredBy?.name ?? "System"}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <StatusBadge status={String(dispatch.status).toLowerCase() as any} />
                            <Badge variant="outline" className="rounded-full px-2.5 py-1 text-xs font-medium">
                                {dispatch.id}
                            </Badge>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard title="Total Logs" value={String(total)} />
                        <SummaryCard title="Sent" value={`${sent}`} subvalue={`${successRate}%`} color="text-[var(--color-success)]" />
                        <SummaryCard title="Failed" value={String(failed)} color="text-[var(--color-danger)]" />
                        <SummaryCard title="Queued" value={String(queued)} />
                    </div>

                    <div className="mt-6 rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-5">
                        <div className="flex items-center justify-between gap-3 text-sm font-medium">
                            <span className="text-foreground">Dispatch Progress</span>
                            <span className="text-(--text-secondary)">{processed} processed</span>
                        </div>
                        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-(--surface-muted)">
                            <div className="h-full bg-emerald-500" style={{ width: `${total === 0 ? 0 : (sent / total) * 100}%` }} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium">
                            <span className="text-(--text-secondary)">Sent: {sent}</span>
                            <span className="text-(--text-secondary)">Failed: {failed}</span>
                            <span className="text-(--text-secondary)">Queued: {queued}</span>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
                        <article className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Dispatch Details</p>
                            <div className="mt-4 space-y-3 text-sm text-(--text-secondary)">
                                <p><span className="text-foreground font-medium">Batch:</span> {dispatch.batch.department}</p>
                                <p><span className="text-foreground font-medium">Triggered:</span> {formatDateTime(dispatch.triggeredAt)}</p>
                                <p><span className="text-foreground font-medium">Total Count:</span> {total}</p>
                                <p><span className="text-foreground font-medium">Processed:</span> {processed}</p>
                            </div>
                        </article>

                        <article className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Quick Actions</p>
                            <div className="mt-4 flex flex-col gap-3">
                                <RetryFailedSendsButton dispatchId={dispatch.id} failedCount={dispatch.failedCount ?? failed} />
                                <Button asChild className="rounded-full">
                                    <Link href="/admin/delivery">Back to dispatch list</Link>
                                </Button>
                            </div>
                        </article>
                    </div>
                </Card>

                <Card className="mt-6 overflow-hidden rounded-3xl shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)]">
                    <div className="border-b border-(--border-subtle) px-6 py-4 sm:px-8">
                        <h2 className="text-lg font-semibold text-foreground">Notification Logs</h2>
                        <p className="mt-1 text-sm text-(--text-secondary)">
                            Each row reflects one guardian notification attempt for this dispatch.
                        </p>
                    </div>

                    {notificationLogs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border-subtle">
                                <thead className="bg-surface-subtle/40">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Guardian</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Channel</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Attempted At</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle bg-surface-main">
                                    {notificationLogs.map((log: any) => {
                                        const student = studentById.get(log.studentId);
                                        const guardian = log.guardianId ? guardianById.get(log.guardianId) : null;

                                        return (
                                        <tr key={log.id} className="hover:bg-surface-subtle/30 transition-colors">
                                            <td className="px-6 py-4 text-sm text-foreground">
                                                <div className="font-medium">{student?.fullName ?? "Unknown student"}</div>
                                                <div className="mt-1 text-xs text-(--text-muted)">{student?.matricNumber ?? log.studentId}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-foreground">
                                                {guardian?.name ?? "Unknown guardian"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <ChannelBadge channel={String(log.channel).toLowerCase() as any} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={String(log.status).toLowerCase() as any} />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-(--text-secondary)">{formatDateTime(log.attemptedAt)}</td>
                                            <td className="px-6 py-4 text-sm text-(--text-secondary)">
                                                {log.failureReason ?? log.providerMessageId ?? "Delivered successfully"}
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="px-6 py-10 text-sm text-(--text-secondary)">
                            No notification logs are available for this dispatch yet.
                        </div>
                    )}
                </Card>
            </main>
        </div>
    );
}

function SummaryCard({ title, value, subvalue, color }: any) {
    return (
        <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-5 shadow-sm flex flex-col justify-between">
            <div className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">{title}</div>
            <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-serif ${color ? color : "text-foreground"}`}>{value}</span>
                {subvalue && <span className="text-sm font-medium text-text-muted">{subvalue}</span>}
            </div>
        </div>
    );
}