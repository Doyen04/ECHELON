"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Search } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/data-table";
import { formatDateTime, humanizeEnum } from "@/lib/admin-format";
import { ExportButton } from "@/components/features/admin/export-button";
import { Sheet } from "@/components/ui/sheet";

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
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    // ... (fetch logic remains same)
  }, []);

  return (
    <div className='dashboard-root relative flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-background'>
      <PageHeader
        title='Activity Audit'
        action={
          <ExportButton
            endpoint='/api/audit/export'
            filename={`audit-log-${new Date().toISOString().split("T")[0]}.csv`}
          />
        }
      />

      <main className='mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
        <div className='flex flex-wrap items-center gap-3 px-1'>
            <div className='relative flex-1 min-w-60'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                type='text'
                placeholder='Search records, actors or IDs...'
                className='h-10 w-full pl-9 pr-4 bg-card'
                />
            </div>
            <select
                defaultValue=''
                className='h-10 cursor-pointer rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-xs focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none transition-all'
            >
                <option value='' disabled hidden>Category: All</option>
                <option>Batches</option>
                <option>Results</option>
                <option>Users</option>
            </select>
        </div>

        <Card
          className='overflow-hidden shadow-sm dashboard-section border-border'
        >
          {isLoading ? (
            <div className='flex items-center gap-3 p-12 text-sm text-muted-foreground justify-center'>
              <Loader2 className='h-4 w-4 animate-spin' />
              Loading activity history...
            </div>
          ) : error ? (
            <div className='p-6 text-center'>
              <div className='inline-flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive'>
                <AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
                <p>{error}</p>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className='p-6'>
              <EmptyState
                title='No activity recorded'
                description='Activity records will appear here once users upload, review, or dispatch result batches.'
              />
            </div>
          ) : (
            <DataTable
              data={logs}
              pageSize={20}
              onRowClick={(entry) => setSelectedEntry(entry)}
              columns={[
                {
                  header: "Time",
                  cell: (row) => (
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{formatDateTime(row.createdAt).split(',')[0]}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(row.createdAt).split(',')[1]}</span>
                    </div>
                  ),
                  className: "px-6 py-4",
                },
                {
                  header: "Actor",
                  cell: (row) => (
                    <div className='flex items-center gap-3'>
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                        {row.actorName?.slice(0, 2).toUpperCase() || "SY"}
                      </div>
                      <div className="flex flex-col">
                        <span className='text-sm font-bold text-foreground'>
                            {row.actorName || "System"}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                            {row.ipAddress ?? "Internal"}
                        </span>
                      </div>
                    </div>
                  ),
                  className: "px-6 py-4",
                },
                {
                  header: "Event",
                  cell: (row) => (
                    <div className="flex items-center gap-2">
                        <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-foreground">
                            {row.action.split(".")[0]}
                        </span>
                        <span className="text-sm font-medium">{humanizeEnum(row.action.split(".")[1] || row.action)}</span>
                    </div>
                  ),
                  className: "px-6 py-4",
                },
                {
                  header: "Reference",
                  cell: (row) => (
                    <div className='flex flex-col'>
                      <span className="text-xs font-mono text-muted-foreground">{row.entityId}</span>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground/60">{row.entityType}</span>
                    </div>
                  ),
                  className: "px-6 py-4",
                },
              ]}
            />
          )}
        </Card>
      </main>

      <Sheet
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title="Activity Details"
        description="Full event metadata and context"
      >
        {selectedEntry && (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Action</p>
                        <p className="text-sm font-semibold">{selectedEntry.action}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Actor</p>
                        <p className="text-sm font-semibold">{selectedEntry.actorName || "System"}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Contextual Data</p>
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                        <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground leading-relaxed">
                            {JSON.stringify(selectedEntry.metadata ?? {}, null, 2)}
                        </pre>
                    </div>
                </div>

                <div className="pt-4 space-y-2">
                     <p className="text-[10px] font-bold uppercase text-muted-foreground">System Context</p>
                     <div className="text-xs space-y-1">
                        <p><span className="text-muted-foreground">Entry ID:</span> {selectedEntry.id}</p>
                        <p><span className="text-muted-foreground">IP Address:</span> {selectedEntry.ipAddress || "N/A"}</p>
                        <p><span className="text-muted-foreground">Recorded At:</span> {formatDateTime(selectedEntry.createdAt)}</p>
                     </div>
                </div>
            </div>
        )}
      </Sheet>
    </div>
  );
}
