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
        "rounded-xl border border-border bg-card p-5 transition-all hover:border-sidebar-primary/30",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">
              {dispatch.batch.department}
            </h3>
            <Badge variant="outline" className="text-[10px] font-bold tracking-tight">
              Dispatch
            </Badge>
          </div>
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-tight">
            {dispatch.batch.session} • {dispatch.batch.semester} • {dispatch.id.slice(0, 8)}...
          </p>
          <p className="text-xs text-muted-foreground">
            Triggered by <span className="font-medium text-foreground">{dispatch.triggeredBy?.name ?? "System"}</span>
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="rounded-md font-bold">
          <Link href={`/admin/delivery/${dispatch.id}`}>View Logs</Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/5 border border-emerald-500/10">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-bold text-emerald-700">
            {dispatch.sentCount ?? 0} Sent
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive/5 border border-destructive/10">
          <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
          <span className="text-[11px] font-bold text-destructive">
            {dispatch.failedCount ?? 0} Failed
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/50 border border-border/50">
          <span className="text-[11px] font-bold text-muted-foreground">
            {dispatch.totalCount ?? dispatch._count.notificationLogs} Total
          </span>
        </div>
      </div>
    </article>
  );
}
