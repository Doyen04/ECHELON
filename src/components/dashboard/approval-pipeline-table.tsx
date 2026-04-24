import Link from "next/link";

import type { ApprovalBatch } from "@/lib/dashboard-data";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./empty-state";
import { SectionFrame } from "./section-frame";

function coverageTone(coverage: number) {
    if (coverage >= 95) {
        return "bg-emerald-500";
    }
    if (coverage >= 90) {
        return "bg-amber-500";
    }
    return "bg-rose-500";
}

export function ApprovalPipelineTable({ batches }: { batches: ApprovalBatch[] }) {
    return (
        <SectionFrame
            title="Result Approval Pipeline"
            description="Pending batches by department with contact readiness indicators"
            action={
                <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link href="/admin/approvals">Open Approvals Queue</Link>
                </Button>
            }
        >
            {batches.length === 0 ? (
                <EmptyState
                    title="No batches pending review"
                    description="Upload a batch to begin senate review and approval tracking."
                    ctaLabel="Upload batch"
                    ctaHref="/admin/batches/upload"
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-2 text-left">
                        <thead>
                            <tr className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">
                                <th className="px-3 py-1 font-medium">Batch</th>
                                <th className="px-3 py-1 font-medium">Review Status</th>
                                <th className="px-3 py-1 font-medium">Contact Coverage</th>
                                <th className="px-3 py-1 font-medium">Last Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.map((batch, index) => (
                                <tr key={batch.id} className="table-row-enter rounded-xl bg-(--surface-soft) text-sm" style={{ animationDelay: `${index * 30}ms` }}>
                                    <td className="rounded-l-xl px-3 py-3 align-top">
                                        <p className="font-semibold text-foreground">{batch.department}</p>
                                        <p className="mt-1 text-xs text-(--text-muted)">
                                            {batch.session} • {batch.semester} semester • {batch.id}
                                        </p>
                                    </td>
                                    <td className="px-3 py-3 align-top">
                                        <div className="flex flex-wrap gap-1.5 text-xs text-(--text-secondary)">
                                            <Badge variant="outline" className="rounded-full border-border/70 bg-background px-2 py-0.5">Pending {batch.pending}</Badge>
                                            <Badge variant="success" className="rounded-full px-2 py-0.5">Approved {batch.approved}</Badge>
                                            <Badge variant="destructive" className="rounded-full px-2 py-0.5">Withheld {batch.withheld}</Badge>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 align-top">
                                        <div className="w-36">
                                            <div className="flex items-center justify-between text-xs text-(--text-secondary)">
                                                <span>{batch.contactCoverage}%</span>
                                                <span>ready</span>
                                            </div>
                                            <div className="mt-2 h-2.5 rounded-full bg-(--surface-muted)">
                                                <div className={`h-2.5 rounded-full ${coverageTone(batch.contactCoverage)}`} style={{ width: `${batch.contactCoverage}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="rounded-r-xl px-3 py-3 align-top text-xs text-(--text-secondary)">{batch.lastActionAt}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </SectionFrame>
    );
}
