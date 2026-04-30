import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { ExportButton } from "@/components/admin/export-button";
import { RetryFailedSendsButton } from "@/components/admin/retry-failed-sends-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, ChannelBadge } from "@/components/ui/badges";
import { DataTable } from "@/components/ui/data-table";
import type { DataTableColumn } from "@/components/ui/data-table";
import { prisma } from "@/lib/db";

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
    if (!value) return "N/A";
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

type NotificationLogRow = {
    id: string;
    studentName: string;
    matricNumber: string;
    guardianName: string;
    channel: string;
    status: string;
    attemptedAt: Date | string | null;
    detail: string;
};

export default async function DeliveryLogPage({ params }: DeliveryPageProps) {
    const db = prisma as any;
    const { dispatchId } = await params;

    if (!dispatchId) notFound();

    const dispatch = await db.notificationDispatch.findUnique({
        where: { id: dispatchId },
        include: {
            batch: { select: { department: true, session: true, semester: true } },
            triggeredBy: { select: { name: true } },
        },
    });

    if (!dispatch) notFound();

    const notificationLogs = await db.notificationLog.findMany({
        where: { dispatchId },
        orderBy: { attemptedAt: "desc" },
    });

    const studentIds = [...new Set(notificationLogs.map((l: any) => l.studentId).filter(Boolean))];
    const guardianIds = [...new Set(notificationLogs.map((l: any) => l.guardianId).filter(Boolean))];

    const [students, guardians] = await Promise.all([
        studentIds.length > 0
            ? db.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, fullName: true, matricNumber: true } })
            : [],
        guardianIds.length > 0
            ? db.guardian.findMany({ where: { id: { in: guardianIds } }, select: { id: true, name: true } })
            : [],
    ]);

    const studentById = new Map(students.map((s: any) => [s.id, s]));
    const guardianById = new Map(guardians.map((g: any) => [g.id, g]));

    const total = dispatch.totalCount ?? notificationLogs.length;
    const sent = dispatch.sentCount ?? 0;
    const failed = dispatch.failedCount ?? 0;
    const processed = sent + failed;
    const queued = Math.max(total - processed, 0);
    const successRate = total === 0 ? 0 : Math.round((sent / total) * 100);

    const logRows: NotificationLogRow[] = notificationLogs.map((log: any) => {
        const student = studentById.get(log.studentId) as any;
        const guardian = log.guardianId ? guardianById.get(log.guardianId) as any : null;
        return {
            id: log.id,
            studentName: student?.fullName ?? "Unknown student",
            matricNumber: student?.matricNumber ?? log.studentId,
            guardianName: guardian?.name ?? "Unknown guardian",
            channel: String(log.channel).toLowerCase(),
            status: String(log.status).toLowerCase(),
            attemptedAt: log.attemptedAt,
            detail: log.failureReason ?? log.providerMessageId ?? "Delivered successfully",
        };
    });

    const logColumns: DataTableColumn<NotificationLogRow>[] = [
        {
            header: "Student",
            cell: (row) => (
                <div>
                    <div className="font-medium text-foreground">{row.studentName}</div>
                    <div className="mt-0.5 text-xs text-text-muted">{row.matricNumber}</div>
                </div>
            ),
        },
        {
            header: "Guardian",
            cell: (row) => <span className="text-foreground">{row.guardianName}</span>,
        },
        {
            header: "Channel",
            cell: (row) => <ChannelBadge channel={row.channel as any} />,
            hideOnMobile: true,
        },
        {
            header: "Status",
            cell: (row) => <StatusBadge status={row.status as any} />,
        },
        {
            header: "Attempted At",
            cell: (row) => <span className="text-muted-foreground">{formatDateTime(row.attemptedAt)}</span>,
            hideOnMobile: true,
        },
        {
            header: "Details",
            cell: (row) => <span className="text-muted-foreground">{row.detail}</span>,
            hideOnMobile: true,
        },
    ];

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-background">
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
                    <ExportButton
                        endpoint={`/api/delivery/${dispatch.id}/export`}
                        filename={`delivery-${dispatch.id}.csv`}
                    />
                }
            />

            <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                {/* ── Overview Card ── */}
                <Card className="p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                Dispatch Activity
                            </p>
                            <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-foreground">
                                {dispatch.batch.department}
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {dispatch.batch.session} • {String(dispatch.batch.semester).toLowerCase()} semester •
                                Triggered by {dispatch.triggeredBy?.name ?? "System"}
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

                    {/* ── Progress Bar ── */}
                    <div className="mt-6 rounded-2xl border border-border/60 bg-muted/30 p-5">
                        <div className="flex items-center justify-between gap-3 text-sm font-medium">
                            <span className="text-foreground">Dispatch Progress</span>
                            <span className="text-muted-foreground">{processed} processed</span>
                        </div>
                        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${total === 0 ? 0 : (sent / total) * 100}%` }} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
                            <span>Sent: {sent}</span>
                            <span>Failed: {failed}</span>
                            <span>Queued: {queued}</span>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
                        <article className="rounded-2xl border border-border/60 bg-muted/30 p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Dispatch Details</p>
                            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                                <p><span className="text-foreground font-medium">Batch:</span> {dispatch.batch.department}</p>
                                <p><span className="text-foreground font-medium">Triggered:</span> {formatDateTime(dispatch.triggeredAt)}</p>
                                <p><span className="text-foreground font-medium">Total Count:</span> {total}</p>
                                <p><span className="text-foreground font-medium">Processed:</span> {processed}</p>
                            </div>
                        </article>

                        <article className="rounded-2xl border border-border/60 bg-muted/30 p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Quick Actions</p>
                            <div className="mt-4 flex flex-col gap-3">
                                <RetryFailedSendsButton dispatchId={dispatch.id} failedCount={dispatch.failedCount ?? failed} />
                                <Button asChild className="rounded-full">
                                    <Link href="/admin/delivery">Back to dispatch list</Link>
                                </Button>
                            </div>
                        </article>
                    </div>
                </Card>

                {/* ── Notification Logs Table ── */}
                <div className="space-y-3">
                    <div className="px-1">
                        <h2 className="font-serif text-lg font-semibold text-foreground">Notification Logs</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Each row reflects one guardian notification attempt for this dispatch.
                        </p>
                    </div>
                    <DataTable
                        columns={logColumns}
                        data={logRows}
                        rowKey={(row) => row.id}
                        emptyMessage="No notification logs are available for this dispatch yet."
                        className="shadow-sm"
                    />
                </div>
            </main>
        </div>
    );
}

function SummaryCard({ title, value, subvalue, color }: any) {
    return (
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-5 shadow-sm flex flex-col justify-between">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{title}</div>
            <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-serif ${color ? color : "text-foreground"}`}>{value}</span>
                {subvalue && <span className="text-sm font-medium text-muted-foreground">{subvalue}</span>}
            </div>
        </div>
    );
}
