"use client";

import React, { useState, useEffect } from "react";
import { Download, Search, ChevronRight, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function AuditLogPage() {
    const [selectedLog, setSelectedLog] = useState<any>(null);

    // Close drawer on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSelectedLog(null);
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, []);

    return (
        <div className="flex flex-col h-full overflow-y-auto w-full bg-background dashboard-root overflow-x-hidden relative">
            <PageHeader
                title="Audit Log"
                action={
                    <button className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-white px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] shadow-sm hover:bg-[var(--color-surface-2)] transition-colors">
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                }
            />

            <div className={`p-6 md:p-8 space-y-6 max-w-[1600px] w-full mx-auto transition-all duration-300 ${selectedLog ? 'mr-[420px]' : ''}`}>
                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 dashboard-section">
                    <input
                        type="date"
                        className="h-10 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] cursor-pointer text-[var(--color-text-primary)]"
                    />
                    <select defaultValue="" className="h-10 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] hover:bg-[var(--color-surface-2)]/50 cursor-pointer text-[var(--color-text-primary)]">
                        <option value="" disabled hidden>Action Type: All</option>
                        <option>batch.*</option>
                        <option>result.*</option>
                        <option>dispatch.*</option>
                        <option>user.*</option>
                        <option>auth.*</option>
                    </select>
                    <select defaultValue="" className="h-10 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] hover:bg-[var(--color-surface-2)]/50 cursor-pointer text-[var(--color-text-primary)]">
                        <option value="" disabled hidden>Actor: All</option>
                        <option>Prof. A. Okoye</option>
                        <option>Registrar Adeyemi</option>
                        <option>System</option>
                    </select>
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search entity ID or keyword..."
                            className="w-full h-10 pl-9 pr-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-[var(--color-text-primary)]"
                        />
                    </div>
                </div>

                {/* Audit Table */}
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-x-auto dashboard-section" style={{ animationDelay: '100ms' }}>
                    {mockAudits.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                title="No audit entries yet"
                                description="Activity records will appear here once users upload, review, or dispatch result batches."
                            />
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-[var(--color-border)]">
                            <thead className="bg-[var(--color-surface-2)]/40">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Timestamp</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Actor</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Action</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Entity</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">IP Address</th>
                                    <th className="px-5 py-3 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                                {mockAudits.map((log, idx) => (
                                    <tr key={idx} className="hover:bg-[var(--color-surface-2)]/40 transition-colors table-row-enter cursor-pointer" onClick={() => setSelectedLog(log)} style={{ animationDelay: `${idx * 20}ms` }}>
                                        <td className="px-5 py-4 whitespace-nowrap group">
                                            <span className="text-sm text-[var(--color-text-primary)] group-hover:hidden">{log.relTime}</span>
                                            <span className="text-sm text-[var(--color-text-secondary)] hidden group-hover:inline">{log.absTime}</span>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-[var(--color-text-primary)]">{log.actor}</span>
                                                <span className="inline-flex rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] uppercase font-semibold text-[var(--color-text-muted)]">{log.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <ActionChip action={log.action} />
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">{log.entity}</td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm font-mono text-[var(--color-text-muted)]">{log.ip}</td>
                                        <td className="px-5 py-4 whitespace-nowrap text-right">
                                            <button className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] hover:underline">
                                                Details <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/20">
                        <div className="text-sm text-[var(--color-text-muted)]">Showing 1 to 8 of 1,204 entries</div>
                        <div className="flex gap-2">
                            <button disabled className="px-3 py-1 border border-[var(--color-border)] rounded bg-[var(--color-surface)] text-sm disabled:opacity-50 text-[var(--color-text-primary)]">Previous</button>
                            <button className="px-3 py-1 border border-[var(--color-border)] rounded bg-white text-sm hover:bg-[var(--color-surface-2)] text-[var(--color-text-primary)]">Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* DETAIL DRAWER */}
            {/* Backdrop */}
            {selectedLog && (
                <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setSelectedLog(null)} />
            )}

            {/* Drawer */}
            <div className={`fixed inset-y-0 right-0 z-50 w-[420px] bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-2xl transition-transform duration-300 ease-out transform ${selectedLog ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedLog && (
                    <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                            <h2 className="font-serif text-xl text-[var(--color-text-primary)]">Audit Details</h2>
                            <button onClick={() => setSelectedLog(null)} className="p-1 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-text-muted)] mb-1">Actor</div>
                                    <div className="font-medium text-[var(--color-text-primary)] {text-sm}">{selectedLog.actor}</div>
                                    <div className="text-xs text-[var(--color-text-muted)]">{selectedLog.role}</div>
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-text-muted)] mb-1">Timestamp</div>
                                    <div className="text-sm font-medium text-[var(--color-text-primary)]">{selectedLog.absTime}</div>
                                    <div className="text-xs text-[var(--color-text-muted)]">{selectedLog.relTime}</div>
                                </div>
                            </div>

                            <div>
                                <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-text-muted)] mb-1">Action</div>
                                <ActionChip action={selectedLog.action} />
                            </div>

                            <div>
                                <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-text-muted)] mb-1">Entity</div>
                                <div className="text-sm font-mono text-[var(--color-text-primary)] bg-[var(--color-surface-2)] p-2 rounded border border-[var(--color-border)]">
                                    {selectedLog.entity}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-text-muted)] mb-2 flex items-center justify-between">
                                    <span>Metadata</span>
                                    <button className="text-[var(--color-accent)] hover:underline lowercase tracking-normal">Copy JSON</button>
                                </div>
                                <div className="bg-[#1e1e1e] rounded-md p-4 overflow-x-auto text-sm font-mono text-[#d4d4d4] leading-relaxed">
                                    <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                                </div>
                            </div>

                            <div>
                                <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-text-muted)] mb-1">IP Address & User Agent</div>
                                <div className="text-sm font-mono text-[var(--color-text-primary)] mb-1">{selectedLog.ip}</div>
                                <div className="text-xs text-[var(--color-text-muted)]">Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}

function ActionChip({ action }: { action: string }) {
    const parts = action.split('.');
    const namespace = parts[0];

    let colorClass = "bg-slate-100 text-slate-700";
    if (namespace === "batch") colorClass = "bg-blue-100 text-blue-800";
    else if (namespace === "result") colorClass = "bg-amber-100 text-amber-800";
    else if (namespace === "dispatch") colorClass = "bg-indigo-100 text-indigo-800";
    else if (namespace === "user") colorClass = "bg-slate-100 text-slate-700";
    else if (namespace === "auth") colorClass = "bg-green-100 text-green-800";

    return (
        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-medium ${colorClass}`}>
            {action}
        </span>
    );
}

