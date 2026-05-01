"use client";

import Link from "next/link";
import { useApi } from "@/lib/api";
import { LoadingState } from "@/components/ui/loading-state";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DeliveryPage() {
  const { data, isLoading, error } = useApi<{ dispatches: any[] }>(
    "/api/delivery",
    { immediate: true },
  );

  if (isLoading) {
    return <LoadingState title='Loading delivery dispatches...' />;
  }

  if (error || !data) {
    return (
      <div className='p-8 text-center text-status-danger'>
        {error || "Failed to load dispatches"}
      </div>
    );
  }

  const { dispatches } = data;

  return (
    <main className='dashboard-root min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8'>
      <div className='dashboard-grid-overlay' aria-hidden='true' />
      <Card className='mx-auto w-full max-w-6xl rounded-3xl p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8'>
        <p className='text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)'>
          Delivery Monitoring
        </p>
        <h1 className='mt-2 text-3xl font-semibold tracking-tight text-foreground'>
          Dispatch Activity
        </h1>
        <p className='mt-3 text-sm text-(--text-secondary)'>
          Track each dispatch job and open detail views for status and failed
          sends.
        </p>

        <div className='mt-6 space-y-3'>
          {dispatches.map((dispatch: any) => (
            <article
              key={dispatch.id}
              className='rounded-2xl border border-border/70 bg-muted/30 px-4 py-3'
            >
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div className='space-y-1'>
                  <p className='text-sm font-semibold text-foreground'>
                    {dispatch.batch.department}
                  </p>
                  <p className='text-xs text-(--text-muted)'>
                    {dispatch.batch.session} •{" "}
                    {String(dispatch.batch.semester).toLowerCase()} •{" "}
                    {dispatch.id}
                  </p>
                  <p className='text-sm text-(--text-secondary)'>
                    Triggered by {dispatch.triggeredBy?.name ?? "System"}
                  </p>
                </div>
                <Button asChild size='sm' className='rounded-full'>
                  <Link href={`/admin/delivery/${dispatch.id}`}>Open Logs</Link>
                </Button>
              </div>
              <div className='mt-3 flex flex-wrap items-center gap-2 text-xs font-medium'>
                <span className='rounded-full border border-(--border-subtle) bg-surface-main px-2.5 py-1 text-(--text-secondary)'>
                  Success{" "}
                  <span className='text-foreground'>
                    {dispatch.sentCount ?? 0}
                  </span>
                </span>
                <span className='rounded-full border border-(--border-subtle) bg-surface-main px-2.5 py-1 text-(--text-secondary)'>
                  Failed{" "}
                  <span className='text-foreground'>
                    {dispatch.failedCount ?? 0}
                  </span>
                </span>
                <span className='rounded-full border border-(--border-subtle) bg-surface-main px-2.5 py-1 text-(--text-secondary)'>
                  Total{" "}
                  <span className='text-foreground'>
                    {dispatch.totalCount ?? dispatch._count.notificationLogs}
                  </span>
                </span>
                <span className='ml-1 text-(--text-muted)'>
                  {dispatch._count.notificationLogs} log(s)
                </span>
                <Badge variant='outline' className='rounded-full text-[11px]'>
                  Dispatch
                </Badge>
              </div>
            </article>
          ))}
          {dispatches.length === 0 ? (
            <div className='rounded-2xl border border-dashed border-(--border-subtle) p-8 text-sm text-(--text-secondary)'>
              No dispatches found.
            </div>
          ) : null}
        </div>
      </Card>
    </main>
  );
}
