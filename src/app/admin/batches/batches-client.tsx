"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/badges";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ExportButton } from "@/components/features/admin/export-button";
import { relativeTimeFromNow, semesterLabel, toBadgeStatus } from "@/lib/admin-format";

export type BatchRow = {
    id: string;
    session: string;
    semester: string;
    department: string;
    source: string;
    status: string;
    uploadedAt: Date;
    uploaderName: string;
    studentCount: number;
};

export function BatchesClient({ batches }: { batches: BatchRow[] }) {
    const columns: DataTableColumn<BatchRow>[] = [
        {
            header: "Batch ID",
            cell: (row) => (
                <div className="max-w-24 truncate font-mono text-[10px] text-text-muted" title={row.id}>
                    {row.id}
                </div>
            ),
            width: "w-28",
            hideOnMobile: true,
        },
        {
            header: "Session",
            accessorKey: "session",
            width: "w-24",
        },
        {
            header: "Semester",
            cell: (row) => semesterLabel(row.semester as any),
            width: "w-24",
            hideOnMobile: true,
        },
        {
            header: "Department",
            accessorKey: "department",
            className: "font-medium text-foreground",
            width: "w-36",
        },
        {
            header: "Students",
            cell: (row) => <span>{row.studentCount}</span>,
            width: "w-20",
        },
        {
            header: "Source",
            cell: (row) => (
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
                    {row.source}
                </Badge>
            ),
            width: "w-20",
            hideOnMobile: true,
        },
        {
            header: "Status",
            cell: (row) => <StatusBadge status={toBadgeStatus(row.status)} />,
            width: "w-24",
        },
        {
            header: "Uploaded",
            cell: (row) => (
                <div className="min-w-0 flex flex-col">
                    <span className="truncate text-sm text-foreground">{row.uploaderName}</span>
                    <span className="text-xs text-text-muted">{relativeTimeFromNow(row.uploadedAt)}</span>
                </div>
            ),
            width: "w-36",
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={batches}
            rowKey={(row) => row.id}
            emptyMessage="No result batches found."
            maxHeight="calc(100vh - 18rem)"
            className="dashboard-section shadow-sm"
            headerAction={
                <ExportButton
                    endpoint="/api/batches/export"
                    filename={`batches-${new Date().toISOString().split('T')[0]}.csv`}
                    size="xs"
                />
            }
            rowAction={(row) => (
                <Link
                    href={`/admin/batches/${row.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand opacity-0 transition-opacity hover:text-brand-hover hover:underline group-hover:opacity-100"
                >
                    View <ChevronRight className="h-4 w-4" />
                </Link>
            )}
            pageSize={10}
        />
    );
}
