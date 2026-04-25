import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { UserCog, ChevronDown, ChevronRight, Phone, Mail, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badges";
import { prisma } from "@/lib/db";
import { formatDateTime, semesterLabel, toBadgeStatus } from "@/lib/admin-format";

type StudentPageProps = {
    params: Promise<{
        studentId: string;
    }>;
};

export const metadata: Metadata = {
    title: "Student Records",
    description: "Detailed student profile, guardians, and result history.",
};

export default async function StudentRecordPage({ params }: StudentPageProps) {
    const db = prisma as any;
    const { studentId } = await params;

    if (!studentId) {
        notFound();
    }

    const student = await db.student.findUnique({
        where: { id: studentId },
        include: {
            guardians: true,
            studentResults: {
                orderBy: { id: "desc" },
                include: {
                    batch: true,
                    portalTokens: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                    },
                },
            },
        },
    });

    if (!student) {
        notFound();
    }

    const expandedHistory = new Set(student.studentResults.map((result: any) => result.id));

    return (
        <div className="dashboard-root flex h-full w-full flex-col overflow-y-auto bg-background">
            <PageHeader
                title={
                    <div className="flex flex-col">
                        <span className="font-serif text-2xl text-foreground">{student.fullName}</span>
                        <div className="mt-1 flex items-center gap-2 text-sm font-normal tracking-normal text-text-muted">
                            <span className="font-mono text-text-muted">{student.matricNumber}</span>
                            <span>·</span>
                            <span>{student.department}</span>
                            <span>·</span>
                            <span>Level {student.level}</span>
                        </div>
                    </div>
                }
                action={
                    <Button variant="outline" className="rounded-full">
                        <UserCog className="h-4 w-4" />
                        Edit Contacts
                    </Button>
                }
            />

            <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 pb-24">
                <div className="flex flex-col gap-8 lg:flex-row">
                    <Card className="flex-1 space-y-6 p-6 dashboard-section lg:max-w-[65%] shadow-sm">
                        <h2 className="flex items-center justify-between border-b border-border-subtle pb-2 text-sm font-semibold uppercase tracking-widest text-text-muted">
                            Result History
                            <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs font-medium text-text-muted">
                                {student.studentResults.length} records
                            </Badge>
                        </h2>

                        <div className="space-y-4">
                            {student.studentResults.map((result: any, index: number) => {
                                const isExpanded = expandedHistory.has(result.id);
                                const token = result.portalTokens?.[0]?.token;

                                return (
                                    <div key={result.id} className="overflow-hidden rounded-xl border border-border-subtle bg-surface-main shadow-sm" style={{ animationDelay: `${index * 100}ms` }}>
                                        <div className="w-full p-5 text-left transition-colors hover:bg-surface-subtle/40">
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`rounded p-1 text-text-muted ${isExpanded ? "bg-surface-subtle" : ""}`}>
                                                            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-foreground">{result.batch.session}</div>
                                                            <div className="text-sm text-text-muted">
                                                                {semesterLabel(result.batch.semester)} • {result.batch.department}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="hidden h-8 w-px bg-border-subtle sm:block" />
                                                    <div className="hidden sm:block">
                                                        <div className="text-sm text-text-muted">GPA</div>
                                                        <div className="font-medium text-foreground">{result.gpa}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <StatusBadge status={toBadgeStatus(result.status)} />
                                                </div>
                                            </div>
                                        </div>

                                        {isExpanded ? (
                                            <div className="border-t border-border-subtle page-transition-enter">
                                                <div className="bg-surface-subtle/30 px-6 py-4">
                                                    <div className="mb-3 flex items-end justify-between">
                                                        <h4 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Course Breakdown</h4>
                                                        {token ? (
                                                            <Link href={`/results/view?token=${token}`} target="_blank" className="text-xs font-medium text-brand hover:underline">
                                                                View Parent Portal Render →
                                                            </Link>
                                                        ) : null}
                                                    </div>
                                                    <table className="min-w-full overflow-hidden rounded border border-border-subtle bg-surface-main divide-y divide-border-subtle">
                                                        <thead className="bg-surface-subtle/50">
                                                            <tr>
                                                                <th className="w-24 px-4 py-2 text-left text-xs font-medium text-text-muted">Code</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-text-muted">Title</th>
                                                                <th className="w-16 px-4 py-2 text-left text-xs font-medium text-text-muted">Units</th>
                                                                <th className="w-16 px-4 py-2 text-left text-xs font-medium text-text-muted">Grade</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border-subtle">
                                                            {(result.courses as Array<{ code: string; title: string; unit: number; grade: string }>)?.map((course) => (
                                                                <tr key={course.code} className="hover:bg-surface-subtle/20">
                                                                    <td className="px-4 py-2 text-sm font-mono text-text-muted">{course.code}</td>
                                                                    <td className="px-4 py-2 text-sm text-foreground">{course.title}</td>
                                                                    <td className="px-4 py-2 text-sm text-foreground">{course.unit}</td>
                                                                    <td className="px-4 py-2 text-sm font-medium text-foreground">{course.grade}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    <Card className="space-y-6 p-6 lg:min-w-90 xl:w-[35%] dashboard-section shadow-sm" style={{ animationDelay: "150ms" }}>
                        <h2 className="flex items-center justify-between border-b border-border-subtle pb-2 text-sm font-semibold uppercase tracking-widest text-text-muted">
                            Guardian Contacts
                            <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs font-medium text-text-muted">
                                {student.guardians.length} assigned
                            </Badge>
                        </h2>

                        <div className="space-y-4">
                            {student.guardians.map((guardian: any) => (
                                <div key={guardian.id} className="rounded-xl border border-border-subtle bg-surface-main p-5 shadow-sm">
                                    <div className="mb-4 flex items-start justify-between">
                                        <div>
                                            <h3 className="font-serif text-lg text-foreground">{guardian.name}</h3>
                                            <p className="text-sm text-text-muted">{guardian.relationship}</p>
                                        </div>
                                    </div>

                                    <div className="mb-5 space-y-3">
                                        {guardian.phone ? (
                                            <div className="flex items-center gap-3 text-sm">
                                                <Phone className="h-4 w-4 text-text-muted" />
                                                <span className="font-mono text-foreground">{guardian.phone}</span>
                                                <span className="ml-auto inline-flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-green-800">
                                                    WhatsApp
                                                </span>
                                            </div>
                                        ) : null}
                                        {guardian.email ? (
                                            <div className="flex items-center gap-3 text-sm">
                                                <Mail className="h-4 w-4 text-text-muted" />
                                                <span className="font-mono text-foreground">{guardian.email}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 text-sm text-status-warning">
                                                <Mail className="h-4 w-4" />
                                                <span className="italic">No email provided</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-border-subtle pt-3 text-sm text-text-muted">
                                        Contact details are managed from the contacts page.
                                    </div>
                                </div>
                            ))}

                            <Button variant="outline" className="flex w-full items-center justify-center gap-2 rounded-full border-dashed">
                                <Plus className="h-4 w-4" />
                                Add Guardian
                            </Button>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}