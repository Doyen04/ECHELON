import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badges";
import { DataTable } from "@/components/ui/data-table";
import type { DataTableColumn } from "@/components/ui/data-table";
import { ApproveDispatchButton } from "@/components/admin/approve-dispatch-button";
import { ExportButton } from "@/components/admin/export-button";
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

type StudentResultRow = {
    id: string;
    fullName: string;
    matricNumber: string;
    status: string;
    gpa: string;
    token: string | null;
    courseCount: number;
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

    if (!batch) {
        notFound();
    }

    const approvedCount = batch.studentResults.filter((r: any) => r.status === "APPROVED").length;
    const pendingCount = batch.studentResults.filter((r: any) => r.status === "PENDING").length;
    const withheldCount = batch.studentResults.filter((r: any) => r.status === "WITHHELD").length;

    const studentResults: StudentResultRow[] = batch.studentResults.map((result: any) => ({
        id: result.id,
        fullName: result.student.fullName,
        matricNumber: result.student.matricNumber,
        status: result.status,
        gpa: result.cgpa ?? result.gpa ?? "—",
        token: result.portalTokens?.[0]?.token ?? null,
        courseCount: Array.isArray(result.courses) ? result.courses.length : 0,
    }));

    const resultColumns: DataTableColumn<StudentResultRow>[] = [
        {
            header: "Student",
            cell: (row) => (
                <div>
                    <div className="font-medium text-foreground">{row.fullName}</div>
                    <div className="mt-0.5 text-xs text-text-muted">{row.matricNumber}</div>
                </div>
            ),
        },
        {
            header: "Status",
            cell: (row) => <StatusBadge status={toBadgeStatus(row.status)} />,
        },
        {
            header: "GPA",
            cell: (row) => <span className="text-foreground">{row.gpa}</span>,
            hideOnMobile: true,
        },
        {
            header: "Token",
            cell: (row) =>
                row.token ? (
                    <Link href={`/results/view?token=${row.token}`} target="_blank" className="text-brand hover:underline">
                        View portal link
                    </Link>
                ) : (
                    <span className="text-text-muted">Not generated</span>
                ),
            hideOnMobile: true,
        },
        {
            header: "Courses",
            cell: (row) => <span>{row.courseCount} courses</span>,
            hideOnMobile: true,
        },
    ];

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
                        <ExportButton
                            endpoint={`/api/batches/${batch.id}/export`}
                            filename={`batch-detail-${batch.id}.csv`}
                        />
                    </div>
                }
            />

            <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 pb-24">
                {/* ── Batch Overview Card ── */}
                <Card className="p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                Batch Overview
                            </p>
                            <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-foreground">
                                {batch.department}
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
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
                        <article className="rounded-2xl border border-border/60 bg-muted/30 p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Batch Details</p>
                            <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                                <p><span className="text-foreground font-medium">Uploaded by:</span> {batch.uploadedBy?.name ?? "System"}</p>
                                <p><span className="text-foreground font-medium">Approved by:</span> {batch.approvedBy?.name ?? "Pending"}</p>
                                <p><span className="text-foreground font-medium">Source:</span> {String(batch.source).toUpperCase()}</p>
                                <p><span className="text-foreground font-medium">Uploaded at:</span> {formatDateTime(batch.uploadedAt)}</p>
                            </div>
                        </article>

                        <article className="rounded-2xl border border-border/60 bg-muted/30 p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Recent Dispatches</p>
                            <div className="mt-4 space-y-3">
                                {batch.dispatches.length > 0 ? (
                                    batch.dispatches.map((dispatch: any) => (
                                        <div key={dispatch.id} className="rounded-xl border border-border/60 bg-card p-4 text-sm">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-medium text-foreground">{dispatch.id}</p>
                                                    <p className="text-xs text-muted-foreground">Triggered by {dispatch.triggeredBy?.name ?? "System"}</p>
                                                </div>
                                                <StatusBadge status={toBadgeStatus(dispatch.status)} />
                                            </div>
                                            <p className="mt-2 text-xs text-muted-foreground">{dispatch._count.notificationLogs} notification logs</p>
                                            <Link href={`/admin/delivery/${dispatch.id}`} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                                                Open delivery log <ArrowRight className="h-3 w-3" />
                                            </Link>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No dispatches have been created for this batch yet.</p>
                                )}
                            </div>
                        </article>
                    </div>
                </Card>

                {/* ── Student Results Table ── */}
                <div className="space-y-3">
                    <div className="px-1">
                        <h2 className="font-serif text-lg font-semibold text-foreground">Student Results</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Stored result rows for this batch, including the latest portal token when available.
                        </p>
                    </div>
                    <DataTable
                        columns={resultColumns}
                        data={studentResults}
                        rowKey={(row) => row.id}
                        emptyMessage="No student results are stored for this batch yet."
                        className="shadow-sm"
                    />
                </div>
            </main>
        </div>
    );
}

function SummaryCard({ title, value, color }: { title: string; value: string; color?: string }) {
    return (
        <article className="flex flex-col justify-between rounded-2xl border border-border/60 bg-muted/30 p-5 shadow-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</div>
            <div className="text-3xl font-serif text-foreground">
                <span className={color ?? ""}>{value}</span>
            </div>
        </article>
    );
}