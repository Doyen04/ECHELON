"use client";

import { StatusBadge } from "@/components/ui/badges";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { toBadgeStatus } from "@/lib/admin-format";

export type ReviewedBatchRow = {
    id: string;
    department: string;
    session: string;
    status: string;
};

export function ApprovalsClient({ reviewedRows }: { reviewedRows: ReviewedBatchRow[] }) {
    const reviewedColumns: DataTableColumn<ReviewedBatchRow>[] = [
        {
            header: "Batch ID",
            cell: (row) => <span className="font-mono text-text-muted">{row.id}</span>,
        },
        {
            header: "Session & Department",
            cell: (row) => <span className="font-medium text-foreground">{row.department} — {row.session}</span>,
        },
        {
            header: "Status",
            cell: (row) => <StatusBadge status={toBadgeStatus(row.status)} />,
            align: "right",
        },
    ];

    return (
        <DataTable
            columns={reviewedColumns}
            data={reviewedRows}
            rowKey={(row) => row.id}
            emptyMessage="No reviewed batches yet."
            className="border-0 rounded-none shadow-none"
            pageSize={10}
        />
    );
}
