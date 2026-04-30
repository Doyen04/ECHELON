import type { Metadata } from "next";
import { Search } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import type { DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/dashboard";
import { ExportButton } from "@/components/admin/export-button";
import { prisma } from "@/lib/db";
import { formatDateTime, humanizeEnum } from "@/lib/admin-format";

export const metadata: Metadata = {
    title: "Audit Log",
    description: "Immutable action history for the institution.",
};

type AuditLogRow = {
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

export default async function AuditLogPage() {
    const db = prisma as any;

    const logs = await db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
            actor: { select: { name: true } },
        },
    });

    const rows: AuditLogRow[] = logs.map((log: any) => ({
        id: log.id,
        createdAt: log.createdAt,
        actorName: log.actor?.name ?? "System",
        actionDomain: humanizeEnum(log.action.split(".")[0] ?? "system"),
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        ipAddress: log.ipAddress ?? null,
        metadata: log.metadata ?? {},
    }));

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
        <div className="dashboard-root relative flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-background">
            <PageHeader
                title="Audit Log"
                action={
                    <ExportButton
                        endpoint="/api/audit/export"
                        filename={`audit-log-${new Date().toISOString().split('T')[0]}.csv`}
                    />
                }
            />

            <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <Card className="dashboard-section flex flex-wrap items-center gap-3 p-4 shadow-sm">
                    <input
                        type="date"
                        className="h-10 cursor-pointer rounded-full border border-input bg-background px-3 text-sm text-foreground shadow-sm focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none"
                    />
                    <select defaultValue="" className="h-10 cursor-pointer rounded-full border border-input bg-background px-3 text-sm text-foreground shadow-sm focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none">
                        <option value="" disabled hidden>Action Type: All</option>
                        <option>batch.*</option>
                        <option>result.*</option>
                        <option>dispatch.*</option>
                        <option>user.*</option>
                        <option>auth.*</option>
                    </select>
                    <select defaultValue="" className="h-10 cursor-pointer rounded-full border border-input bg-background px-3 text-sm text-foreground shadow-sm focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none">
                        <option value="" disabled hidden>Actor: All</option>
                        <option>Prof. A. Okoye</option>
                        <option>Registrar Adeyemi</option>
                        <option>System</option>
                    </select>
                    <div className="relative flex-1 min-w-60">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                        <Input
                            type="text"
                            placeholder="Search entity ID or keyword..."
                            className="h-10 w-full rounded-full pl-9 pr-4"
                        />
                    </div>
                </Card>

                {rows.length === 0 ? (
                    <Card className="p-6 shadow-sm dashboard-section" style={{ animationDelay: "100ms" }}>
                        <EmptyState
                            title="No audit entries yet"
                            description="Activity records will appear here once users upload, review, or dispatch result batches."
                        />
                    </Card>
                ) : (
                    <DataTable
                        columns={columns}
                        data={rows}
                        rowKey={(row) => row.id}
                        emptyMessage="No audit entries yet."
                        className="dashboard-section shadow-sm"
                        animateDelay={20}
                    />
                )}
            </main>
        </div>
    );
}