const mockAudits = [
    { relTime: "10 mins ago", absTime: "14 Jan 2025, 12:45:00 UTC", actor: "Prof. A. Okoye", role: "senate_officer", action: "batch.approved", entity: "Batch #BCH-8A92", ip: "196.223.111.94", metadata: { "batchId": "BCH-8A92", "approvalStatus": "approved", "studentsApproved": 231, "studentsWithheld": 8 } },
    { relTime: "1 hour ago", absTime: "14 Jan 2025, 11:30:12 UTC", actor: "Registrar Adeyemi", role: "registrar", action: "batch.uploaded", entity: "Batch #BCH-8A92", ip: "41.190.2.14", metadata: { "filename": "CSC_results_2024.csv", "rowCount": 247, "size": "45KB", "session": "2024/2025" } },
    { relTime: "2 hours ago", absTime: "14 Jan 2025, 10:15:00 UTC", actor: "Prof. A. Okoye", role: "senate_officer", action: "auth.login", entity: "User #USR-992", ip: "196.223.111.94", metadata: { "provider": "credentials", "success": true } },
    { relTime: "Yesterday", absTime: "13 Jan 2025, 15:20:00 UTC", actor: "System", role: "system", action: "dispatch.completed", entity: "Dispatch #DSP-551", ip: "10.0.0.5", metadata: { "dispatchId": "DSP-551", "delivered": 410, "failed": 2, "timeElapsed": "4m12s" } },
    { relTime: "Yesterday", absTime: "13 Jan 2025, 15:15:00 UTC", actor: "Registrar Adeyemi", role: "registrar", action: "dispatch.triggered", entity: "Batch #BCH-6K9M", ip: "41.190.2.14", metadata: { "batchId": "BCH-6K9M", "audience": 412, "channels": ["whatsapp", "email"] } },
    { relTime: "2 days ago", absTime: "12 Jan 2025, 09:00:00 UTC", actor: "Admin Manager", role: "super_admin", action: "user.role_changed", entity: "User #USR-105", ip: "41.190.2.88", metadata: { "targetUserId": "USR-105", "oldRole": "viewer", "newRole": "senate_officer" } },
    { relTime: "3 days ago", absTime: "11 Jan 2025, 14:10:00 UTC", actor: "M. Eze", role: "registrar", action: "result.withheld", entity: "Result #RSLT-009", ip: "41.190.2.102", metadata: { "matric": "CSC/2021/005", "reason": "Outstanding fees - confirmed by bursary" } },
    { relTime: "5 days ago", absTime: "09 Jan 2025, 08:30:00 UTC", actor: "System", role: "system", action: "batch.sync_failed", entity: "API Sync / Biology", ip: "10.0.0.5", metadata: { "endpoint": "/api/sis/results", "statusCode": 503, "error": "Upstream timeout" } },
];
