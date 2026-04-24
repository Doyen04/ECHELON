import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CheckCircle2 } from "lucide-react";

import { ErrorState as UiErrorState } from "@/components/ui/error-state";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/admin-format";

type ResultViewPageProps = {
    searchParams: Promise<{
        token?: string;
    }>;
};

export const metadata: Metadata = {
    title: "Result View",
    description: "Public result portal for guardians and parents.",
};

export default async function PublicResultViewPage({ searchParams }: ResultViewPageProps) {
    const db = prisma as any;
    const { token } = await searchParams;

    if (!token) {
        return <TokenErrorState type="not_found" />;
    }

    const portalToken = await db.portalToken.findUnique({
        where: { token },
        include: {
            studentResult: {
                include: {
                    student: {
                        include: {
                            guardians: true,
                        },
                    },
                    batch: true,
                },
            },
        },
    });

    if (!portalToken) {
        return <TokenErrorState type="not_found" />;
    }

    if (portalToken.invalidated || portalToken.expiresAt <= new Date()) {
        return <TokenErrorState type="expired" />;
    }

    const result = portalToken.studentResult;
    const student = result.student;
    const courses = Array.isArray(result.courses) ? (result.courses as Array<{ code: string; title: string; unit: number; grade: string; score?: number | null }>) : [];
    const primaryGuardian = student.guardians.find((guardian: any) => guardian.email || guardian.phone) ?? student.guardians[0];

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            <header className="border-b-4 border-brand-hover bg-brand px-4 py-6">
                <div className="mx-auto flex max-w-170 items-center justify-center gap-3 page-transition-enter">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white/10">
                        <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <span className="font-serif text-xl tracking-wide text-white">University Registry</span>
                </div>
            </header>

            <main className="mx-auto max-w-170 space-y-6 p-4 pb-20 sm:p-6 md:p-8">
                <div className="page-transition-enter space-y-2 py-4 text-center" style={{ animationDelay: "50ms" }}>
                    <h1 className="font-serif text-3xl text-foreground sm:text-4xl">{student.fullName}</h1>
                    <div className="flex flex-col items-center justify-center gap-2 text-sm font-medium text-text-muted sm:flex-row sm:gap-3">
                        <span className="font-mono text-text-muted">{student.matricNumber}</span>
                        <span className="hidden sm:inline"> </span>
                        <span>{student.department}</span>
                        <span className="hidden sm:inline"> </span>
                        <span>Level {student.level}</span>
                    </div>
                    <div className="mt-1 text-sm font-medium text-foreground">
                        {result.batch.session} Session • {String(result.batch.semester).toLowerCase()} Semester
                    </div>
                </div>

                <div className="page-transition-enter flex items-start gap-4 rounded-xl border border-status-success/40 bg-status-success/5 px-6 py-4 shadow-sm sm:items-center" style={{ animationDelay: "100ms" }}>
                    <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-status-success sm:mt-0" />
                    <div>
                        <div className="font-medium text-foreground">Officially approved by University Senate</div>
                        <div className="mt-0.5 text-sm text-text-muted">Published on {formatDateTime(result.batch.approvedAt ?? result.batch.uploadedAt)}</div>
                    </div>
                </div>

                <div className="page-transition-enter overflow-hidden rounded-xl border border-border-subtle bg-surface-main shadow-md" style={{ animationDelay: "150ms" }}>
                    <div className="hidden border-b border-border-subtle bg-surface-subtle/50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted sm:grid sm:grid-cols-[1fr_2fr_1fr_1fr_1fr]">
                        <div>Course Code</div>
                        <div>Course Title</div>
                        <div className="text-center">Units</div>
                        <div className="text-center">Grade</div>
                        <div className="text-right">Score</div>
                    </div>

                    <div className="divide-y divide-border-subtle">
                        {courses.map((course) => (
                            <div key={course.code} className="flex flex-col px-4 py-4 transition-colors hover:bg-surface-subtle/20 sm:grid sm:grid-cols-[1fr_2fr_1fr_1fr_1fr] sm:items-center sm:px-6 sm:py-3">
                                <div className="mb-1 flex items-center justify-between sm:hidden">
                                    <div className="font-mono text-sm font-medium text-brand">{course.code}</div>
                                    <div className="text-xs text-text-muted">
                                        Score: <span className="font-mono text-sm font-medium text-foreground">{course.score ?? "N/A"}</span>
                                    </div>
                                </div>

                                <div className="mb-3 text-sm font-medium leading-snug text-foreground sm:hidden">{course.title}</div>

                                <div className="flex items-center justify-between rounded border border-border-subtle bg-surface-subtle/30 p-2 sm:hidden">
                                    <div className="text-xs text-text-muted">
                                        Units: <span className="font-medium text-foreground">{course.unit}</span>
                                    </div>
                                    <div className="text-xs text-text-muted">
                                        Grade: <span className="font-medium text-foreground">{course.grade}</span>
                                    </div>
                                </div>

                                <div className="hidden font-mono text-sm font-medium text-brand sm:block">{course.code}</div>
                                <div className="hidden text-sm text-foreground sm:block">{course.title}</div>
                                <div className="hidden text-center text-sm text-foreground sm:block">{course.unit}</div>
                                <div className="hidden text-center text-sm font-semibold text-foreground sm:block">{course.grade}</div>
                                <div className="hidden text-right font-mono text-sm text-text-muted sm:block">{course.score ?? "N/A"}</div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border-subtle bg-surface-subtle px-4 py-4 sm:px-6">
                        <div className="text-sm font-medium text-foreground">
                            Total Units: <span className="ml-1 font-mono">{courses.reduce((sum, course) => sum + Number(course.unit ?? 0), 0)}</span>
                        </div>
                        <div>
                            <span className="mr-2 text-xs uppercase tracking-widest text-text-muted">Semester GPA</span>
                            <span className="font-serif text-2xl font-medium text-brand">{result.cgpa ?? result.gpa}</span>
                        </div>
                    </div>
                </div>

                <div className="page-transition-enter space-y-1 py-4 text-center" style={{ animationDelay: "200ms" }}>
                    <p className="text-xs text-text-muted">This result was officially released by University Registry.</p>
                    <p className="text-xs text-text-muted">
                        This link automatically expires on <span className="font-medium text-text-muted">{formatDateTime(portalToken.expiresAt)}</span>. For queries, contact {primaryGuardian?.email ? <a href={`mailto:${primaryGuardian.email}`} className="text-brand hover:underline">{primaryGuardian.email}</a> : <span className="text-brand">registry@university.edu.ng</span>}.
                    </p>
                </div>
            </main>
        </div>
    );
}

function TokenErrorState({ type }: { type: "expired" | "not_found" }) {
    const copy =
        type === "expired"
            ? {
                title: "Link Expired",
                description:
                    "For security reasons, result notification links expire after the configured token lifetime. Please contact the Registry office for assistance if you still need access.",
                code: "TOKEN_EXPIRED",
            }
            : {
                title: "Result Link Not Found",
                description:
                    "This link does not exist, is malformed, or access has been revoked by the institution.",
                code: "TOKEN_NOT_FOUND",
            };

    return (
        <div className="page-transition-enter min-h-screen bg-background p-4 sm:p-6">
            <UiErrorState
                title={copy.title}
                description={copy.description}
                code={copy.code}
                details="If this link was sent recently, ask the registry to issue a new secure token."
            />
            <div className="mx-auto mt-4 flex w-full max-w-xl justify-center">
                <Link href="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                    Return Home
                </Link>
            </div>
        </div>
    );
}