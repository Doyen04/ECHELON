"use client";

import { StatusBadge, ChannelBadge } from "@/components/ui/badges";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

function formatDateTime(value: Date | string | null | undefined) {
    if (!value) return "N/A";
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export type NotificationLogRow = {
    id: string;
    studentName: string;
    matricNumber: string;
    guardianName: string;
    channel: string;
    status: string;
    attemptedAt: Date | string | null;
    detail: string;
};

export function DeliveryLogClient({ logRows }: { logRows: NotificationLogRow[] }) {
    const logColumns: DataTableColumn<NotificationLogRow>[] = [
        {
            header: "Student",
            cell: (row) => (
                <div>
                    <div className="font-medium text-foreground">{row.studentName}</div>
                    <div className="mt-0.5 text-xs text-text-muted">{row.matricNumber}</div>
                </div>
            ),
        },
        {
            header: "Guardian",
            cell: (row) => <span className="text-foreground">{row.guardianName}</span>,
        },
        {
            header: "Channel",
            cell: (row) => <ChannelBadge channel={row.channel as any} />,
            hideOnMobile: true,
        },
        {
            header: "Status",
            cell: (row) => <StatusBadge status={row.status as any} />,
        },
        {
            header: "Attempted At",
            cell: (row) => <span className="text-muted-foreground">{formatDateTime(row.attemptedAt)}</span>,
            hideOnMobile: true,
        },
        {
            header: "Details",
            cell: (row) => <span className="text-muted-foreground">{row.detail}</span>,
            hideOnMobile: true,
        },
    ];

    return (
        <DataTable
            columns={logColumns}
            data={logRows}
            rowKey={(row) => row.id}
            emptyMessage="No notification logs are available for this dispatch yet."
            className="shadow-sm"
            pageSize={10}
        />
    );
}
