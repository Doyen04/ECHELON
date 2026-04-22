import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";
import { enqueueNotifyJob } from "@/lib/queue";
import { processNotifyJob } from "@/lib/dispatch-worker";

type DispatchPageProps = {
    params: Promise<{ batchId: string }>;
};

export const metadata: Metadata = {
    title: "Dispatch Batch",
    description: "Trigger batch notification dispatch.",
};

export default async function DispatchPage({ params }: DispatchPageProps) {
    const { batchId } = await params;
    const session = await getSuperAdminSession();
    if (!session) {
        redirect("/sign-in");
    }

    const db = prisma as any;

    const batch = await db.resultBatch.findUnique({
        where: { id: batchId },
        include: {
            studentResults: {
                where: { status: "APPROVED" },
                select: { id: true },
            },
        },
    });

    if (!batch) {
        redirect("/admin/batches");
    }

    async function triggerDispatch() {
        "use server";

        const serverSession = await getSuperAdminSession();
        if (!serverSession) {
            redirect("/sign-in");
        }

        const dispatch = await db.notificationDispatch.create({
            data: {
                batchId,
                triggeredById: serverSession.user.id,
                totalCount: batch.studentResults.length,
                status: "QUEUED",
            },
        });

        for (const result of batch.studentResults as Array<{ id: string }>) {
            const queueResult = await enqueueNotifyJob({
                dispatchId: dispatch.id,
                studentResultId: result.id,
            });

            if (!queueResult.queued) {
                await processNotifyJob({
                    dispatchId: dispatch.id,
                    studentResultId: result.id,
                });
            }
        }

        await db.resultBatch.update({
            where: { id: batchId },
            data: { status: "DISPATCHED" },
        });

        redirect(`/admin/delivery/${dispatch.id}`);
    }

    return (
        <main className="dashboard-root min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="dashboard-grid-overlay" aria-hidden="true" />
            <section className="mx-auto w-full max-w-3xl rounded-3xl border border-(--border-subtle) bg-(--surface-strong) p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Dispatch Workflow</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Trigger Batch Dispatch</h1>
                <p className="mt-3 text-sm text-(--text-secondary)">
                    Approved results only. {batch.studentResults.length} approved result(s) are ready for dispatch.
                </p>
                <form action={triggerDispatch} className="mt-6">
                    <button type="submit" className="rounded-xl bg-(--accent-strong) px-4 py-2.5 text-sm font-semibold text-white">
                        Confirm And Dispatch
                    </button>
                </form>
            </section>
        </main>
    );
}
