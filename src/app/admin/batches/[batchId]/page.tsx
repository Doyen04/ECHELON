import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Download, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badges";
import { ApproveDispatchButton } from "@/components/admin/approve-dispatch-button";
import { prisma } from "@/lib/db";
import { formatDateTime, relativeTimeFromNow, semesterLabel, toBadgeStatus } from "@/lib/admin-format";

type BatchPageProps = {
    params: Promise<{
        batchId: string;
    }>;
};

export const metadata: Metadata = {
    title: "Batch Details",
    description: "Live result batch overview and student result records.",
};

export default async function BatchDetailPage({ params }: BatchPageProps) {
    const db = prisma as any;
    const { batchId } = await params;

    if (!batchId) {
        notFound();
    }

    const batch = await db.resultBatch.findUnique({
        where: { id: batchId },
        include: {
            uploadedBy: { select: { name: true } },
            approvedBy: { select: { name: true } },
            studentResults: {
                orderBy: { createdAt: "desc" },
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

    if (!batch) {
        notFound();
    }

    const approvedCount = batch.studentResults.filter((result: any) => result.status === "APPROVED").length;
    const pendingCount = batch.studentResults.filter((result: any) => result.status === "PENDING").length;
    const withheldCount = batch.studentResults.filter((result: any) => result.status === "WITHHELD").length;

    return (
        <div className="dashboard-root flex h-full w-full flex-col overflow-y-auto bg-background">
            <PageHeader
                title={batch.department}
                breadcrumbs={
                    <div className="flex items-center gap-1">
                        <Link href="/admin/batches" className="transition-colors hover:text-foreground">
                            Batches
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">{batch.id}</span>
                    </div>
                }
                action={
                    <div className="flex items-center gap-2">
                        {batch.status === "PENDING" || batch.status === "IN_REVIEW" ? (
                            <ApproveDispatchButton batchId={batch.id} />
                        ) : null}
                        <Button asChild className="rounded-full">
                            <Link href={`/admin/batches/${batch.id}/dispatch`}>
                                <Send className="h-4 w-4" /> Dispatch
                            </Link>
                        </Button>
                        <Button variant="outline" className="rounded-full">
                            <Download className="h-4 w-4" /> Export
                        </Button>
                    </div>
                }
            />

            <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 pb-24">
                <Card className="rounded-3xl p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Batch Overview</p>
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
                        <SummaryCard title="Student Results" value={String(batch.studentResults.length)} />
                        <SummaryCard title="Approved" value={String(approvedCount)} color="text-[var(--color-success)]" />
                        <SummaryCard title="Pending" value={String(pendingCount)} color="text-[var(--color-warning)]" />
                        <SummaryCard title="Withheld" value={String(withheldCount)} color="text-[var(--color-danger)]" />
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
                        <article className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Batch Details</p>
                            <div className="mt-4 grid gap-3 text-sm text-(--text-secondary) sm:grid-cols-2">
                                <p><span className="text-foreground font-medium">Uploaded by:</span> {batch.uploadedBy?.name ?? "System"}</p>
                                <p><span className="text-foreground font-medium">Approved by:</span> {batch.approvedBy?.name ?? "Pending"}</p>
                                <p><span className="text-foreground font-medium">Source:</span> {String(batch.source).toUpperCase()}</p>
                                <p><span className="text-foreground font-medium">Uploaded at:</span> {formatDateTime(batch.uploadedAt)}</p>
                            </div>
                        </article>

                        <article className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Recent Dispatches</p>
                            <div className="mt-4 space-y-3">
                                {batch.dispatches.length > 0 ? (
                                    batch.dispatches.map((dispatch: any) => (
                                        <div key={dispatch.id} className="rounded-xl border border-(--border-subtle) bg-(--surface-strong) p-4 text-sm">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-medium text-foreground">{dispatch.id}</p>
                                                    <p className="text-xs text-(--text-muted)">Triggered by {dispatch.triggeredBy?.name ?? "System"}</p>
                                                </div>
                                                <StatusBadge status={toBadgeStatus(dispatch.status)} />
                                            </div>
                                            <p className="mt-2 text-xs text-(--text-secondary)">{dispatch._count.notificationLogs} notification logs</p>
                                            <Link href={`/admin/delivery/${dispatch.id}`} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                                                Open delivery log <ArrowRight className="h-3 w-3" />
                                            </Link>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-(--text-secondary)">No dispatches have been created for this batch yet.</p>
                                )}
                            </div>
                        </article>
                    </div>
                </Card>

                <section className="overflow-hidden rounded-3xl border border-(--border-subtle) bg-(--surface-strong) shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)]">
                    <div className="border-b border-(--border-subtle) px-6 py-4 sm:px-8">
                        <h2 className="text-lg font-semibold text-foreground">Student Results</h2>
                        <p className="mt-1 text-sm text-(--text-secondary)">
                            Stored result rows for this batch, including the latest portal token when available.
                        </p>
                    </div>

                    {batch.studentResults.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border-subtle">
                                <thead className="bg-surface-subtle/40">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">GPA</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Token</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Courses</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle bg-surface-main">
                                    {batch.studentResults.map((result: any) => {
                                        const token = result.portalTokens?.[0]?.token;
                                        const courses = Array.isArray(result.courses) ? result.courses : [];

                                        return (
                                            <tr key={result.id} className="hover:bg-surface-subtle/30 transition-colors">
                                                <td className="px-6 py-4 text-sm text-foreground">
                                                    <div className="font-medium">{result.student.fullName}</div>
                                                    <div className="mt-1 text-xs text-(--text-muted)">{result.student.matricNumber}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={toBadgeStatus(result.status)} />
                                                </td>
                                                <td className="px-6 py-4 text-sm text-(--text-secondary)">{result.cgpa ?? result.gpa}</td>
                                                <td className="px-6 py-4 text-sm text-(--text-secondary)">
                                                    {token ? (
                                                        <Link href={`/results/view?token=${token}`} target="_blank" className="text-brand hover:underline">
                                                            View portal link
                                                        </Link>
                                                    ) : (
                                                        "Not generated"
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-(--text-secondary)">{courses.length} courses</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="px-6 py-10 text-sm text-(--text-secondary)">No student results are stored for this batch yet.</div>
                    )}
                </section>
            </main>
        </div>
    );
}

function SummaryCard({ title, value, color }: { title: string; value: string; color?: string }) {
    return (
        <article className="flex flex-col justify-between rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-5 shadow-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">{title}</div>
            <div className="text-3xl font-serif text-foreground">
                <span className={color ?? ""}>{value}</span>
            </div>
        </article>
    );
}