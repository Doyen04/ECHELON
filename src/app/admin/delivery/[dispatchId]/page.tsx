import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";

type DispatchDetailPageProps = {
    params: Promise<{ dispatchId: string }>;
};

export const metadata: Metadata = {
    title: "Dispatch Detail",
    description: "Review notification logs for a dispatch.",
};

export default async function DispatchDetailPage({ params }: DispatchDetailPageProps) {
    const { dispatchId } = await params;
    const db = prisma as any;

    const dispatch = await db.notificationDispatch.findUnique({
        where: { id: dispatchId },
        include: {
            batch: true,
            triggeredBy: { select: { name: true } },
            notificationLogs: {
                orderBy: { attemptedAt: "desc" },
                include: {
                    student: { select: { fullName: true, matricNumber: true } },
                    guardian: { select: { name: true } },
                },
            },
        },
    });

    if (!dispatch) {
        notFound();
    }

    return (
        <main className="dashboard-root min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="dashboard-grid-overlay" aria-hidden="true" />
            <section className="mx-auto w-full max-w-6xl rounded-3xl border border-(--border-subtle) bg-(--surface-strong) p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Dispatch Detail</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{dispatch.batch.department}</h1>
                <p className="mt-3 text-sm text-(--text-secondary)">
                    {dispatch.batch.session} • {String(dispatch.batch.semester).toLowerCase()} • Triggered by {dispatch.triggeredBy?.name ?? "System"}
                </p>

                <div className="mt-6 space-y-3">
                    {dispatch.notificationLogs.map((log: any) => (
                        <article key={log.id} className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-4 text-sm text-(--text-secondary)">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="font-medium text-foreground">{log.student.fullName}</p>
                                    <p className="text-xs text-(--text-muted)">{log.student.matricNumber}</p>
                                </div>
                                <p className="text-xs uppercase tracking-[0.08em] text-(--text-muted)">{String(log.status).toLowerCase()}</p>
                            </div>
                            <p className="mt-2 text-xs text-(--text-muted)">Guardian: {log.guardian?.name ?? "Unknown"}</p>
                            <p className="mt-1 text-xs text-(--text-muted)">{log.failureReason ?? "No failure reason recorded"}</p>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}
