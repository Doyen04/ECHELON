import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badges";
import { ArrowRight, ChevronDown, CheckSquare, Clock } from "lucide-react";

export default function ApprovalsPage() {
    return (
        <div className="flex flex-col h-full overflow-y-auto w-full bg-background">
            <PageHeader
                title="Approvals"
                breadcrumbs={
                    <div className="flex items-center gap-1">
                        <Link href="/admin/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
                        <span>/</span>
                        <span className="text-foreground">Review Queue</span>
                    </div>
                }
            />

            <div className="p-6 md:p-8 space-y-8 max-w-400 w-full mx-auto">
                <div className="space-y-6 dashboard-section">
                    <h2 className="text-xl font-serif text-foreground flex items-center gap-2">
                        <Clock className="h-5 w-5 text-status-warning" /> Action Required (4)
                    </h2>

                    <div className="grid gap-4">
                        <PendingCard
                            id="BCH-8A92"
                            title="Computer Science — First Semester 2024/2025"
                            uploader="Registrar Adeyemi"
                            time="2 days ago"
                            students={247}
                            source="CSV"
                            delay={0}
                        />
                        <PendingCard
                            id="BCH-9M2P"
                            title="Mathematics — First Semester 2024/2025"
                            uploader="Registrar Adeyemi"
                            time="2 days ago"
                            students={86}
                            source="CSV"
                            delay={1}
                        />
                        <PendingCard
                            id="BCH-2N5A"
                            title="Biology — First Semester 2024/2025"
                            uploader="M. Eze"
                            time="1 week ago"
                            students={210}
                            source="CSV"
                            delay={2}
                        />
                        <PendingCard
                            id="BCH-5Y7K"
                            title="Medicine — First Semester 2023/2024"
                            uploader="Registrar Adeyemi"
                            time="2 weeks ago"
                            students={310}
                            source="API"
                            delay={3}
                        />
                    </div>
                </div>

                <div className="pt-4 dashboard-section" style={{ animationDelay: '150ms' }}>
                    <h2 className="text-lg font-serif text-foreground mb-4">Historical Approvals</h2>
                    <details className="group rounded-xl border border-border-subtle bg-surface-main shadow-sm overflow-hidden">
                        <summary className="flex cursor-pointer items-center justify-between p-5 list-none [&::-webkit-details-marker]:hidden bg-surface-subtle/20 hover:bg-surface-subtle/40 transition-colors">
                            <div className="flex items-center gap-2">
                                <CheckSquare className="h-5 w-5 text-status-success" />
                                <h3 className="font-medium text-foreground">Recently Reviewed Batches <span className="text-text-muted ml-1">(12 total)</span></h3>
                            </div>
                            <ChevronDown className="h-5 w-5 text-text-muted transition-transform group-open:rotate-180" />
                        </summary>

                        <div className="border-t border-border-subtle bg-surface-main overflow-x-auto">
                            <table className="min-w-full divide-y divide-border-subtle">
                                <thead className="bg-surface-subtle/30">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Batch ID</th>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Session & Department</th>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    <ApprovedRow id="BCH-7F1X" label="Physics — 2024/2025" />
                                    <ApprovedRow id="BCH-4L8K" label="Chemistry — 2024/2025" />
                                    <ApprovedRow id="BCH-1P3V" label="Accounting — 2023/2024" />
                                </tbody>
                            </table>
                            <div className="px-5 py-4 text-sm text-brand hover:text-brand-hover cursor-pointer border-t border-border-subtle bg-surface-subtle/5 transition-colors text-center font-medium hover:underline">
                                View complete review history
                            </div>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
}

function PendingCard({ id, title, uploader, time, students, source, delay }: any) {
    return (
        <div 
            className="rounded-xl border border-border-subtle bg-surface-main p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 dashboard-card hover:border-brand/30 transition-colors"
            style={{ animationDelay: `${delay * 60}ms` }}
        >
            <div className="space-y-4 flex-1">
                <div>
                    <h3 className="font-serif text-lg text-foreground mb-1">{title}</h3>
                    <p className="text-sm text-text-muted">
                        Uploaded by <span className="text-foreground font-medium">{uploader}</span> • {time}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-surface-subtle/60 px-3 py-1 text-[11px] font-medium text-text-muted border border-border-subtle/50">
                        {students} students
                    </span>
                    <span className="inline-flex items-center rounded-full bg-surface-subtle/60 px-3 py-1 text-[11px] font-medium text-text-muted uppercase tracking-wider border border-border-subtle/50">
                        {source} source
                    </span>
                    <StatusBadge status="pending" />
                </div>
            </div>

            <div className="shrink-0 flex items-center self-start md:self-auto w-full md:w-auto">
                <Link
                    href={`/admin/batches/${id}`}
                    className="flex w-full md:w-auto items-center justify-center gap-2 rounded-md bg-brand px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-hover transition-all active:scale-[0.98] group"
                >
                    Begin Review <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    )
}

function ApprovedRow({ id, label }: { id: string, label: string }) {
    return (
        <tr className="hover:bg-surface-subtle/30 transition-colors">
            <td className="px-5 py-4 text-sm font-mono text-text-muted">{id}</td>
            <td className="px-5 py-4 text-sm text-foreground font-medium">{label}</td>
            <td className="px-5 py-4 text-right"><StatusBadge status="approved" /></td>
        </tr>
    );
}
