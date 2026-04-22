import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";

type BatchDetailPageProps = {
    params: Promise<{ batchId: string }>;
};

export const metadata: Metadata = {
    title: "Batch Details",
    description: "Inspect batch status and results.",
};

export default async function BatchDetailPage({ params }: BatchDetailPageProps) {
    const { batchId } = await params;
    const db = prisma as any;

    const batch = await db.resultBatch.findUnique({
        where: { id: batchId },
        include: {
            uploadedBy: { select: { name: true } },
            approvedBy: { select: { name: true } },
            studentResults: {
                include: {
                    student: true,
                },
                orderBy: { status: "asc" },
            },
            dispatches: {
                orderBy: { triggeredAt: "desc" },
                take: 5,
            },
        },
    });

    if (!batch) {
        notFound();
    }

    return (
        <main className="dashboard-root min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="dashboard-grid-overlay" aria-hidden="true" />
            <section className="mx-auto w-full max-w-7xl rounded-3xl border border-(--border-subtle) bg-(--surface-strong) p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Batch Detail</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{batch.department}</h1>
                        <p className="mt-3 text-sm text-(--text-secondary)">
                            {batch.session} • {String(batch.semester).toLowerCase()} • {String(batch.status).toLowerCase()}
                        </p>
                    </div>
                    {batch.status === "APPROVED" ? (
                        <Link href={`/admin/batches/${batch.id}/dispatch`} className="rounded-lg bg-(--accent-strong) px-3 py-2 text-xs font-semibold text-white">
                            Trigger Dispatch
                        </Link>
                    ) : null}
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-4 text-sm text-(--text-secondary)">
                        <p className="text-xs uppercase tracking-[0.12em] text-(--text-muted)">Uploaded by</p>
                        <p className="mt-1 font-medium text-foreground">{batch.uploadedBy?.name ?? "Unknown"}</p>
                    </div>
                    <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-4 text-sm text-(--text-secondary)">
                        <p className="text-xs uppercase tracking-[0.12em] text-(--text-muted)">Approved by</p>
                        <p className="mt-1 font-medium text-foreground">{batch.approvedBy?.name ?? "Not approved"}</p>
                    </div>
                    <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-4 text-sm text-(--text-secondary)">
                        <p className="text-xs uppercase tracking-[0.12em] text-(--text-muted)">Results</p>
                        <p className="mt-1 font-medium text-foreground">{batch.studentResults.length}</p>
                    </div>
                    <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-4 text-sm text-(--text-secondary)">
                        <p className="text-xs uppercase tracking-[0.12em] text-(--text-muted)">Dispatches</p>
                        <p className="mt-1 font-medium text-foreground">{batch.dispatches.length}</p>
                    </div>
                </div>

                <div className="mt-6 space-y-3">
                    {batch.studentResults.map((result: any) => (
                        <article key={result.id} className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{result.student.fullName}</p>
                                    <p className="mt-1 text-xs text-(--text-muted)">{result.student.matricNumber}</p>
                                </div>
                                <Link href={`/admin/approvals/${batch.id}`} className="rounded-lg border border-(--border-subtle) px-3 py-2 text-xs font-semibold text-(--text-secondary)">
                                    Open Review
                                </Link>
                            </div>
                            <p className="mt-3 text-xs uppercase tracking-[0.08em] text-(--text-muted)">{String(result.status).toLowerCase()}</p>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}
