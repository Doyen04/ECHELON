import type { Metadata } from "next";
import { Download, Search } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db";
import { formatDateTime, humanizeEnum } from "@/lib/admin-format";

export const metadata: Metadata = {
    title: "Audit Log",
    description: "Immutable action history for the institution.",
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

    return (
        <div className="dashboard-root relative flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-background">
            <PageHeader
                title="Audit Log"
                action={
                    <Button variant="outline" className="rounded-full">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
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

                <Card className="overflow-x-auto rounded-xl bg-surface-main shadow-sm dashboard-section" style={{ animationDelay: "100ms" }}>
                    {logs.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                title="No audit entries yet"
                                description="Activity records will appear here once users upload, review, or dispatch result batches."
                            />
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-border-subtle">
                            <thead className="bg-surface-subtle/40">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Timestamp</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Actor</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Action</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Entity</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">IP Address</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Metadata</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle bg-surface-main">
                                {logs.map((log: any, index: number) => (
                                    <tr key={log.id} className="table-row-enter hover:bg-surface-subtle/40 transition-colors" style={{ animationDelay: `${index * 20}ms` }}>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-foreground">{formatDateTime(log.createdAt)}</td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-foreground">{log.actor?.name ?? "System"}</span>
                                                <span className="inline-flex rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-semibold uppercase text-text-muted">
                                                    {humanizeEnum(log.action.split(".")[0] ?? "system")}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-foreground">{log.action}</td>
                                        <td className="max-w-[28rem] px-5 py-4 text-sm text-foreground">
                                            <div className="break-words whitespace-normal">
                                                {log.entityType} {log.entityId}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm font-mono text-text-muted">{log.ipAddress ?? "N/A"}</td>
                                        <td className="px-5 py-4 text-sm text-text-muted">
                                            <pre className="max-w-xl whitespace-pre-wrap break-words font-mono text-[11px] leading-5">
                                                {JSON.stringify(log.metadata ?? {}, null, 2)}
                                            </pre>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>
            </main>
        </div>
    );
}