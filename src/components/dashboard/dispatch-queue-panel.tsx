import Link from "next/link";

import type { DispatchQueueEntry, DispatchStatus } from "@/lib/dashboard-data";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./empty-state";
import { SectionFrame } from "./section-frame";

const statusTone: Record<DispatchStatus, string> = {
    queued: "bg-slate-200 text-slate-700",
    processing: "bg-sky-100 text-sky-700",
    complete: "bg-emerald-100 text-emerald-700",
    partial_failure: "bg-rose-100 text-rose-700",
};

function statusLabel(status: DispatchStatus) {
    if (status === "partial_failure") {
        return "partial failure";
    }
    return status;
}

function progress(entry: DispatchQueueEntry) {
    if (entry.totalStudents === 0) {
        return 0;
    }
    return Math.round((entry.processedStudents / entry.totalStudents) * 100);
}

export function DispatchQueuePanel({ queue }: { queue: DispatchQueueEntry[] }) {
    return (
        <SectionFrame
            title="Dispatch Queue"
            description="QStash jobs processing approved result batches"
            action={
                <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link href="/admin/delivery">Open Delivery Logs</Link>
                </Button>
            }
        >
            {queue.length === 0 ? (
                <EmptyState
                    title="No dispatches yet"
                    description="Approved batches will appear here when dispatch jobs are triggered."
                    ctaLabel="Upload batch"
                    ctaHref="/admin/batches/upload"
                />
            ) : (
            <div className="space-y-4">
                {queue.map((entry) => {
                    const completion = progress(entry);

                    return (
                        <article
                            key={entry.id}
                            className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-4"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {entry.batchLabel}
                                    </p>
                                    <p className="mt-1 text-xs text-(--text-muted)">{entry.id}</p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusTone[entry.status]}`}
                                >
                                    {statusLabel(entry.status)}
                                </Badge>
                            </div>

                            <div className="mt-3 h-2.5 rounded-full bg-(--surface-muted)">
                                <div
                                    className="h-2.5 rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent-soft))]"
                                    style={{ width: `${completion}%` }}
                                />
                            </div>

                            <div className="mt-3 grid gap-2 text-xs text-(--text-secondary) sm:grid-cols-3">
                                <p>
                                    Processed: {entry.processedStudents}/{entry.totalStudents}
                                </p>
                                <p>Success rate: {entry.successRate}%</p>
                                <p>ETA: {entry.eta}</p>
                            </div>
                        </article>
                    );
                })}
            </div>
            )}
        </SectionFrame>
    );
}
