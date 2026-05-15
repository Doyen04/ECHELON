"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { use, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { LoadingState } from "@/components/shared/loading-state";

import { ExportButton } from "@/components/features/admin/export-button";
import { RetryFailedSendsButton } from "@/components/features/admin/retry-failed-sends-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge, ChannelBadge } from "@/components/shared/badges";
import { SummaryCard } from "@/components/shared/summary-card";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { toast } from "sonner";
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
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    const { data, isLoading, error } = useApi<any>(
        `/api/delivery/${dispatchId}?page=${currentPage}&limit=${pageSize}`,
        { immediate: true },
    );

    if (isLoading && !data) {
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

    const { dispatch, notificationLogs, students, guardians, pagination } = data;

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
        <div className='flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-background'>
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
                    <div className="flex items-center gap-3">
                        <RetryFailedSendsButton
                            dispatchId={dispatch.id}
                            failedCount={dispatch.failedCount ?? failed}
                        />
                        <ExportButton
                            endpoint={`/api/delivery/${dispatch.id}/export`}
                            filename={`delivery-${dispatch.id}.csv`}
                        />
                    </div>
                }
            />

            <main className='mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
                <div className="grid gap-6">
                    <div className='rounded-xl border-border'>
                        <div className='flex flex-col gap-6 md:flex-row md:items-start md:justify-between'>
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h1 className='text-2xl font-bold tracking-tight text-foreground'>
                                        {dispatch.batch.department}
                                    </h1>
                                    <StatusBadge
                                        status={String(dispatch.status).toLowerCase() as any}
                                    />
                                </div>
                                <p className='text-sm text-muted-foreground'>
                                    {dispatch.batch.session} • {dispatch.batch.semester} Semester •
                                    Triggered by <span className="font-medium text-foreground">{dispatch.triggeredBy?.name ?? "System"}</span>
                                </p>
                            </div>

                            <Badge variant='secondary' className='rounded-md px-2 py-0.5 font-mono text-[10px] text-muted-foreground'>
                                ID: {dispatch.id}
                            </Badge>
                        </div>

                        <div className='mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                            <SummaryCard title='Total Logs' value={total} />
                            <SummaryCard
                                title='Sent'
                                value={sent}
                                subvalue={`${successRate}% Success`}
                                color='text-emerald-600'
                            />
                            <SummaryCard
                                title='Failed'
                                value={failed}
                                color='text-destructive'
                            />
                            <SummaryCard title='Queued' value={queued} />
                        </div>

                        <div className='mt-8 rounded-xl border border-border bg-muted/30 p-6'>
                            <div className='flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground'>
                                <span>Dispatch Progress</span>
                                <span className="text-foreground">
                                    {processed} / {total} Processed
                                </span>
                            </div>
                            <div className='mt-4 h-2 w-full overflow-hidden rounded-full bg-muted'>
                                <div
                                    className='h-full bg-sidebar-primary transition-all duration-500'
                                    style={{ width: `${total === 0 ? 0 : (processed / total) * 100}%` }}
                                />
                            </div>
                            <div className='mt-4 flex flex-wrap gap-6 text-[11px] font-bold uppercase tracking-tight text-muted-foreground'>
                                <span className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Sent: {sent}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                                    Failed: {failed}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                                    Queued: {queued}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Card className='overflow-hidden rounded-xl border-border'>
                        <div className='border-b border-border bg-muted/20 px-6 py-4'>
                            <h2 className='text-sm font-bold text-foreground uppercase tracking-widest'>
                                Notification Logs
                            </h2>
                            <p className='mt-1 text-xs text-muted-foreground'>
                                Detailed history of every guardian notification attempt for this dispatch job.
                            </p>
                        </div>

                        <div>
                            <DataTable
                                data={notificationLogs}
                                className='border-0 shadow-none'
                                manualPagination
                                currentPage={pagination?.currentPage ?? currentPage}
                                totalPages={pagination?.pages ?? 1}
                                totalCount={pagination?.total ?? notificationLogs.length}
                                onPageChange={setCurrentPage}
                                isLoading={isLoading}
                                columns={[
                                    {
                                        header: "Student",
                                        accessorKey: "student",
                                        className: "px-6 py-4",
                                        cell: (row: any) => {
                                            const student = studentById.get(row.studentId) as
                                                | { fullName?: string; matricNumber?: string }
                                                | undefined;
                                            return (
                                                <div className="space-y-0.5">
                                                    <div className='text-sm font-bold text-foreground'>
                                                        {student?.fullName ?? "Unknown student"}
                                                    </div>
                                                    <div className='text-[10px] font-mono text-muted-foreground'>
                                                        {student?.matricNumber ?? row.studentId}
                                                    </div>
                                                </div>
                                            );
                                        },
                                    },
                                    {
                                        header: "Guardian",
                                        accessorKey: "guardian",
                                        className: "px-6 py-4 text-sm font-medium",
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
                                        className: "px-6 py-4 text-xs font-medium text-muted-foreground",
                                        cell: (row: any) => <>{formatDateTime(row.attemptedAt)}</>,
                                    },
                                    {
                                        header: "Logs & Details",
                                        accessorKey: "details",
                                        className: "px-6 py-4 text-[11px] font-medium text-muted-foreground",
                                        cell: (row: any) => (
                                            <div className="max-w-50 truncate" title={row.failureReason ?? row.providerMessageId ?? "Delivered"}>
                                                {row.failureReason ??
                                                    row.providerMessageId ??
                                                    "Delivered successfully"}
                                            </div>
                                        ),
                                    },
                                    {
                                        header: "Actions",
                                        accessorKey: "actions",
                                        className: "px-6 py-4 text-right",
                                        cell: (row: any) => {
                                            if (row.status !== "FAILED") return null;
                                            return (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 rounded-md text-[10px] font-bold uppercase tracking-tight hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                                                    onClick={async () => {
                                                        try {
                                                            const response = await fetch(`/api/delivery/${dispatchId}/retry`, {
                                                                method: "POST",
                                                                body: JSON.stringify({ logId: row.id }),
                                                            });
                                                            const body = await response.json().catch(() => null);

                                                            if (response.ok) {
                                                                if (body?.retriedCount === 0) {
                                                                    toast.error("Retry Failed", { description: "Message could not be delivered. Check provider settings." });
                                                                    setTimeout(() => window.location.reload(), 1500);
                                                                } else {
                                                                    toast.success("Retry Successful", { description: "The message was successfully resent." });
                                                                    setTimeout(() => window.location.reload(), 1000);
                                                                }
                                                            } else {
                                                                toast.error("Retry Failed", { description: body?.error ?? "Unable to retry message." });
                                                            }
                                                        } catch (err) {
                                                            toast.error("Network Error", { description: "Failed to connect to the server." });
                                                            console.error("Retry failed", err);
                                                        }
                                                    }}
                                                >
                                                    Retry
                                                </Button>
                                            );
                                        },
                                    },
                                ]}
                            />
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}


