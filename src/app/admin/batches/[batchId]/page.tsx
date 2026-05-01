"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { use } from "react";
import { useApi } from "@/hooks/use-api";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/badges";
import { SummaryCard } from "@/components/shared/summary-card";
import { DataTable } from "@/components/shared/data-table";
import { ApproveDispatchButton } from "@/components/features/admin/approve-dispatch-button";
import { ExportButton } from "@/components/features/admin/export-button";
import { ApiGate } from "@/components/shared/api-gate";
import { columns } from "./columns";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

import {
  formatDateTime,
  relativeTimeFromNow,
  semesterLabel,
  toBadgeStatus,
} from "@/lib/admin-format";

type BatchPageProps = {
  params: Promise<{
    batchId: string;
  }>;
};

export default function BatchDetailPage({ params }: BatchPageProps) {
  const { batchId } = use(params);

  const {
    data: batch,
    isLoading,
    error,
  } = useApi<any>(`/api/batches/${batchId}`, { immediate: true });

  return (
    <ApiGate
      data={batch}
      isLoading={isLoading}
      error={error}
      loadingTitle="Loading batch details..."
      errorMessage="Failed to load batch"
    >
      {(batch) => {
        const approvedCount = batch.studentResults.filter(
          (result: any) => result.status === "APPROVED",
        ).length;
        const pendingCount = batch.studentResults.filter(
          (result: any) => result.status === "PENDING",
        ).length;
        const withheldCount = batch.studentResults.filter(
          (result: any) => result.status === "WITHHELD",
        ).length;

        return (
          <div className='dashboard-root flex h-full w-full flex-col overflow-y-auto bg-background'>
            <PageHeader
              title={batch.department}
              breadcrumbs={
                <Breadcrumbs
                  items={[
                    { label: "Batches", href: "/admin/batches" },
                    { label: batch.id },
                  ]}
                />
              }
              action={
                <div className='flex items-center gap-2'>
                  {batch.status === "PENDING" || batch.status === "IN_REVIEW" ? (
                    <ApproveDispatchButton batchId={batch.id} />
                  ) : null}
                  <ExportButton
                    endpoint={`/api/batches/${batch.id}/export`}
                    filename={`batch-detail-${batch.id}.csv`}
                  />
                </div>
              }
            />

            <main className='mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 pb-24'>
              <Card className='rounded-3xl p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8'>
                <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                  <div>
                    <p className='text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)'>
                      Batch Overview
                    </p>
                    <h1 className='mt-2 text-3xl font-semibold tracking-tight text-foreground'>
                      {batch.department}
                    </h1>
                    <p className='mt-2 text-sm text-(--text-secondary)'>
                      {batch.session} • {semesterLabel(batch.semester)} Semester •
                      Uploaded {relativeTimeFromNow(batch.uploadedAt)}
                    </p>
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    <StatusBadge status={toBadgeStatus(batch.status)} />
                    <Badge
                      variant='outline'
                      className='rounded-full px-2.5 py-1 text-xs font-medium'
                    >
                      {batch.id}
                    </Badge>
                  </div>
                </div>

                <div className='mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                  <SummaryCard
                    title='Student Results'
                    value={String(batch.studentResults.length)}
                  />
                  <SummaryCard
                    title='Approved'
                    value={String(approvedCount)}
                    color='text-[var(--color-success)]'
                  />
                  <SummaryCard
                    title='Pending'
                    value={String(pendingCount)}
                    color='text-[var(--color-warning)]'
                  />
                  <SummaryCard
                    title='Withheld'
                    value={String(withheldCount)}
                    color='text-[var(--color-danger)]'
                  />
                </div>

                <div className='mt-6 grid gap-4 lg:grid-cols-[1.25fr_.75fr]'>
                  <article className='rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-5'>
                    <p className='text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)'>
                      Batch Details
                    </p>
                    <div className='mt-4 grid gap-3 text-sm text-(--text-secondary) sm:grid-cols-2'>
                      <p>
                        <span className='text-foreground font-medium'>
                          Uploaded by:
                        </span>{" "}
                        {batch.uploadedBy?.name ?? "System"}
                      </p>
                      <p>
                        <span className='text-foreground font-medium'>
                          Approved by:
                        </span>{" "}
                        {batch.approvedBy?.name ?? "Pending"}
                      </p>
                      <p>
                        <span className='text-foreground font-medium'>Source:</span>{" "}
                        {String(batch.source).toUpperCase()}
                      </p>
                      <p>
                        <span className='text-foreground font-medium'>
                          Uploaded at:
                        </span>{" "}
                        {formatDateTime(batch.uploadedAt)}
                      </p>
                    </div>
                  </article>

                  <article className='rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-5'>
                    <p className='text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)'>
                      Recent Dispatches
                    </p>
                    <div className='mt-4 space-y-3'>
                      {batch.dispatches.length > 0 ? (
                        batch.dispatches.map((dispatch: any) => (
                          <div
                            key={dispatch.id}
                            className='rounded-xl border border-(--border-subtle) bg-(--surface-strong) p-4 text-sm'
                          >
                            <div className='flex items-center justify-between gap-3'>
                              <div>
                                <p className='font-medium text-foreground'>
                                  {dispatch.id}
                                </p>
                                <p className='text-xs text-(--text-muted)'>
                                  Triggered by{" "}
                                  {dispatch.triggeredBy?.name ?? "System"}
                                </p>
                              </div>
                              <StatusBadge status={toBadgeStatus(dispatch.status)} />
                            </div>
                            <p className='mt-2 text-xs text-(--text-secondary)'>
                              {dispatch._count.notificationLogs} notification logs
                            </p>
                            <Link
                              href={`/admin/delivery/${dispatch.id}`}
                              className='mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline'
                            >
                              Open delivery log <ArrowRight className='h-3 w-3' />
                            </Link>
                          </div>
                        ))
                      ) : (
                        <p className='text-sm text-(--text-secondary)'>
                          No dispatches have been created for this batch yet.
                        </p>
                      )}
                    </div>
                  </article>
                </div>
              </Card>

              <section className='overflow-hidden rounded-3xl border border-(--border-subtle) bg-(--surface-strong) shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)]'>
                <div className='border-b border-(--border-subtle) px-6 py-4 sm:px-8'>
                  <h2 className='text-lg font-semibold text-foreground'>
                    Student Results
                  </h2>
                  <p className='mt-1 text-sm text-(--text-secondary)'>
                    Stored result rows for this batch, including the latest portal
                    token when available.
                  </p>
                </div>

                {batch.studentResults.length > 0 ? (
                  <div className='overflow-x-auto'>
                    <DataTable
                      data={batch.studentResults}
                      className='border-0 shadow-none -mx-px'
                      columns={columns}
                    />
                  </div>
                ) : (
                  <div className='px-6 py-10 text-sm text-(--text-secondary)'>
                    No student results are stored for this batch yet.
                  </div>
                )}
              </section>
            </main>
          </div>
        );
      }}
    </ApiGate>
  );
}


