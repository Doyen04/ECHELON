import type { ApprovalBatch } from "@/lib/dashboard-data";

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
      title="Senate Approval Pipeline"
      description="Pending batches by department with contact readiness indicators"
      action={
        <a
          href="/admin/approvals"
          className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
        >
          Open Approvals Queue
        </a>
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-left">
          <thead>
            <tr className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
              <th className="px-3 py-1 font-medium">Batch</th>
              <th className="px-3 py-1 font-medium">Review Status</th>
              <th className="px-3 py-1 font-medium">Contact Coverage</th>
              <th className="px-3 py-1 font-medium">Last Action</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id} className="rounded-xl bg-[var(--surface-soft)] text-sm">
                <td className="rounded-l-xl px-3 py-3 align-top">
                  <p className="font-semibold text-[var(--text-primary)]">
                    {batch.department}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {batch.session} • {batch.semester} semester • {batch.id}
                  </p>
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="space-y-1 text-xs text-[var(--text-secondary)]">
                    <p>Pending: {batch.pending}</p>
                    <p>Approved: {batch.approved}</p>
                    <p>Withheld: {batch.withheld}</p>
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="w-36">
                    <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                      <span>{batch.contactCoverage}%</span>
                      <span>ready</span>
                    </div>
                    <div className="mt-2 h-2.5 rounded-full bg-[var(--surface-muted)]">
                      <div
                        className={`h-2.5 rounded-full ${coverageTone(batch.contactCoverage)}`}
                        style={{ width: `${batch.contactCoverage}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="rounded-r-xl px-3 py-3 align-top text-xs text-[var(--text-secondary)]">
                  {batch.lastActionAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionFrame>
  );
}
