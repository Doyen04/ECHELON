"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/data-table";
import { formatDateTime, humanizeEnum } from "@/lib/admin-format";
import { ExportButton } from "@/components/features/admin/export-button";
import { Sheet } from "@/components/ui/sheet";
import { useApi } from "@/hooks/use-api";
import { ApiGate } from "@/components/shared/api-gate";
import { Badge } from "@/components/ui/badge";

type AuditLogEntry = {
    id: string;
    createdAt: string;
    actorName: string;
    action: string;
    entityType: string;
    entityId: string;
    ipAddress: string | null;
    metadata: Record<string, unknown> | null;
};

export default function AuditLogPage() {
    const [query, setQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;
    const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
    });
    if (query.trim()) {
        params.set("q", query.trim());
    }

    const { data, isLoading, error } = useApi<{ logs: AuditLogEntry[]; pagination: any }>(
        `/api/audit?${params.toString()}`,
        { immediate: true },
    );

    const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(
        null,
    );

    const logs = data?.logs ?? [];
    const pagination = data?.pagination ?? { currentPage: 1, pages: 1, total: 0 };

    return (
        <div className='flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-background'>
            <PageHeader
                title='Activity Audit'
                action={
                    <ExportButton
                        endpoint='/api/audit/export'
                        filename={`audit-log-${new Date().toISOString().split("T")[0]}.csv`}
                    />
                }
            />

            <ApiGate
                data={data}
                isLoading={isLoading}
                error={error}
                loadingTitle='Loading audit history...'
                errorMessage='Failed to load activity logs'
            >
                {() => (
                    <main className='mx-auto w-full max-w-7xl min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
                        <div className='flex flex-col gap-6'>
                            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                                <div className='relative w-full max-w-xl'>
                                    <Search className='absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                                    <Input
                                        type='search'
                                        value={query}
                                        onChange={(e) => {
                                            setQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        placeholder='Search by actor, event, or reference ID...'
                                        className='h-11 w-full pl-10 pr-4 rounded-xl border-border bg-card'
                                    />
                                </div>

                                <div className='flex items-center gap-4'>
                                    <div className='hidden text-[10px] font-bold uppercase tracking-widest text-muted-foreground lg:block'>
                                        <span className='text-foreground'>
                                            {pagination.total}
                                        </span>{" "}
                                        Entries
                                    </div>
                                </div>
                            </div>

                            {/* Desktop View */}
                            <Card className='hidden md:block overflow-hidden rounded-xl border-border shadow-none'>
                                <DataTable
                                    className='border-0 shadow-none'
                                    data={logs}
                                    manualPagination
                                    currentPage={pagination.currentPage}
                                    totalPages={pagination.pages}
                                    totalCount={pagination.total}
                                    onPageChange={setCurrentPage}
                                    onRowClick={(entry: AuditLogEntry) => setSelectedEntry(entry)}
                                    columns={[
                                        {
                                            header: "Time",
                                            className: "px-6 py-4",
                                            cell: (row: AuditLogEntry) => (
                                                <div className='flex flex-col'>
                                                    <span className='text-sm font-bold text-foreground leading-none'>
                                                        {formatDateTime(row.createdAt).split(",")[0]}
                                                    </span>
                                                    <span className='mt-1 text-[10px] font-medium text-muted-foreground uppercase tracking-tight'>
                                                        {formatDateTime(row.createdAt).split(",")[1]}
                                                    </span>
                                                </div>
                                            ),
                                        },
                                        {
                                            header: "Actor",
                                            className: "px-6 py-4",
                                            cell: (row: AuditLogEntry) => (
                                                <div className='flex items-center gap-3'>
                                                    <div className='flex flex-col'>
                                                        <span className='text-sm font-bold text-foreground leading-none'>
                                                            {row.actorName || "System"}
                                                        </span>
                                                        <span className='mt-1 text-[10px] text-muted-foreground font-mono tracking-tighter'>
                                                            {row.ipAddress ?? "Internal"}
                                                        </span>
                                                    </div>
                                                </div>
                                            ),
                                        },
                                        {
                                            header: "Event",
                                            className: "px-6 py-4",
                                            cell: (row: AuditLogEntry) => {
                                                const [category, event] = row.action.split(".");
                                                return (
                                                    <div className='flex items-center gap-2'>
                                                        <span className='text-sm font-medium text-foreground'>
                                                            {humanizeEnum(category + " " + event || " ")}
                                                        </span>
                                                    </div>
                                                );
                                            },
                                        },
                                        {
                                            header: "Reference",
                                            className: "px-6 py-4",
                                            cell: (row: AuditLogEntry) => (
                                                <div className='flex flex-col'>
                                                    <span className='text-[10px] font-mono text-muted-foreground truncate max-w-30'>
                                                        {row.entityId}
                                                    </span>
                                                    <span className='text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60'>
                                                        {row.entityType}
                                                    </span>
                                                </div>
                                            ),
                                        },
                                    ]}
                                />
                            </Card>

                            {/* Mobile View */}
                            <div className='grid gap-4 md:hidden'>
                                {logs.map((log) => (
                                    <div
                                        key={log.id}
                                        onClick={() => setSelectedEntry(log)}
                                        className='rounded-xl border border-border bg-card p-5 space-y-4'
                                    >
                                        <div className='flex items-start justify-between'>
                                            <div className='flex items-center gap-3'>
                                                <div className='h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold border border-border'>
                                                    {log.actorName?.slice(0, 2).toUpperCase() || "SY"}
                                                </div>
                                                <div className='flex flex-col'>
                                                    <span className='text-sm font-bold text-foreground'>
                                                        {log.actorName || "System"}
                                                    </span>
                                                    <span className='text-[10px] text-muted-foreground font-mono'>
                                                        {log.ipAddress ?? "Internal"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className='text-right'>
                                                <div className='text-[10px] font-bold text-foreground'>
                                                    {formatDateTime(log.createdAt).split(",")[0]}
                                                </div>
                                                <div className='text-[9px] font-medium text-muted-foreground uppercase'>
                                                    {formatDateTime(log.createdAt).split(",")[1]}
                                                </div>
                                            </div>
                                        </div>

                                        <div className='flex items-center gap-2 pt-3 border-t border-border/50'>
                                            <Badge
                                                variant='outline'
                                                className='h-5 rounded-md px-1.5 text-[9px] font-bold uppercase tracking-widest bg-muted/50'
                                            >
                                                {log.action.split(".")[0]}
                                            </Badge>
                                            <span className='text-sm font-medium'>
                                                {humanizeEnum(log.action.split(".")[1] || log.action)}
                                            </span>
                                        </div>

                                        <div className='flex flex-col pt-3 border-t border-border/50'>
                                            <span className='text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60'>
                                                {log.entityType}
                                            </span>
                                            <span className='text-[10px] font-mono text-muted-foreground truncate'>
                                                {log.entityId}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {logs.length === 0 && (
                                <div className='flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border border-dashed'>
                                    <Search className='h-8 w-8 text-muted-foreground/30' />
                                    <p className='mt-2 text-sm font-medium text-muted-foreground'>
                                        No activity records found matching your search.
                                    </p>
                                </div>
                            )}
                        </div>
                    </main>
                )}
            </ApiGate>

            <Sheet
                isOpen={!!selectedEntry}
                onClose={() => setSelectedEntry(null)}
                title='Activity Detail'
                description='Full event metadata and context'
            >
                {selectedEntry && (
                    <div className='space-y-8'>
                        <div className='grid grid-cols-2 gap-6'>
                            <div className='space-y-1.5'>
                                <p className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                                    Action Event
                                </p>
                                <div className='flex items-center gap-2'>
                                    <Badge
                                        variant='outline'
                                        className='rounded-md bg-muted/50 px-1.5 text-[9px] font-bold uppercase'
                                    >
                                        {selectedEntry.action.split(".")[0]}
                                    </Badge>
                                    <p className='text-sm font-bold'>
                                        {humanizeEnum(
                                            selectedEntry.action.split(".")[1] ||
                                            selectedEntry.action,
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className='space-y-1.5'>
                                <p className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                                    Recorded By
                                </p>
                                <p className='text-sm font-bold'>
                                    {selectedEntry.actorName || "System"}
                                </p>
                            </div>
                        </div>

                        <div className='space-y-3'>
                            <p className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                                Contextual Metadata
                            </p>
                            <div className='rounded-xl border border-border bg-muted/10 p-5 overflow-hidden'>
                                <pre className='whitespace-pre-wrap font-mono text-[11px] text-muted-foreground leading-relaxed overflow-x-auto max-h-75'>
                                    {JSON.stringify(selectedEntry.metadata ?? {}, null, 2)}
                                </pre>
                            </div>
                        </div>

                        <div className='pt-6 border-t border-border space-y-4'>
                            <p className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                                System Context
                            </p>
                            <div className='grid gap-3'>
                                <div className='flex justify-between text-xs'>
                                    <span className='text-muted-foreground'>Log Entry ID</span>
                                    <span className='font-mono font-medium'>
                                        {selectedEntry.id}
                                    </span>
                                </div>
                                <div className='flex justify-between text-xs'>
                                    <span className='text-muted-foreground'>IP Address</span>
                                    <span className='font-mono font-medium'>
                                        {selectedEntry.ipAddress || "Internal"}
                                    </span>
                                </div>
                                <div className='flex justify-between text-xs'>
                                    <span className='text-muted-foreground'>Full Timestamp</span>
                                    <span className='font-medium'>
                                        {formatDateTime(selectedEntry.createdAt)}
                                    </span>
                                </div>
                                <div className='flex justify-between text-xs'>
                                    <span className='text-muted-foreground'>
                                        Entity Reference
                                    </span>
                                    <span className='font-mono font-medium text-right max-w-45 truncate'>
                                        {selectedEntry.entityId} ({selectedEntry.entityType})
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Sheet>
        </div>
    );
}
