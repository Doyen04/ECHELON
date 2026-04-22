import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/db";

export const metadata: Metadata = {
    title: "Delivery",
    description: "Notification delivery tracking and retry controls.",
};

export default async function DeliveryPage() {
    const db = prisma as any;

    const dispatches = await db.notificationDispatch.findMany({
        orderBy: { triggeredAt: "desc" },
        take: 25,
        include: {
            batch: { select: { department: true, session: true, semester: true } },
            triggeredBy: { select: { name: true } },
            _count: { select: { notificationLogs: true } },
        },
    });

    return (
        <main className="dashboard-root min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="dashboard-grid-overlay" aria-hidden="true" />
            <section className="mx-auto w-full max-w-6xl rounded-3xl border border-(--border-subtle) bg-(--surface-strong) p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                    Delivery Monitoring
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    Dispatch Activity
                </h1>
                <p className="mt-3 text-sm text-(--text-secondary)">
                    Track each dispatch job and open detail views for status and failed sends.
                </p>

                <div className="mt-6 space-y-3">
                    {dispatches.map((dispatch: any) => (
                        <article key={dispatch.id} className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {dispatch.batch.department}
                                    </p>
                                    <p className="mt-1 text-xs text-(--text-muted)">
                                        {dispatch.batch.session} • {String(dispatch.batch.semester).toLowerCase()} • {dispatch.id}
                                    </p>
                                    <p className="mt-2 text-sm text-(--text-secondary)">
                                        Triggered by {dispatch.triggeredBy?.name ?? "System"}
                                    </p>
                                </div>
                                <Link
                                    href={`/admin/delivery/${dispatch.id}`}
                                    className="rounded-lg bg-(--accent-strong) px-3 py-2 text-xs font-semibold text-white"
                                >
                                    Open Logs
                                </Link>
                            </div>
                            <p className="mt-3 text-xs text-(--text-secondary)">
                                {dispatch._count.notificationLogs} notification log(s)
                            </p>
                        </article>
                    ))}
                    {dispatches.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-(--border-subtle) p-8 text-sm text-(--text-secondary)">
                            No dispatches found.
                        </div>
                    ) : null}
                </div>
            </section>
        </main>
    );
}
