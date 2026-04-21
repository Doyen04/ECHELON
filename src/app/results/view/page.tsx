import type { Metadata } from "next";

import { prisma } from "@/lib/db";

export const metadata: Metadata = {
    title: "View Result",
    description: "Secure parent result view.",
    robots: {
        index: false,
        follow: false,
        nocache: true,
    },
};

type ResultViewPageProps = {
    searchParams: Promise<{ token?: string }>;
};

function ExpiredState({ reason }: { reason: string }) {
    return (
        <main className="dashboard-root min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
            <div className="dashboard-grid-overlay" aria-hidden="true" />

            <section className="mx-auto w-full max-w-3xl rounded-3xl border border-(--border-subtle) bg-(--surface-strong) p-7 shadow-[0_25px_55px_-38px_rgba(2,23,23,0.72)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--text-muted)">
                    Result Access
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Link Unavailable
                </h1>
                <p className="mt-4 text-base text-(--text-secondary)">{reason}</p>
                <p className="mt-2 text-sm text-(--text-muted)">
                    Please contact your institution administration for a new result link.
                </p>
            </section>
        </main>
    );
}

export default async function ResultViewPage({ searchParams }: ResultViewPageProps) {
    const query = await searchParams;
    const token = query.token;

    if (!token) {
        return <ExpiredState reason="No access token was provided." />;
    }

    const db = prisma as any;
    const portalToken = await db.portalToken.findUnique({
        where: { token },
        include: {
            studentResult: {
                include: {
                    batch: true,
                    student: true,
                },
            },
        },
    });

    if (!portalToken) {
        return <ExpiredState reason="This result link is invalid." />;
    }

    if (portalToken.invalidated || portalToken.viewedAt || portalToken.expiresAt < new Date()) {
        return <ExpiredState reason="This result link has expired or has already been used." />;
    }

    const courses = Array.isArray(portalToken.studentResult.courses)
        ? (portalToken.studentResult.courses as Array<any>)
        : [];

    await db.portalToken.update({
        where: { id: portalToken.id },
        data: {
            viewedAt: new Date(),
            invalidated: true,
        },
    });

    return (
        <main className="dashboard-root min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
            <div className="dashboard-grid-overlay" aria-hidden="true" />

            <section className="mx-auto w-full max-w-4xl rounded-3xl border border-(--border-subtle) bg-(--surface-strong) p-7 shadow-[0_25px_55px_-38px_rgba(2,23,23,0.72)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--text-muted)">
                    Approved Result Slip
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {portalToken.studentResult.student.fullName}
                </h1>
                <p className="mt-2 text-sm text-(--text-secondary)">
                    {portalToken.studentResult.student.matricNumber} • {portalToken.studentResult.batch.session} •{" "}
                    {String(portalToken.studentResult.batch.semester).toLowerCase()} semester
                </p>

                <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
                    <div className="rounded-xl border border-(--border-subtle) bg-(--surface-soft) p-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-(--text-muted)">GPA</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">
                            {Number(portalToken.studentResult.gpa).toFixed(2)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-(--border-subtle) bg-(--surface-soft) p-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-(--text-muted)">CGPA</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">
                            {portalToken.studentResult.cgpa
                                ? Number(portalToken.studentResult.cgpa).toFixed(2)
                                : "N/A"}
                        </p>
                    </div>
                    <div className="rounded-xl border border-(--border-subtle) bg-(--surface-soft) p-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-(--text-muted)">Status</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">Approved</p>
                    </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                        <thead>
                            <tr className="text-xs uppercase tracking-[0.12em] text-(--text-muted)">
                                <th className="px-3 py-1">Code</th>
                                <th className="px-3 py-1">Course</th>
                                <th className="px-3 py-1">Units</th>
                                <th className="px-3 py-1">Grade</th>
                                <th className="px-3 py-1">Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map((course) => (
                                <tr key={`${course.code}-${course.title}`} className="rounded-xl bg-(--surface-soft)">
                                    <td className="rounded-l-xl px-3 py-2 font-medium text-foreground">{course.code}</td>
                                    <td className="px-3 py-2 text-(--text-secondary)">{course.title}</td>
                                    <td className="px-3 py-2 text-(--text-secondary)">{course.unit}</td>
                                    <td className="px-3 py-2 text-(--text-secondary)">{course.grade}</td>
                                    <td className="rounded-r-xl px-3 py-2 text-(--text-secondary)">{course.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
