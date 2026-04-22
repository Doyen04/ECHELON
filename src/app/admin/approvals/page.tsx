import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/db";

export const metadata: Metadata = {
    title: "Approvals",
    description: "Super-admin review and withhold actions.",
};

export default async function ApprovalsPage() {
    const db = prisma as any;

    const batches = await db.resultBatch.findMany({
        where: { status: { in: ["PENDING", "IN_REVIEW"] } },
        orderBy: { uploadedAt: "desc" },
        take: 20,
        include: {
            studentResults: {
                select: {
                    id: true,
                    status: true,
                    student: { select: { fullName: true, matricNumber: true } },
                },
            },
        },
    });

    return (
        <main className="dashboard-root min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="dashboard-grid-overlay" aria-hidden="true" />
            <section className="mx-auto w-full max-w-7xl rounded-3xl border border-(--border-subtle) bg-(--surface-strong) p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                    Senate Review
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    Approval Queue
                </h1>
                <p className="mt-3 text-sm text-(--text-secondary)">
                    Open a batch to review student results and apply approve or withhold actions.
                </p>

                <div className="mt-6 space-y-4">
                    {batches.map((batch: any) => (
                        <article key={batch.id} className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-semibold text-foreground">{batch.department}</h2>
                                    <p className="mt-1 text-sm text-(--text-secondary)">
                                        {batch.session} • {String(batch.semester).toLowerCase()} • {batch.studentResults.length} result(s)
                                    </p>
                                </div>
                                <Link
                                    href={`/admin/approvals/${batch.id}`}
                                    className="rounded-lg bg-(--accent-strong) px-3 py-2 text-xs font-semibold text-white"
                                >
                                    Review Batch
                                </Link>
                            </div>
                            <div className="mt-4 grid gap-2 text-sm text-(--text-secondary) sm:grid-cols-2 lg:grid-cols-3">
                                {batch.studentResults.slice(0, 6).map((result: any) => (
                                    <div key={result.id} className="rounded-xl border border-(--border-subtle) bg-(--surface-strong) p-3">
                                        <p className="font-medium text-foreground">{result.student.fullName}</p>
                                        <p className="text-xs text-(--text-muted)">{result.student.matricNumber}</p>
                                        <p className="mt-2 text-xs uppercase tracking-[0.08em] text-(--text-muted)">
                                            {String(result.status).toLowerCase()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </article>
                    ))}
                    {batches.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-(--border-subtle) p-8 text-sm text-(--text-secondary)">
                            No batches are currently pending review.
                        </div>
                    ) : null}
                </div>
            </section>
        </main>
    );
}
