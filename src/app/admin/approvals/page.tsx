import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, CheckSquare, Clock, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badges";
import { ApproveDispatchButton } from "@/components/admin/approve-dispatch-button";
import { prisma } from "@/lib/db";
import { relativeTimeFromNow, semesterLabel, toBadgeStatus } from "@/lib/admin-format";

export const metadata: Metadata = {
    title: "Approvals",
    description: "Result batch review queue and approval history.",
};

export default async function ApprovalsPage() {
    const db = prisma as any;

    const [pendingBatches, reviewedBatches] = await Promise.all([
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

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-background">
            <PageHeader
                title="Approvals"
                breadcrumbs={
                    <div className="flex items-center gap-1">
                        <Link href="/admin/dashboard" className="transition-colors hover:text-foreground">
                            Dashboard
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">Review Queue</span>
                    </div>
                }
            />

            <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <Card className="space-y-6 p-6 dashboard-section shadow-sm">
                    <h2 className="flex items-center gap-2 text-xl font-serif text-foreground">
                        <Clock className="h-5 w-5 text-status-warning" /> Action Required ({pendingBatches.length})
                    </h2>

                    <div className="grid gap-4">
                        {pendingBatches.length > 0 ? (
                            pendingBatches.map((batch: any, index: number) => {
                                const studentCount = batch.studentResults.length;
                                const pendingCount = batch.studentResults.filter((result: any) => result.status === "PENDING").length;
                                const approvedCount = batch.studentResults.filter((result: any) => result.status === "APPROVED").length;

                                return (
                                    <Card key={batch.id} className="dashboard-card rounded-xl border-border/70 bg-card p-6 shadow-sm transition-colors hover:border-brand/30" style={{ animationDelay: `${index * 60}ms` }}>
                                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                                            <div className="space-y-4 flex-1">
                                                <div>
                                                    <h3 className="mb-1 font-serif text-lg text-foreground">
                                                        {batch.department} - {semesterLabel(batch.semester)} {batch.session}
                                                    </h3>
                                                    <p className="text-sm text-text-muted">
                                                        Uploaded by <span className="font-medium text-foreground">{batch.uploadedBy?.name ?? "System"}</span> • {relativeTimeFromNow(batch.uploadedAt)}
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3">
                                                    <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] font-medium text-text-muted">
                                                        {studentCount} student records
                                                    </Badge>
                                                    <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                                                        Pending: {pendingCount}
                                                    </Badge>
                                                    <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                                                        Approved: {approvedCount}
                                                    </Badge>
                                                    <StatusBadge status="pending" />
                                                </div>
                                            </div>

                                            <div className="flex w-full shrink-0 items-center md:w-auto">
                                                <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:items-end">
                                                    <Link
                                                        href={`/admin/batches/${batch.id}`}
                                                        className="group flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98] md:w-auto"
                                                    >
                                                        Begin Review <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                    </Link>
                                                    <ApproveDispatchButton batchId={batch.id} />
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="rounded-xl border border-dashed border-border-subtle bg-surface-main p-6 text-sm text-text-muted">
                                No batches are waiting for review right now.
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="pt-4 p-6 dashboard-section shadow-sm" style={{ animationDelay: "150ms" }}>
                    <h2 className="mb-4 text-lg font-serif text-foreground">Historical Approvals</h2>
                    <details className="group overflow-hidden rounded-xl border border-border-subtle bg-surface-main shadow-sm">
                        <summary className="flex cursor-pointer list-none items-center justify-between bg-surface-subtle/20 p-5 transition-colors hover:bg-surface-subtle/40 [&::-webkit-details-marker]:hidden">
                            <div className="flex items-center gap-2">
                                <CheckSquare className="h-5 w-5 text-status-success" />
                                <h3 className="font-medium text-foreground">
                                    Recently Reviewed Batches <span className="ml-1 text-text-muted">({reviewedBatches.length} total)</span>
                                </h3>
                            </div>
                            <ChevronDown className="h-5 w-5 text-text-muted transition-transform group-open:rotate-180" />
                        </summary>

                        <div className="overflow-x-auto border-t border-border-subtle bg-surface-main">
                            <table className="min-w-full divide-y divide-border-subtle">
                                <thead className="bg-surface-subtle/30">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Batch ID</th>
                                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Session & Department</th>
                                        <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {reviewedBatches.map((batch: any) => (
                                        <tr key={batch.id} className="transition-colors hover:bg-surface-subtle/30">
                                            <td className="px-5 py-4 text-sm font-mono text-text-muted">{batch.id}</td>
                                            <td className="px-5 py-4 text-sm font-medium text-foreground">
                                                {batch.department} - {batch.session}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <StatusBadge status={toBadgeStatus(batch.status)} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="border-t border-border-subtle bg-surface-subtle/5 px-5 py-4 text-center text-sm font-medium text-brand transition-colors hover:text-brand-hover hover:underline cursor-pointer">
                                View complete review history
                            </div>
                        </div>
                    </details>
                </Card>
            </main>
        </div>
    );
}