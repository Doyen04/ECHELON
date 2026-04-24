import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Download, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badges";
import { prisma } from "@/lib/db";
import { formatDateTime, relativeTimeFromNow, semesterLabel, toBadgeStatus } from "@/lib/admin-format";

type BatchDispatchPageProps = {
    params: Promise<{
        batchId: string;
    }>;
};

export const metadata: Metadata = {
    title: "Batch Dispatch",
    description: "Dispatch status and delivery logs for a batch.",
};

export default async function BatchDispatchPage({ params }: BatchDispatchPageProps) {
    const db = prisma as any;
    const { batchId } = await params;

    if (!batchId) {
        notFound();
    }

    const batch = await db.resultBatch.findUnique({
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

    if (!batch) {
        notFound();
    }

    const approvedResults = batch.studentResults.filter((result: any) => result.status === "APPROVED").length;

    return (
        <div className="dashboard-root flex h-full w-full flex-col overflow-y-auto bg-background">
            <PageHeader
                title={`${batch.department} Dispatch`}
                breadcrumbs={
                    <div className="flex items-center gap-1">
                        <Link href="/admin/batches" className="transition-colors hover:text-foreground">
                            Batches
                        </Link>
                        <span>/</span>
                        <Link href={`/admin/batches/${batch.id}`} className="transition-colors hover:text-foreground">
                            {batch.id}
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">Dispatch</span>
                    </div>
                }
                action={
                    <Button variant="outline" className="rounded-full">
                        <Download className="h-4 w-4" /> Export
                    </Button>
                }
            />

            <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 pb-24">
                <Card className="rounded-3xl p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Dispatch Overview</p>
                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{batch.department}</h1>
                            <p className="mt-2 text-sm text-(--text-secondary)">
                                {batch.session} • {semesterLabel(batch.semester)} Semester • Uploaded {relativeTimeFromNow(batch.uploadedAt)}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <StatusBadge status={toBadgeStatus(batch.status)} />
                            <Badge variant="outline" className="rounded-full px-2.5 py-1 text-xs font-medium">
                                {batch.id}
                            </Badge>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard title="Approved Results" value={String(approvedResults)} />
                        <SummaryCard title="Dispatches" value={String(batch.dispatches.length)} color="text-[var(--color-success)]" />
                        <SummaryCard title="Uploaded By" value={batch.uploadedBy?.name ?? "System"} />
                        <SummaryCard title="Last Activity" value={batch.dispatches[0] ? relativeTimeFromNow(batch.dispatches[0].triggeredAt) : "N/A"} />
                    </div>

                    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-foreground">Trigger parent notification delivery for approved student results.</p>
                            <p className="text-sm text-(--text-secondary)">The dispatch worker will prioritize email and fall back to phone channels when needed.</p>
                        </div>
                        <Button asChild className="rounded-full">
                            <Link href={`/admin/delivery/${batch.dispatches[0]?.id ?? ""}`}>
                                <Send className="h-4 w-4" /> {batch.dispatches[0] ? "Open latest delivery" : "No delivery yet"}
                            </Link>
                        </Button>
                    </div>
                </Card>

                <Card className="overflow-hidden rounded-3xl shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)]">
                    <div className="border-b border-(--border-subtle) px-6 py-4 sm:px-8">
                        <h2 className="text-lg font-semibold text-foreground">Dispatch Jobs</h2>
                        <p className="mt-1 text-sm text-(--text-secondary)">
                            Each dispatch record represents a run of the notification worker for this batch.
                        </p>
                    </div>

                    {batch.dispatches.length > 0 ? (
                        <div className="space-y-3 p-6 sm:p-8">
                            {batch.dispatches.map((dispatch: any) => {
                                const sentCount = dispatch.notificationLogs.filter((log: any) => log.status === "SENT" || log.status === "DELIVERED").length;
                                const failedCount = dispatch.notificationLogs.filter((log: any) => log.status === "FAILED").length;

                                return (
                                    <article key={dispatch.id} className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-5">
                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{dispatch.id}</p>
                                                <p className="mt-1 text-xs text-(--text-muted)">Triggered by {dispatch.triggeredBy?.name ?? "System"} • {formatDateTime(dispatch.triggeredAt)}</p>
                                            </div>

                                            <StatusBadge status={toBadgeStatus(dispatch.status)} />
                                        </div>

                                        <div className="mt-4 grid gap-2 text-xs text-(--text-secondary) sm:grid-cols-3">
                                            <p>Total: {dispatch.totalCount}</p>
                                            <p>Sent/Delivered: {sentCount}</p>
                                            <p>Failed: {failedCount}</p>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-(--border-subtle) bg-(--surface-strong) px-4 py-3 text-sm">
                                            <span className="text-(--text-secondary)">{dispatch.notificationLogs.length} notification log entries</span>
                                            <Link href={`/admin/delivery/${dispatch.id}`} className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
                                                Open log <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="px-6 py-10 text-sm text-(--text-secondary)">No dispatch jobs exist for this batch yet.</div>
                    )}
                </Card>
            </main>
        </div>
    );
}

function SummaryCard({ title, value, color }: { title: string; value: string; color?: string }) {
    return (
        <article className="flex flex-col justify-between rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-5 shadow-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">{title}</div>
            <div className={`text-3xl font-serif text-foreground ${color ?? ""}`}>{value}</div>
        </article>
    );
}