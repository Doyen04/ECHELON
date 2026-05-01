"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DispatchCardProps {
  dispatch: any;
  className?: string;
}

export function DispatchCard({ dispatch, className }: DispatchCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-border/70 bg-muted/30 px-4 py-3",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {dispatch.batch.department}
          </p>
          <p className="text-xs text-text-muted">
            {dispatch.batch.session} •{" "}
            {String(dispatch.batch.semester).toLowerCase()} •{" "}
            {dispatch.id}
          </p>
          <p className="text-sm text-text-secondary">
            Triggered by {dispatch.triggeredBy?.name ?? "System"}
          </p>
        </div>
        <Button asChild size="sm" className="rounded-full">
          <Link href={`/admin/delivery/${dispatch.id}`}>Open Logs</Link>
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium">
        <span className="rounded-full border border-(--border-subtle) bg-surface-main px-2.5 py-1 text-text-secondary">
          Success{" "}
          <span className="text-foreground">
            {dispatch.sentCount ?? 0}
          </span>
        </span>
        <span className="rounded-full border border-(--border-subtle) bg-surface-main px-2.5 py-1 text-text-secondary">
          Failed{" "}
          <span className="text-foreground">
            {dispatch.failedCount ?? 0}
          </span>
        </span>
        <span className="rounded-full border border-(--border-subtle) bg-surface-main px-2.5 py-1 text-text-secondary">
          Total{" "}
          <span className="text-foreground">
            {dispatch.totalCount ?? dispatch._count.notificationLogs}
          </span>
        </span>
        <span className="ml-1 text-text-muted">
          {dispatch._count.notificationLogs} log(s)
        </span>
        <Badge variant="outline" className="rounded-full text-[11px]">
          Dispatch
        </Badge>
      </div>
    </article>
  );
}
