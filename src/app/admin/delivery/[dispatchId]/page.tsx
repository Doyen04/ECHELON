"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { useApi } from "@/lib/api";
import { LoadingState } from "@/components/ui/loading-state";

import { ExportButton } from "@/components/admin/export-button";
import { RetryFailedSendsButton } from "@/components/admin/retry-failed-sends-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, ChannelBadge } from "@/components/ui/badges";
import { SummaryCard } from "@/components/ui/summary-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  formatDateTime,
} from "@/lib/admin-format";

type DeliveryPageProps = {
  params: Promise<{
    dispatchId: string;
  }>;
};



export default function DeliveryLogPage({ params }: DeliveryPageProps) {
  const { dispatchId } = use(params);

  const { data, isLoading, error } = useApi<any>(
    `/api/delivery/${dispatchId}`,
    { immediate: true },
  );

  if (isLoading) {
    return <LoadingState title='Loading delivery log...' />;
  }

  if (error || !data) {
    if (error === "Dispatch not found") return notFound();
    return (
      <div className='p-8 text-center text-status-danger'>
        {error || "Failed to load delivery details"}
      </div>
    );
  }

  const { dispatch, notificationLogs, students, guardians } = data;

  const studentById = new Map<
    string,
    { id: string; fullName: string; matricNumber: string }
  >(students.map((student: any) => [student.id, student]));
  const guardianById = new Map<string, { id: string; name: string }>(
    guardians.map((guardian: any) => [guardian.id, guardian]),
  );

  const total = dispatch.totalCount ?? notificationLogs.length;
  const sent = dispatch.sentCount ?? 0;
  const failed = dispatch.failedCount ?? 0;
  const processed = sent + failed;
  const queued = Math.max(total - processed, 0);
  const successRate = total === 0 ? 0 : Math.round((sent / total) * 100);

  return (
    <div className='dashboard-root min-h-screen bg-background'>
      <PageHeader
        title='Delivery Log'
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: "Delivery", href: "/admin/delivery" },
              { label: dispatch.id },
            ]}
          />
        }
        action={
          <ExportButton
            endpoint={`/api/delivery/${dispatch.id}/export`}
            filename={`delivery-${dispatch.id}.csv`}
          />
        }
      />

      <main className='mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
        <Card className='rounded-3xl p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8'>
          <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)'>
                Dispatch Activity
              </p>
              <h1 className='mt-2 text-3xl font-semibold tracking-tight text-foreground'>
                {dispatch.batch.department}
              </h1>
              <p className='mt-2 text-sm text-(--text-secondary)'>
                {dispatch.batch.session} •{" "}
                {String(dispatch.batch.semester).toLowerCase()} semester •
                Triggered by {dispatch.triggeredBy?.name ?? "System"}
              </p>
            </div>

            <div className='flex flex-wrap gap-2'>
              <StatusBadge
                status={String(dispatch.status).toLowerCase() as any}
              />
              <Badge
                variant='outline'
                className='rounded-full px-2.5 py-1 text-xs font-medium'
              >
                {dispatch.id}
              </Badge>
            </div>
          </div>

          <div className='mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            <SummaryCard title='Total Logs' value={String(total)} />
            <SummaryCard
              title='Sent'
              value={`${sent}`}
              subvalue={`${successRate}%`}
              color='text-[var(--color-success)]'
            />
            <SummaryCard
              title='Failed'
              value={String(failed)}
              color='text-[var(--color-danger)]'
            />
            <SummaryCard title='Queued' value={String(queued)} />
          </div>

          <div className='mt-6 rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-5'>
            <div className='flex items-center justify-between gap-3 text-sm font-medium'>
              <span className='text-foreground'>Dispatch Progress</span>
              <span className='text-(--text-secondary)'>
                {processed} processed
              </span>
            </div>
            <div className='mt-3 h-3 w-full overflow-hidden rounded-full bg-(--surface-muted)'>
              <div
                className='h-full bg-emerald-500'
                style={{ width: `${total === 0 ? 0 : (sent / total) * 100}%` }}
              />
            </div>
            <div className='mt-4 flex flex-wrap gap-4 text-xs font-medium'>
              <span className='text-(--text-secondary)'>Sent: {sent}</span>
              <span className='text-(--text-secondary)'>Failed: {failed}</span>
              <span className='text-(--text-secondary)'>Queued: {queued}</span>
            </div>
          </div>

          <div className='mt-6 grid gap-4 lg:grid-cols-[1.25fr_.75fr]'>
            <article className='rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-5'>
              <p className='text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)'>
                Dispatch Details
              </p>
              <div className='mt-4 space-y-3 text-sm text-(--text-secondary)'>
                <p>
                  <span className='text-foreground font-medium'>Batch:</span>{" "}
                  {dispatch.batch.department}
                </p>
                <p>
                  <span className='text-foreground font-medium'>
                    Triggered:
                  </span>{" "}
                  {formatDateTime(dispatch.triggeredAt)}
                </p>
                <p>
                  <span className='text-foreground font-medium'>
                    Total Count:
                  </span>{" "}
                  {total}
                </p>
                <p>
                  <span className='text-foreground font-medium'>
                    Processed:
                  </span>{" "}
                  {processed}
                </p>
              </div>
            </article>

            <article className='rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-5'>
              <p className='text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)'>
                Quick Actions
              </p>
              <div className='mt-4 flex flex-col gap-3'>
                <RetryFailedSendsButton
                  dispatchId={dispatch.id}
                  failedCount={dispatch.failedCount ?? failed}
                />
                <Button asChild className='rounded-full'>
                  <Link href='/admin/delivery'>Back to dispatch list</Link>
                </Button>
              </div>
            </article>
          </div>
        </Card>

        <Card className='mt-6 overflow-hidden rounded-3xl shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)]'>
          <div className='border-b border-(--border-subtle) px-6 py-4 sm:px-8'>
            <h2 className='text-lg font-semibold text-foreground'>
              Notification Logs
            </h2>
            <p className='mt-1 text-sm text-(--text-secondary)'>
              Each row reflects one guardian notification attempt for this
              dispatch.
            </p>
          </div>

          {notificationLogs.length > 0 ? (
            <div className='overflow-x-auto'>
              <DataTable
                data={notificationLogs}
                className='border-0 shadow-none -mx-px'
                columns={[
                  {
                    header: "Student",
                    accessorKey: "student",
                    className: "px-6 py-4 text-sm text-foreground",
                    cell: (row: any) => {
                      const student = studentById.get(row.studentId) as
                        | { fullName?: string; matricNumber?: string }
                        | undefined;
                      return (
                        <>
                          <div className='font-medium'>
                            {student?.fullName ?? "Unknown student"}
                          </div>
                          <div className='mt-1 text-xs text-(--text-muted)'>
                            {student?.matricNumber ?? row.studentId}
                          </div>
                        </>
                      );
                    },
                  },
                  {
                    header: "Guardian",
                    accessorKey: "guardian",
                    className: "px-6 py-4 text-sm text-foreground",
                    cell: (row: any) => {
                      const guardian = (
                        row.guardianId ? guardianById.get(row.guardianId) : null
                      ) as { name?: string } | null;
                      return <>{guardian?.name ?? "Unknown guardian"}</>;
                    },
                  },
                  {
                    header: "Channel",
                    accessorKey: "channel",
                    className: "px-6 py-4",
                    cell: (row: any) => (
                      <ChannelBadge
                        channel={String(row.channel).toLowerCase() as any}
                      />
                    ),
                  },
                  {
                    header: "Status",
                    accessorKey: "status",
                    className: "px-6 py-4",
                    cell: (row: any) => (
                      <StatusBadge
                        status={String(row.status).toLowerCase() as any}
                      />
                    ),
                  },
                  {
                    header: "Attempted At",
                    accessorKey: "attemptedAt",
                    className: "px-6 py-4 text-sm text-(--text-secondary)",
                    cell: (row: any) => <>{formatDateTime(row.attemptedAt)}</>,
                  },
                  {
                    header: "Details",
                    accessorKey: "details",
                    className: "px-6 py-4 text-sm text-(--text-secondary)",
                    cell: (row: any) => (
                      <>
                        {row.failureReason ??
                          row.providerMessageId ??
                          "Delivered successfully"}
                      </>
                    ),
                  },
                ]}
              />
            </div>
          ) : (
            <div className='px-6 py-10 text-sm text-(--text-secondary)'>
              No notification logs are available for this dispatch yet.
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}


