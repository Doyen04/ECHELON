import Link from "next/link";

import type { ActivityLog } from "@/lib/dashboard-data";

import { SectionFrame } from "./section-frame";

export function RecentActivity({ events }: { events: ActivityLog[] }) {
    return (
        <SectionFrame
            title="Recent Activity"
            description="Immutable actions across approval, dispatch, and compliance"
            action={
                <Link
                    href="/admin/audit"
                    className="rounded-lg border border-(--border-subtle) px-3 py-2 text-xs font-medium text-(--text-secondary) transition hover:border-(--border-strong) hover:text-foreground"
                >
                    View Audit Log
                </Link>
            }
        >
            <ol className="space-y-3">
                {events.map((event) => (
                    <li
                        key={event.id}
                        className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-4"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">
                                {event.actor}
                            </p>
                            <span className="rounded-full bg-(--surface-muted) px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-(--text-secondary)">
                                {event.role.replace("_", " ")}
                            </span>
                        </div>
                        <p className="mt-2 text-sm text-(--text-secondary)">{event.action}</p>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-(--text-muted)">
                            <span>{event.target}</span>
                            <time>{event.time}</time>
                        </div>
                    </li>
                ))}
            </ol>
        </SectionFrame>
    );
}
