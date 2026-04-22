import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireSuperAdminSession } from "@/lib/super-admin-session";

export const metadata: Metadata = {
    title: "Batch Upload",
    description: "Upload or sync result batches from SIS source.",
};

const semesterValues = ["FIRST", "SECOND", "THIRD"] as const;

export default async function BatchUploadPage() {
    async function createDraftBatch(formData: FormData) {
        "use server";

        const session = await requireSuperAdminSession();
        const db = prisma as any;

        const department = String(formData.get("department") ?? "").trim();
        const sessionLabel = String(formData.get("session") ?? "").trim();
        const semester = String(formData.get("semester") ?? "").toUpperCase();

        if (!department || !sessionLabel || !semesterValues.includes(semester as any)) {
            return;
        }

        const actor = await db.user.findUnique({
            where: { id: session.user.id },
            select: { institutionId: true },
        });

        if (!actor?.institutionId) {
            return;
        }

        const batch = await db.resultBatch.create({
            data: {
                institutionId: actor.institutionId,
                department,
                session: sessionLabel,
                semester,
                status: "PENDING",
                source: "csv",
                uploadedById: session.user.id,
            },
        });

        await db.auditLog.create({
            data: {
                institutionId: actor.institutionId,
                actorId: session.user.id,
                action: "batch.created",
                entityType: "result_batch",
                entityId: batch.id,
                metadata: { source: "manual-create" },
            },
        });

        revalidatePath("/admin/batches");
        redirect(`/admin/batches/${batch.id}`);
    }

    return (
        <main className="dashboard-root min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="dashboard-grid-overlay" aria-hidden="true" />

            <section className="mx-auto w-full max-w-3xl rounded-3xl border border-(--border-subtle) bg-(--surface-strong) p-7 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                    Result Ingestion
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    Create Batch Draft
                </h1>
                <p className="mt-3 text-sm text-(--text-secondary)">
                    Start a new batch shell before uploading CSV lines or syncing from SIS. This creates the workflow container for approvals and dispatch.
                </p>

                <form action={createDraftBatch} className="mt-6 grid gap-4">
                    <label className="block">
                        <span className="mb-1 block text-sm font-medium text-(--text-secondary)">
                            Session
                        </span>
                        <input
                            name="session"
                            required
                            placeholder="2025/2026"
                            className="w-full rounded-xl border border-(--border-subtle) bg-white px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-(--border-strong)"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-sm font-medium text-(--text-secondary)">
                            Semester
                        </span>
                        <select
                            name="semester"
                            required
                            defaultValue="FIRST"
                            className="w-full rounded-xl border border-(--border-subtle) bg-white px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-(--border-strong)"
                        >
                            <option value="FIRST">First</option>
                            <option value="SECOND">Second</option>
                            <option value="THIRD">Third</option>
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-sm font-medium text-(--text-secondary)">
                            Department
                        </span>
                        <input
                            name="department"
                            required
                            placeholder="Computer Science"
                            className="w-full rounded-xl border border-(--border-subtle) bg-white px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-(--border-strong)"
                        />
                    </label>

                    <button
                        type="submit"
                        className="mt-2 rounded-xl bg-(--accent-strong) px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
                    >
                        Create Draft Batch
                    </button>
                </form>
            </section>
        </main>
    );
}
