import type { Metadata } from "next";

import { prisma } from "@/lib/db";

export const metadata: Metadata = {
    title: "Audit",
    description: "Compliance and immutable operational logs.",
};

export default async function AuditPage() {
    const db = prisma as any;

    const logs = await db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
            actor: { select: { name: true, email: true } },
            institution: { select: { name: true } },
        },
    });

    return (
        <main className="dashboard-root min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="dashboard-grid-overlay" aria-hidden="true" />
            <section className="mx-auto w-full max-w-6xl rounded-3xl border border-(--border-subtle) bg-(--surface-strong) p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                    Compliance
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    Audit Log
                </h1>
                <p className="mt-3 text-sm text-(--text-secondary)">
                    Immutable records of approvals, dispatches, and administrative actions.
                </p>

                <div className="mt-6 space-y-3">
                    {logs.map((log: any) => (
                        <article key={log.id} className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{log.action}</p>
                                    <p className="mt-1 text-xs text-(--text-muted)">
                                        {log.entityType} • {log.entityId}
                                    </p>
                                </div>
                                <div className="text-right text-xs text-(--text-muted)">
                                    <p>{log.actor?.name ?? "System"}</p>
                                    <p>{log.institution?.name ?? "Unknown institution"}</p>
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-(--text-secondary)">
                                {new Date(log.createdAt).toLocaleString()}
                            </p>
                        </article>
                    ))}
                    {logs.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-(--border-subtle) p-8 text-sm text-(--text-secondary)">
                            No audit records found.
                        </div>
                    ) : null}
                </div>
            </section>
        </main>
    );
}
