import type { ActivityLog } from "@/lib/dashboard-data";

import { SectionFrame } from "./section-frame";

export function RecentActivity({ events }: { events: ActivityLog[] }) {
  return (
    <SectionFrame
      title="Recent Activity"
      description="Immutable actions across approval, dispatch, and compliance"
      action={
        <a
          href="/admin/audit"
          className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
        >
          View Audit Log
        </a>
      }
    >
      <ol className="space-y-3">
        {events.map((event) => (
          <li
            key={event.id}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {event.actor}
              </p>
              <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                {event.role.replace("_", " ")}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{event.action}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
              <span>{event.target}</span>
              <time>{event.time}</time>
            </div>
          </li>
        ))}
      </ol>
    </SectionFrame>
  );
}
