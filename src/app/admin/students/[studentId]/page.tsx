import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";

type StudentDetailPageProps = {
    params: Promise<{ studentId: string }>;
};

export const metadata: Metadata = {
    title: "Student Profile",
    description: "Student profile and guardian contacts.",
};

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
    const { studentId } = await params;
    const db = prisma as any;

    const student = await db.student.findUnique({
        where: { id: studentId },
        include: {
            guardians: true,
            studentResults: {
                include: {
                    batch: true,
                },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!student) {
        notFound();
    }

    return (
        <main className="dashboard-root min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="dashboard-grid-overlay" aria-hidden="true" />
            <section className="mx-auto w-full max-w-5xl rounded-3xl border border-(--border-subtle) bg-(--surface-strong) p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Student Profile</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{student.fullName}</h1>
                <p className="mt-3 text-sm text-(--text-secondary)">
                    {student.matricNumber} • {student.department} • {student.faculty} • Level {student.level}
                </p>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-4">
                        <h2 className="text-sm font-semibold text-foreground">Guardian Contacts</h2>
                        <div className="mt-3 space-y-3 text-sm text-(--text-secondary)">
                            {student.guardians.map((guardian: any) => (
                                <article key={guardian.id} className="rounded-xl border border-(--border-subtle) bg-(--surface-strong) p-3">
                                    <p className="font-medium text-foreground">{guardian.name}</p>
                                    <p>{guardian.relationship}</p>
                                    <p className="mt-1 text-xs text-(--text-muted)">{guardian.email ?? "No email"} • {guardian.phone ?? "No phone"}</p>
                                </article>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-4">
                        <h2 className="text-sm font-semibold text-foreground">Result History</h2>
                        <div className="mt-3 space-y-3 text-sm text-(--text-secondary)">
                            {student.studentResults.map((result: any) => (
                                <article key={result.id} className="rounded-xl border border-(--border-subtle) bg-(--surface-strong) p-3">
                                    <p className="font-medium text-foreground">{result.batch.department}</p>
                                    <p className="text-xs text-(--text-muted)">{result.batch.session} • {String(result.batch.semester).toLowerCase()}</p>
                                    <p className="mt-1 text-xs uppercase tracking-[0.08em] text-(--text-muted)">{String(result.status).toLowerCase()}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
