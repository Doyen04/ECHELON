"use client";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatDateTime } from "@/lib/admin-format";

export type AuditLogRow = {
    id: string;
    createdAt: Date;
    actorName: string;
    actionDomain: string;
    action: string;
    entityType: string;
    entityId: string;
    ipAddress: string | null;
    metadata: Record<string, unknown>;
};

export function AuditClient({ rows }: { rows: AuditLogRow[] }) {
    const columns: DataTableColumn<AuditLogRow>[] = [
        {
            header: "Timestamp",
            cell: (row) => <span className="whitespace-nowrap text-foreground">{formatDateTime(row.createdAt)}</span>,
        },
        {
            header: "Actor",
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{row.actorName}</span>
                    <span className="inline-flex rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-semibold uppercase text-text-muted">
                        {row.actionDomain}
                    </span>
                </div>
            ),
        },
        {
            header: "Action",
            cell: (row) => <span className="text-foreground">{row.action}</span>,
            hideOnMobile: true,
        },
        {
            header: "Entity",
            cell: (row) => (
                <div className="max-w-[28rem] break-words whitespace-normal text-foreground">
                    {row.entityType} {row.entityId}
                </div>
            ),
            hideOnMobile: true,
        },
        {
            header: "IP Address",
            cell: (row) => <span className="font-mono text-text-muted">{row.ipAddress ?? "N/A"}</span>,
            hideOnMobile: true,
        },
        {
            header: "Metadata",
            cell: (row) => (
                <pre className="max-w-xl whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-text-muted">
                    {JSON.stringify(row.metadata, null, 2)}
                </pre>
            ),
            hideOnMobile: true,
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={rows}
            rowKey={(row) => row.id}
            emptyMessage="No audit entries yet."
            className="dashboard-section shadow-sm"
            animateDelay={20}
            pageSize={15}
        />
    );
}
