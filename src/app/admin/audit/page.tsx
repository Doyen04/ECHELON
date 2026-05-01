"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Search } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { formatDateTime, humanizeEnum } from "@/lib/admin-format";
import { ExportButton } from "@/components/admin/export-button";

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

  useEffect(() => {
    const controller = new AbortController();

    async function loadAuditLogs() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/audit", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(
            payload?.error ??
              `Failed to load audit log (HTTP ${response.status})`,
          );
        }

        const payload = (await response.json()) as { logs?: AuditLogEntry[] };
        setLogs(Array.isArray(payload.logs) ? payload.logs : []);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load audit log.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadAuditLogs();

    return () => controller.abort();
  }, []);

  return (
    <div className='dashboard-root relative flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-background'>
      <PageHeader
        title='Audit Log'
        action={
          <ExportButton
            endpoint='/api/audit/export'
            filename={`audit-log-${new Date().toISOString().split("T")[0]}.csv`}
          />
        }
      />

      <main className='mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
        <Card className='dashboard-section flex flex-wrap items-center gap-3 p-4 shadow-sm'>
          <input
            type='date'
            className='h-10 cursor-pointer rounded-full border border-input bg-background px-3 text-sm text-foreground shadow-sm focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none'
          />
          <select
            defaultValue=''
            className='h-10 cursor-pointer rounded-full border border-input bg-background px-3 text-sm text-foreground shadow-sm focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none'
          >
            <option value='' disabled hidden>
              Action Type: All
            </option>
            <option>batch.*</option>
            <option>result.*</option>
            <option>dispatch.*</option>
            <option>user.*</option>
            <option>auth.*</option>
          </select>
          <select
            defaultValue=''
            className='h-10 cursor-pointer rounded-full border border-input bg-background px-3 text-sm text-foreground shadow-sm focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none'
          >
            <option value='' disabled hidden>
              Actor: All
            </option>
            <option>Prof. A. Okoye</option>
            <option>Registrar Adeyemi</option>
            <option>System</option>
          </select>
          <div className='relative flex-1 min-w-60'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted' />
            <Input
              type='text'
              placeholder='Search entity ID or keyword...'
              className='h-10 w-full rounded-full pl-9 pr-4'
            />
          </div>
        </Card>

        <Card
          className='overflow-x-auto rounded-xl bg-surface-main shadow-sm dashboard-section'
          style={{ animationDelay: "100ms" }}
        >
          {isLoading ? (
            <div className='flex items-center gap-3 p-6 text-sm text-text-muted'>
              <Loader2 className='h-4 w-4 animate-spin' />
              Loading audit entries...
            </div>
          ) : error ? (
            <div className='p-6'>
              <div className='flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive'>
                <AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
                <p>{error}</p>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className='p-6'>
              <EmptyState
                title='No audit entries yet'
                description='Activity records will appear here once users upload, review, or dispatch result batches.'
              />
            </div>
          ) : (
            <DataTable
              data={logs}
              pageSize={20}
              searchKey='entityId'
              searchPlaceholder='Filter entities...'
              columns={[
                {
                  header: "Timestamp",
                  cell: (row) => formatDateTime(row.createdAt),
                  className:
                    "whitespace-nowrap px-5 py-4 text-sm text-foreground",
                },
                {
                  header: "Actor",
                  cell: (row) => (
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-medium text-foreground'>
                        {row.actorName || "System"}
                      </span>
                      <span className='inline-flex rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-semibold uppercase text-text-muted'>
                        {humanizeEnum(row.action.split(".")[0] ?? "system")}
                      </span>
                    </div>
                  ),
                  className: "whitespace-nowrap px-5 py-4",
                },
                {
                  header: "Action",
                  accessorKey: "action",
                  className:
                    "whitespace-nowrap px-5 py-4 text-sm text-foreground",
                },
                {
                  header: "Entity",
                  cell: (row) => (
                    <div className='wrap-break-word whitespace-normal'>
                      {row.entityType} {row.entityId}
                    </div>
                  ),
                  className: "max-w-md px-5 py-4 text-sm text-foreground",
                },
                {
                  header: "IP Address",
                  cell: (row) => (
                    <span className='font-mono'>{row.ipAddress ?? "N/A"}</span>
                  ),
                  className:
                    "whitespace-nowrap px-5 py-4 text-sm text-text-muted",
                },
                {
                  header: "Metadata",
                  cell: (row) => (
                    <pre className='max-w-xl whitespace-pre-wrap wrap-break-word font-mono text-[11px] leading-5 text-text-muted'>
                      {JSON.stringify(row.metadata ?? {}, null, 2)}
                    </pre>
                  ),
                  className: "px-5 py-4 text-sm",
                },
              ]}
            />
          )}
        </Card>
      </main>
    </div>
  );
}
