import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/db";

export const metadata: Metadata = {
    title: "Students",
    description: "Student and guardian contact records.",
};

export default async function StudentsPage() {
    const db = prisma as any;

    const students = await db.student.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
            guardians: true,
        },
    });

    return (
        <main className="dashboard-root min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="dashboard-grid-overlay" aria-hidden="true" />
            <section className="mx-auto w-full max-w-7xl rounded-3xl border border-(--border-subtle) bg-(--surface-strong) p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                    Contact Management
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    Student Records
                </h1>
                <p className="mt-3 text-sm text-(--text-secondary)">
                    Review student profiles and guardian contact coverage before dispatch.
                </p>
                <div className="mt-4">
                    <Link
                        href="/admin/students/contacts"
                        className="inline-flex rounded-lg bg-(--accent-strong) px-3 py-2 text-xs font-semibold text-white"
                    >
                        Upload Parent Contacts
                    </Link>
                </div>

                <div className="mt-6 space-y-3">
                    {students.map((student: any) => (
                        <article key={student.id} className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{student.fullName}</p>
                                    <p className="mt-1 text-xs text-(--text-muted)">{student.matricNumber}</p>
                                    <p className="mt-2 text-sm text-(--text-secondary)">
                                        {student.department} • {student.faculty} • Level {student.level}
                                    </p>
                                </div>
                                <Link
                                    href={`/admin/students/${student.id}`}
                                    className="rounded-lg bg-(--accent-strong) px-3 py-2 text-xs font-semibold text-white"
                                >
                                    Open Profile
                                </Link>
                            </div>
                            <div className="mt-4 grid gap-2 text-xs text-(--text-secondary) sm:grid-cols-2 lg:grid-cols-3">
                                {student.guardians.map((guardian: any) => (
                                    <div key={guardian.id} className="rounded-xl border border-(--border-subtle) bg-(--surface-strong) p-3">
                                        <p className="font-medium text-foreground">{guardian.name}</p>
                                        <p>{guardian.relationship}</p>
                                        <p className="mt-1 text-(--text-muted)">
                                            {guardian.preferredChannel} • {guardian.ndprConsent ? "consented" : "no consent"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </article>
                    ))}
                    {students.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-(--border-subtle) p-8 text-sm text-(--text-secondary)">
                            No student records found.
                        </div>
                    ) : null}
                </div>
            </section>
        </main>
    );
}
