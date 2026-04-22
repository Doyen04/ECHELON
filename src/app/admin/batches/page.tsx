import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/db";

export const metadata: Metadata = {
    title: "Batches",
    description: "Manage result batches and dispatch readiness.",
};

export default async function BatchesPage() {
    const db = prisma as any;

    const batches = await db.resultBatch.findMany({
        orderBy: { uploadedAt: "desc" },
        take: 50,
        include: {
            uploadedBy: { select: { name: true } },
            approvedBy: { select: { name: true } },
            _count: {
                select: {
                    studentResults: true,
                    dispatches: true,
                },
            },
        },
    });

    return (
        <main className="dashboard-root min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="dashboard-grid-overlay" aria-hidden="true" />

            <section className="mx-auto w-full max-w-6xl rounded-3xl border border-(--border-subtle) bg-(--surface-strong) p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                            Result Operations
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                            Batch Management
                        </h1>
                        <p className="mt-3 text-sm text-(--text-secondary)">
                            Review all uploaded batches, monitor approval state, and open dispatch workflow for approved batches.
                        </p>
                    </div>
                    <Link
                        href="/admin/batches/upload"
                        className="rounded-xl border border-(--border-strong) px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-(--surface-muted)"
                    >
                        Create New Batch
                    </Link>
                </div>

                <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                        <thead>
                            <tr className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">
                                <th className="px-3 py-1">Batch</th>
                                <th className="px-3 py-1">Status</th>
                                <th className="px-3 py-1">Results</th>
                                <th className="px-3 py-1">Dispatches</th>
                                <th className="px-3 py-1">Owner</th>
                                <th className="px-3 py-1">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.map((batch: any) => (
                                <tr key={batch.id} className="rounded-xl bg-(--surface-soft)">
                                    <td className="rounded-l-xl px-3 py-3 align-top">
                                        <p className="font-semibold text-foreground">{batch.department}</p>
                                        <p className="mt-1 text-xs text-(--text-muted)">
                                            {batch.session} • {String(batch.semester).toLowerCase()} • {batch.id}
                                        </p>
                                    </td>
                                    <td className="px-3 py-3 align-top text-xs font-semibold uppercase tracking-[0.08em] text-(--text-secondary)">
                                        {String(batch.status).replace("_", " ")}
                                    </td>
                                    <td className="px-3 py-3 align-top text-(--text-secondary)">
                                        {batch._count.studentResults}
                                    </td>
                                    <td className="px-3 py-3 align-top text-(--text-secondary)">
                                        {batch._count.dispatches}
                                    </td>
                                    <td className="px-3 py-3 align-top text-(--text-secondary)">
                                        <p>{batch.uploadedBy?.name ?? "Unknown"}</p>
                                        <p className="text-xs text-(--text-muted)">
                                            {batch.approvedBy ? `Approved by ${batch.approvedBy.name}` : "Not approved"}
                                        </p>
                                    </td>
                                    <td className="rounded-r-xl px-3 py-3 align-top">
                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                href={`/admin/batches/${batch.id}`}
                                                className="rounded-lg border border-(--border-subtle) px-2.5 py-1.5 text-xs font-semibold text-(--text-secondary) transition hover:border-(--border-strong) hover:text-foreground"
                                            >
                                                Open
                                            </Link>
                                            <Link
                                                href={`/admin/approvals/${batch.id}`}
                                                className="rounded-lg border border-(--border-subtle) px-2.5 py-1.5 text-xs font-semibold text-(--text-secondary) transition hover:border-(--border-strong) hover:text-foreground"
                                            >
                                                Review
                                            </Link>
                                            {batch.status === "APPROVED" ? (
                                                <Link
                                                    href={`/admin/batches/${batch.id}/dispatch`}
                                                    className="rounded-lg bg-(--accent-strong) px-2.5 py-1.5 text-xs font-semibold text-white"
                                                >
                                                    Dispatch
                                                </Link>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
