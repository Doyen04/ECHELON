"use client";

import Link from "next/link";
import { ChevronDown, CheckSquare, Clock, ArrowRight } from "lucide-react";
import { useState } from "react";
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
    const [reviewedPage, setReviewedPage] = useState(1);
    const reviewedLimit = 10;

    const { data, isLoading, error } = useApi<any>(`/api/approvals?reviewedPage=${reviewedPage}&reviewedLimit=${reviewedLimit}`, {
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
                const { pendingBatches, reviewedBatches, reviewedPagination } = data;
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
                            <div className='grid gap-4'>
                                <h2 className='flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-widest text-muted-foreground'>
                                    <Clock className='h-4 w-4 text-warning' /> Action Required ({pendingBatches.length})
                                </h2>
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

                            <Card
                                className='p-0 overflow-hidden'
                            >
                                <details className='group'>
                                    <summary className='flex cursor-pointer list-none items-center justify-between bg-muted/30 p-5 transition-colors hover:bg-muted/50 [&::-webkit-details-marker]:hidden'>
                                        <div className='flex items-center gap-2'>
                                            <CheckSquare className='h-5 w-5 text-success' />
                                            <h3 className='font-semibold text-foreground'>
                                                Recently Reviewed{" "}
                                                <span className='ml-1 text-muted-foreground font-medium'>
                                                    ({reviewedBatches.length} total)
                                                </span>
                                            </h3>
                                        </div>
                                        <ChevronDown className='h-5 w-5 text-muted-foreground transition-transform group-open:rotate-180' />
                                    </summary>

                                    <div className='overflow-x-auto border-t border-border bg-card'>
                                        <DataTable
                                            data={reviewedBatches}
                                            className='border-0 shadow-none -mx-px'
                                            manualPagination
                                            currentPage={reviewedPagination?.currentPage ?? reviewedPage}
                                            totalPages={reviewedPagination?.pages ?? 1}
                                            totalCount={reviewedPagination?.total ?? reviewedBatches.length}
                                            onPageChange={setReviewedPage}
                                            isLoading={isLoading}
                                            columns={[
                                                {
                                                    header: "Batch ID",
                                                    accessorKey: "id",
                                                    className: "px-6 py-4 font-mono text-xs text-muted-foreground",
                                                },
                                                {
                                                    header: "Session & Department",
                                                    accessorKey: "department",
                                                    className: "px-6 py-4 font-semibold text-foreground",
                                                    cell: (row: any) => `${row.department} - ${row.session}`,
                                                },
                                                {
                                                    header: "Status",
                                                    accessorKey: "status",
                                                    className: "px-6 py-4 text-right",
                                                    cell: (row: any) => (
                                                        <StatusBadge status={toBadgeStatus(row.status)} />
                                                    ),
                                                },
                                            ]}
                                        />
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
