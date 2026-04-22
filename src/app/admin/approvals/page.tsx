import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badges";
import { ArrowRight, ChevronDown, CheckSquare, Clock } from "lucide-react";

export default function ApprovalsPage() {
    return (
        <div className="flex flex-col h-full overflow-y-auto w-full bg-background dashboard-root">
            <PageHeader
                title="Approvals"
                breadcrumbs="4 batches pending review"
            />

            <div className="p-6 md:p-8 space-y-8 max-w-5xl w-full mx-auto">
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted border-b border-border-subtle pb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Action Required (4)
                    </h2>

                    <div className="grid gap-4">
                        <PendingCard
                            id="BCH-8A92"
                            title="Computer Science   First Semester 2024/2025"
                            uploader="Registrar Adeyemi"
                            time="2 days ago"
                            students={247}
                            source="CSV"
                        />
                        <PendingCard
                            id="BCH-9M2P"
                            title="Mathematics   First Semester 2024/2025"
                            uploader="Registrar Adeyemi"
                            time="2 days ago"
                            students={86}
                            source="CSV"
                        />
                        <PendingCard
                            id="BCH-2N5A"
                            title="Biology   First Semester 2024/2025"
                            uploader="M. Eze"
                            time="1 week ago"
                            students={210}
                            source="CSV"
                        />
                        <PendingCard
                            id="BCH-5Y7K"
                            title="Medicine   First Semester 2023/2024"
                            uploader="Registrar Adeyemi"
                            time="2 weeks ago"
                            students={310}
                            source="API"
                        />
                    </div>
                </div>

                <div className="pt-8 dashboard-section" style={{ animationDelay: '150ms' }}>
                    <details className="group rounded-xl border border-border-subtle bg-surface-main shadow-sm overflow-hidden">
                        <summary className="flex cursor-pointer items-center justify-between p-5 list-none [&::-webkit-details-marker]:hidden bg-surface-subtle/30 hover:bg-surface-subtle/60 transition-colors">
                            <div className="flex items-center gap-2">
                                <CheckSquare className="h-5 w-5 text-status-success" />
                                <h3 className="font-medium text-foreground">Reviewed Batches <span className="text-text-muted">(12)</span></h3>
                            </div>
                            <ChevronDown className="h-5 w-5 text-text-muted transition-transform group-open:rotate-180" />
                        </summary>

                        <div className="border-t border-border-subtle bg-white overflow-x-auto">
                            <table className="min-w-full divide-y divide-border-subtle">
                                <thead className="bg-surface-subtle/20">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Batch ID</th>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Session/Dept</th>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    <tr>
                                        <td className="px-5 py-4 text-sm font-mono text-text-muted">BCH-7F1X</td>
                                        <td className="px-5 py-4 text-sm text-foreground">Physics   2024/2025</td>
                                        <td className="px-5 py-4"><StatusBadge status="approved" /></td>
                                    </tr>
                                    <tr>
                                        <td className="px-5 py-4 text-sm font-mono text-text-muted">BCH-4L8K</td>
                                        <td className="px-5 py-4 text-sm text-foreground">Chemistry   2024/2025</td>
                                        <td className="px-5 py-4"><StatusBadge status="approved" /></td>
                                    </tr>
                                    <tr>
                                        <td className="px-5 py-4 text-sm font-mono text-text-muted">BCH-1P3V</td>
                                        <td className="px-5 py-4 text-sm text-foreground">Accounting   2023/2024</td>
                                        <td className="px-5 py-4"><StatusBadge status="approved" /></td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="px-5 py-3 text-sm text-brand hover:underline cursor-pointer border-t border-border-subtle bg-surface-subtle/10 text-center font-medium">
                                View all reviewed batches
                            </div>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
}

function PendingCard({ id, title, uploader, time, students, source }: any) {
    return (
        <div className="rounded-xl border-l-4 border-status-warning bg-surface-main p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 dashboard-card">
            <div className="space-y-3 flex-1">
                <div>
                    <h3 className="font-serif text-[1.1rem] text-foreground mb-1">{title}</h3>
                    <p className="text-sm text-text-muted">
                        Uploaded by {uploader}   {time}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-text-muted">
                        {students} students
                    </span>
                    <span className="inline-flex items-center rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-text-muted uppercase">
                        {source} source
                    </span>
                    <StatusBadge status="pending" />
                </div>
            </div>

            <div className="shrink-0 flex items-center self-start md:self-auto w-full md:w-auto">
                <Link
                    href={`/admin/batches/${id}`}
                    className="flex w-full md:w-auto items-center justify-center gap-2 rounded-md border border-brand bg-surface-main px-5 py-2.5 text-sm font-medium text-brand shadow-sm hover:bg-brand/5 hover:border-brand-hover transition-colors group"
                >
                    Begin Review <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>
        </div>
    )
}
