"use client";

import Link from "next/link";
import { ChevronDown, CheckSquare, Clock, ArrowRight } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { LoadingState } from "@/components/shared/loading-state";
import { ApiGate } from "@/components/shared/api-gate";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/badges";
import { ApproveDispatchButton } from "@/components/features/admin/approve-dispatch-button";
import { BatchCard } from "@/components/features/admin/batch-card";
import {
  relativeTimeFromNow,
  semesterLabel,
  toBadgeStatus,
} from "@/lib/admin-format";

export default function ApprovalsPage() {
  const { data, isLoading, error } = useApi<any>("/api/approvals", {
    immediate: true,
  });

  return (
    <ApiGate
      data={data}
      isLoading={isLoading}
      error={error}
      loadingTitle="Loading approvals..."
      errorMessage="Failed to load approvals"
    >
      {(data) => {
        const { pendingBatches, reviewedBatches } = data;
        return (
          <div className='flex h-full w-full flex-col overflow-y-auto bg-background'>
            <PageHeader
              title='Approvals'
              breadcrumbs={
                <Breadcrumbs
                  items={[
                    { label: "Dashboard", href: "/admin/dashboard" },
                    { label: "Review Queue" },
                  ]}
                />
              }
            />

            <main className='mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
              <Card className='space-y-6 p-6 dashboard-section shadow-sm'>
                <h2 className='flex items-center gap-2 text-xl font-serif text-foreground'>
                  <Clock className='h-5 w-5 text-status-warning' /> Action Required (
                  {pendingBatches.length})
                </h2>

                <div className='grid gap-4'>
                  {pendingBatches.length > 0 ? (
                    pendingBatches.map((batch: any, index: number) => (
                      <BatchCard
                        key={batch.id}
                        batch={batch}
                        index={index}
                      />
                    ))
                  ) : (
                    <div className='rounded-xl border border-dashed border-border-subtle bg-surface-main p-6 text-sm text-text-muted'>
                      No batches are waiting for review right now.
                    </div>
                  )}
                </div>
              </Card>

              <Card
                className='pt-4 p-6 dashboard-section shadow-sm'
                style={{ animationDelay: "150ms" }}
              >
                <h2 className='mb-4 text-lg font-serif text-foreground'>
                  Historical Approvals
                </h2>
                <details className='group overflow-hidden rounded-xl border border-border-subtle bg-surface-main shadow-sm'>
                  <summary className='flex cursor-pointer list-none items-center justify-between bg-surface-subtle/20 p-5 transition-colors hover:bg-surface-subtle/40 [&::-webkit-details-marker]:hidden'>
                    <div className='flex items-center gap-2'>
                      <CheckSquare className='h-5 w-5 text-status-success' />
                      <h3 className='font-medium text-foreground'>
                        Recently Reviewed Batches{" "}
                        <span className='ml-1 text-text-muted'>
                          ({reviewedBatches.length} total)
                        </span>
                      </h3>
                    </div>
                    <ChevronDown className='h-5 w-5 text-text-muted transition-transform group-open:rotate-180' />
                  </summary>

                  <div className='overflow-x-auto border-t border-border-subtle bg-surface-main'>
                    <DataTable
                      data={reviewedBatches}
                      className='border-0 shadow-none -mx-px'
                      columns={[
                        {
                          header: "Batch ID",
                          accessorKey: "id",
                          className: "px-5 py-4 text-sm font-mono text-text-muted",
                        },
                        {
                          header: "Session & Department",
                          accessorKey: "department",
                          className: "px-5 py-4 text-sm font-medium text-foreground",
                          cell: (row: any) => `${row.department} - ${row.session}`,
                        },
                        {
                          header: "Status",
                          accessorKey: "status",
                          className: "px-5 py-4 text-right",
                          cell: (row: any) => (
                            <StatusBadge status={toBadgeStatus(row.status)} />
                          ),
                        },
                      ]}
                    />
                    <div className='border-t border-border-subtle bg-surface-subtle/5 px-5 py-4 text-center text-sm font-medium text-brand transition-colors hover:text-brand-hover hover:underline cursor-pointer'>
                      View complete review history
                    </div>
                  </div>
                </details>
              </Card>
            </main>
          </div>
        );
      }}
    </ApiGate>
  );
}
