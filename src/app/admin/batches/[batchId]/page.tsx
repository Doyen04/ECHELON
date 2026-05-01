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
                    { label: "Result Batches", href: "/admin/batches" },
                    { label: batch.id },
                  ]}
                />
              }
              action={
                <div className='flex items-center gap-2'>
                  {(batch.status === "PENDING" || batch.status === "IN_REVIEW") && (
                    <ApproveDispatchButton batchId={batch.id} />
                  )}
                  <ExportButton
                    endpoint={`/api/batches/${batch.id}/export`}
                    filename={`batch-detail-${batch.id}.csv`}
                  />
                </div>
              }
            />
 
            <main className='mx-auto w-full max-w-7xl space-y-8 px-6 py-8 pb-24'>
              <div className='flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between'>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className='text-3xl font-bold tracking-tight text-foreground'>
                        {batch.department}
                        </h1>
                        <StatusBadge status={toBadgeStatus(batch.status)} />
                    </div>
                    <p className='text-sm text-muted-foreground'>
                        {batch.session} • {semesterLabel(batch.semester)} Semester •
                        Uploaded {relativeTimeFromNow(batch.uploadedAt)}
                    </p>
                </div>
                <div className='flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 border border-border'>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Batch ID:</span>
                    <code className="text-xs font-mono font-bold text-foreground">{batch.id}</code>
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                  <SummaryCard
                    title='Total Students'
                    value={batch.studentResults.length}
                    className="bg-card border-border shadow-xs"
                  />
                  <SummaryCard
                    title='Approved'
                    value={approvedCount}
                    className="bg-emerald-50/50 border-emerald-100 shadow-xs"
                    color='text-emerald-600'
                  />
                  <SummaryCard
                    title='Pending'
                    value={pendingCount}
                    className="bg-amber-50/50 border-amber-100 shadow-xs"
                    color='text-amber-600'
                  />
                  <SummaryCard
                    title='Withheld'
                    value={withheldCount}
                    className="bg-rose-50/50 border-rose-100 shadow-xs"
                    color='text-rose-600'
                  />
              </div>

              <div className='grid gap-8 lg:grid-cols-[1fr_350px]'>
                <section className='space-y-4'>
                    <div className="flex items-center justify-between px-1">
                        <h2 className='text-sm font-bold uppercase tracking-widest text-muted-foreground'>
                            Student Records
                        </h2>
                    </div>
                    <Card className='overflow-hidden border-border shadow-sm'>
                        {batch.studentResults.length > 0 ? (
                        <div className='overflow-x-auto'>
                            <DataTable
                            hideCount={true}
                            data={batch.studentResults}
                            className='border-0 shadow-none -mx-px'
                            columns={columns}
                            />
                        </div>
                        ) : (
                        <div className='px-6 py-12 text-center text-sm text-muted-foreground'>
                            No student results are stored for this batch yet.
                        </div>
                        )}
                    </Card>
                </section>

                <aside className="space-y-8">
                    <section className="space-y-4">
                        <h2 className='text-xs font-bold uppercase tracking-widest text-muted-foreground px-1'>
                            Batch Metadata
                        </h2>
                        <div className='rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm'>
                            <div className='grid gap-4 text-sm'>
                                <div className="flex justify-between items-center">
                                    <span className='text-muted-foreground'>Uploaded by:</span>
                                    <span className="font-semibold text-foreground">{batch.uploadedBy?.name ?? "System"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className='text-muted-foreground'>Source:</span>
                                    <Badge variant="outline" className="font-bold">{String(batch.source).toUpperCase()}</Badge>
                                </div>
                                <div className="flex justify-between items-center border-t border-border/50 pt-4">
                                    <span className='text-muted-foreground'>Time:</span>
                                    <span className="text-xs font-medium">{formatDateTime(batch.uploadedAt)}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className='text-xs font-bold uppercase tracking-widest text-muted-foreground px-1'>
                            Activity History
                        </h2>
                        <div className='space-y-3'>
                        {batch.dispatches.length > 0 ? (
                            batch.dispatches.map((dispatch: any) => (
                            <div
                                key={dispatch.id}
                                className='rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md'
                            >
                                <div className='flex items-center justify-between gap-3'>
                                    <div className="space-y-0.5">
                                        <p className='text-xs font-bold font-mono text-foreground'>
                                            {dispatch.id}
                                        </p>
                                        <p className='text-[10px] text-muted-foreground'>
                                            via {dispatch.triggeredBy?.name ?? "System"}
                                        </p>
                                    </div>
                                    <StatusBadge status={toBadgeStatus(dispatch.status)} />
                                </div>
                                <Link
                                    href={`/admin/delivery/${dispatch.id}`}
                                    className='mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/30 py-1.5 text-[10px] font-bold uppercase tracking-tight text-foreground transition-all hover:bg-muted'
                                >
                                    Review Logs <ArrowRight className='h-3 w-3' />
                                </Link>
                            </div>
                            ))
                        ) : (
                            <div className="rounded-xl border border-dashed border-border p-6 text-center">
                                <p className='text-xs text-muted-foreground'>
                                    No dispatches recorded yet.
                                </p>
                            </div>
                        )}
                        </div>
                    </section>
                </aside>
              </div>
            </main>
          </div>
        );
      }}
    </ApiGate>
  );
}


