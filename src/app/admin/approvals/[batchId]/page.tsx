import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

type ApprovalBatchPageProps = {
    params: Promise<{ batchId: string }>;
};

export const metadata: Metadata = {
    title: "Review Batch",
    description: "Approve or withhold student results.",
};

export default async function ApprovalBatchPage({ params }: ApprovalBatchPageProps) {
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
                include: {
                    student: true,
                },
                orderBy: { student: { fullName: "asc" } },
            },
        },
    });

    if (!batch) {
        notFound();
    }

    async function applyResultAction(formData: FormData) {
        "use server";

        const serverSession = await getSuperAdminSession();
        if (!serverSession) {
            redirect("/sign-in");
        }

        const resultId = String(formData.get("resultId") ?? "");
        const nextStatus = String(formData.get("nextStatus") ?? "");
        const result = await db.studentResult.findUnique({ where: { id: resultId } });

        if (!result) {
            return;
        }

        await db.studentResult.update({
            where: { id: resultId },
            data: {
                status: nextStatus,
                reviewedById: serverSession.user.id,
                reviewedAt: new Date(),
            },
        });

        await db.auditLog.create({
            data: {
                institutionId: batch.institutionId,
                actorId: serverSession.user.id,
                action: nextStatus === "APPROVED" ? "result.approved" : "result.withheld",
                entityType: "student_result",
                entityId: resultId,
                metadata: {
                    batchId: batch.id,
                    nextStatus,
                },
            },
        });
    }

    return (
        <main className="dashboard-root min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="dashboard-grid-overlay" aria-hidden="true" />
            <section className="mx-auto w-full max-w-6xl rounded-3xl border border-(--border-subtle) bg-(--surface-strong) p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Approval Detail</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{batch.department}</h1>
                <p className="mt-3 text-sm text-(--text-secondary)">
                    {batch.session} • {String(batch.semester).toLowerCase()} • {batch.studentResults.length} result(s)
                </p>

                <div className="mt-6 space-y-3">
                    {batch.studentResults.map((result: any) => (
                        <article key={result.id} className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{result.student.fullName}</p>
                                    <p className="mt-1 text-xs text-(--text-muted)">{result.student.matricNumber}</p>
                                    <p className="mt-2 text-xs uppercase tracking-[0.08em] text-(--text-muted)">
                                        {String(result.status).toLowerCase()}
                                    </p>
                                </div>
                                <form action={applyResultAction} className="flex flex-wrap gap-2">
                                    <input type="hidden" name="resultId" value={result.id} />
                                    <button name="nextStatus" value="APPROVED" className="rounded-lg bg-(--accent-strong) px-3 py-2 text-xs font-semibold text-white">
                                        Approve
                                    </button>
                                    <button name="nextStatus" value="WITHHELD" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                                        Withhold
                                    </button>
                                </form>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}
