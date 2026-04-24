import Link from "next/link";

import type { ActivityLog } from "@/lib/dashboard-data";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionFrame } from "./section-frame";

export function RecentActivity({ events }: { events: ActivityLog[] }) {
    return (
        <SectionFrame
            title="Recent Activity"
            description="Immutable actions across approval, dispatch, and compliance"
            action={
                <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link href="/admin/audit">View Audit Log</Link>
                </Button>
            }
        >
            <ol className="space-y-3">
                {events.map((event) => (
                    <li
                        key={event.id}
                        className="rounded-2xl border border-border/70 bg-muted/30 p-4"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">
                                {event.actor}
                            </p>
                            <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[11px] uppercase tracking-[0.08em]">
                                {event.role.replace("_", " ")}
                            </Badge>
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
