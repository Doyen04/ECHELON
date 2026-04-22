import React from "react";
import Link from "next/link";
import { Upload, Search, ChevronRight, Filter, Download } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badges";

export default function BatchesPage() {
    return (
        <div className="flex flex-col h-full overflow-y-auto w-full bg-background">
            <PageHeader
                title="Result Batches"
                action={
                    <Link
                        href="/admin/batches/upload"
                        className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-hover transition-colors page-transition-enter"
                    >
                        <Upload className="h-4 w-4" />
                        Upload Batch
                    </Link>
                }
            />

            <div className="p-6 md:p-8 space-y-6 max-w-400 w-full mx-auto">
                {/* Filter Bar */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 dashboard-section">
                    <div className="flex flex-wrap items-center gap-3">
                        <FilterSelect placeholder="Session: All" options={["2024/2025", "2023/2024"]} />
                        <FilterSelect placeholder="Semester: All" options={["First", "Second"]} />
                        <FilterSelect placeholder="Status: All" options={["Pending", "In Review", "Approved", "Dispatched"]} />
                        <FilterSelect placeholder="Department: All" options={["Computer Science", "Physics", "Chemistry"]} />

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search batches..."
                                className="h-10 pl-9 pr-4 rounded-md border border-border-subtle bg-surface-main text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand min-w-60"
                            />
                        </div>
                    </div>

                    <div className="text-sm text-text-muted xl:text-right whitespace-nowrap">
                        Showing <span className="font-medium text-foreground">24</span> batches
                    </div>
                </div>

                {/* Batches Table List */}
                <div className="rounded-xl border border-border-subtle bg-surface-main shadow-sm overflow-x-auto dashboard-section">
                    <table className="min-w-full divide-y divide-border-subtle">
                        <thead className="bg-surface-subtle/40">
                            <tr>
                                <th className="px-4 py-3 text-left w-12"><input type="checkbox" className="rounded border-border-subtle accent-brand" /></th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Batch ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Session</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Semester</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Department</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Students</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Source</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Uploaded</th>
                                <th className="px-4 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle bg-surface-main">
                            {mockBatches.map((batch, i) => (
                                <BatchRow key={batch.id} batch={batch} idx={i} />
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle bg-surface-subtle/20">
                        <div className="text-sm text-text-muted">
                            Showing 1 to 10 of 24 entries
                        </div>
                        <div className="flex gap-2">
                            <button disabled className="px-3 py-1 border border-border-subtle rounded bg-surface-main text-sm disabled:opacity-50 text-foreground">Previous</button>
                            <button className="px-3 py-1 border border-border-subtle rounded bg-surface-main text-sm hover:bg-surface-subtle text-foreground">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FilterSelect({ placeholder, options }: { placeholder: string, options: string[] }) {
    return (
        <select defaultValue="" className="h-10 rounded-md border border-border-subtle bg-surface-main px-3 text-sm text-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand hover:bg-surface-subtle/50 cursor-pointer">
            <option value="" disabled hidden>{placeholder}</option>
            {options.map(opt => <option key={opt}>{opt}</option>)}
        </select>
    );
}

function BatchRow({ batch, idx }: { batch: any, idx: number }) {
    return (
        <tr className="hover:bg-surface-subtle/50 transition-colors group table-row-enter">
            <td className="px-4 py-4 whitespace-nowrap"><input type="checkbox" className="rounded border-border-subtle accent-brand" /></td>
            <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-text-muted">{batch.id}</td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">{batch.session}</td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">{batch.semester}</td>
            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">{batch.dept}</td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">{batch.students}</td>
            <td className="px-4 py-4 whitespace-nowrap">
                <span className="inline-flex items-center rounded border border-border-subtle bg-surface-subtle px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase text-text-muted">
                    {batch.source}
                </span>
            </td>
            <td className="px-4 py-4 whitespace-nowrap">
                <StatusBadge status={batch.status} />
            </td>
            <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                    <span className="text-sm text-foreground">{batch.uploadedBy}</span>
                    <span className="text-xs text-text-muted">{batch.uploadedAt}</span>
                </div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-right">
                <Link
                    href={`/admin/batches/${batch.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    View <ChevronRight className="h-4 w-4" />
                </Link>
            </td>
        </tr>
    );
}

const mockBatches = [
    { id: "BCH-8A92", session: "2024/2025", semester: "First", dept: "Computer Science", students: 247, source: "CSV", status: "pending", uploadedBy: "J. Adeyemi", uploadedAt: "2 hours ago" },
    { id: "BCH-7F1X", session: "2024/2025", semester: "First", dept: "Physics", students: 112, source: "API", status: "approved", uploadedBy: "A. Okoye", uploadedAt: "1 day ago" },
    { id: "BCH-9M2P", session: "2024/2025", semester: "First", dept: "Mathematics", students: 86, source: "CSV", status: "in_review", uploadedBy: "J. Adeyemi", uploadedAt: "2 days ago" },
    { id: "BCH-4L8K", session: "2024/2025", semester: "First", dept: "Chemistry", students: 184, source: "API", status: "dispatched", uploadedBy: "System", uploadedAt: "1 week ago" },
    { id: "BCH-2N5A", session: "2024/2025", semester: "First", dept: "Biology", students: 210, source: "CSV", status: "pending", uploadedBy: "M. Eze", uploadedAt: "1 week ago" },
    { id: "BCH-1P3V", session: "2023/2024", semester: "Second", dept: "Accounting", students: 340, source: "CSV", status: "dispatched", uploadedBy: "J. Adeyemi", uploadedAt: "4 months ago" },
    { id: "BCH-6K9M", session: "2023/2024", semester: "Second", dept: "Economics", students: 412, source: "API", status: "dispatched", uploadedBy: "System", uploadedAt: "4 months ago" },
];
