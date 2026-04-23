import type { Metadata } from "next";
import Link from "next/link";
import { Download, Filter, Search, ChevronRight, Upload } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badges";
import { prisma } from "@/lib/db";
import { relativeTimeFromNow, semesterLabel, toBadgeStatus } from "@/lib/admin-format";

export const metadata: Metadata = {
    title: "Result Batches",
    description: "Review uploaded result batches and their current statuses.",
};

export default async function BatchesPage() {
    const db = prisma as any;

    const batches = await db.resultBatch.findMany({
        orderBy: { uploadedAt: "desc" },
        take: 25,
        select: {
            id: true,
            session: true,
            semester: true,
            department: true,
            source: true,
            status: true,
            uploadedAt: true,
            uploadedBy: { select: { name: true } },
            _count: {
                select: {
                    studentResults: true,
                },
            },
        },
    });

    return (
        <div className="flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-background">
            <PageHeader
                title="Result Batches"
                action={
                    <Link
                        href="/admin/batches/upload"
                        className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-hover page-transition-enter"
                    >
                        <Upload className="h-4 w-4" />
                        Upload Batch
                    </Link>
                }
            />

            <main className="mx-auto w-full max-w-7xl min-w-0 space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <section className="dashboard-section flex min-w-0 flex-col justify-between gap-4 xl:flex-row xl:items-center">
                    <div className="flex flex-wrap items-center gap-3">
                        <FilterSelect placeholder="Session: All" options={Array.from(new Set(batches.map((batch: any) => batch.session)))} />
                        <FilterSelect placeholder="Semester: All" options={Array.from(new Set(batches.map((batch: any) => semesterLabel(batch.semester))))} />
                        <FilterSelect placeholder="Status: All" options={Array.from(new Set(batches.map((batch: any) => batch.status)))} />
                        <FilterSelect placeholder="Department: All" options={Array.from(new Set(batches.map((batch: any) => batch.department)))} />

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search batches..."
                                className="min-w-60 rounded-md border border-border-subtle bg-surface-main pl-9 pr-4 text-sm focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="text-sm text-text-muted xl:text-right whitespace-nowrap">
                        Showing <span className="font-medium text-foreground">{batches.length}</span> live batches
                    </div>
                </section>

                <section className="dashboard-section min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-surface-main shadow-sm">
                    <div className="max-h-[calc(100vh-18rem)] min-w-0 overflow-auto">
                    <table className="min-w-[1100px] table-fixed divide-y divide-border-subtle">
                        <thead className="bg-surface-subtle/40">
                            <tr>
                                <th className="w-12 px-4 py-3 text-left"><input type="checkbox" className="rounded border-border-subtle accent-brand" /></th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Batch ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Session</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Semester</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Department</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Students</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Source</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Uploaded</th>
                                <th className="px-4 py-3 text-right">
                                    <button className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-surface-main px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-surface-subtle">
                                        <Download className="h-4 w-4" /> Export
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle bg-surface-main">
                            {batches.map((batch: any, index: number) => {
                                const studentCount = batch._count?.studentResults ?? 0;
                                const uploader = batch.uploadedBy?.name ?? "System";
                                const source = String(batch.source).toUpperCase();

                                return (
                                    <tr key={batch.id} className="group table-row-enter hover:bg-surface-subtle/50 transition-colors" style={{ animationDelay: `${index * 30}ms` }}>
                                        <td className="px-3 py-3 align-top whitespace-nowrap"><input type="checkbox" className="rounded border-border-subtle accent-brand" /></td>
                                        <td className="px-3 py-3 align-top text-xs font-mono text-text-muted">
                                            <div className="max-w-[9rem] truncate" title={batch.id}>
                                                {batch.id}
                                            </div>
                                        </td>
                                        <td className="truncate px-3 py-3 align-top text-sm text-foreground">{batch.session}</td>
                                        <td className="truncate px-3 py-3 align-top text-sm text-foreground">{semesterLabel(batch.semester)}</td>
                                        <td className="truncate px-3 py-3 align-top text-sm font-medium text-foreground">{batch.department}</td>
                                        <td className="px-3 py-3 align-top text-sm text-foreground">{studentCount}</td>
                                        <td className="px-3 py-3 align-top whitespace-nowrap">
                                            <span className="inline-flex items-center rounded border border-border-subtle bg-surface-subtle px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
                                                {source}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 align-top whitespace-nowrap">
                                            <StatusBadge status={toBadgeStatus(batch.status)} />
                                        </td>
                                        <td className="px-3 py-3 align-top">
                                            <div className="min-w-0 flex flex-col">
                                                <span className="truncate text-sm text-foreground">{uploader}</span>
                                                <span className="text-xs text-text-muted">{relativeTimeFromNow(batch.uploadedAt)}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 align-top whitespace-nowrap text-right">
                                            <Link
                                                href={`/admin/batches/${batch.id}`}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-brand opacity-0 transition-opacity hover:text-brand-hover hover:underline group-hover:opacity-100"
                                            >
                                                View <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-subtle bg-surface-subtle/20 px-6 py-4">
                        <div className="text-sm text-text-muted">
                            Showing 1 to {Math.min(batches.length, 10)} of {batches.length} entries
                        </div>
                        <div className="flex gap-2">
                            <button disabled className="rounded border border-border-subtle bg-surface-main px-3 py-1 text-sm text-foreground disabled:opacity-50">
                                Previous
                            </button>
                            <button className="rounded border border-border-subtle bg-surface-main px-3 py-1 text-sm text-foreground transition-colors hover:bg-surface-subtle">
                                Next
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function FilterSelect({ placeholder, options }: { placeholder: string; options: string[] }) {
    const uniqueOptions = Array.from(new Set(options)).filter(Boolean);

    return (
        <select defaultValue="" className="h-10 cursor-pointer rounded-md border border-border-subtle bg-surface-main px-3 text-sm text-foreground hover:bg-surface-subtle/50 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none">
            <option value="" disabled hidden>
                {placeholder}
            </option>
            {uniqueOptions.map((option) => (
                <option key={option}>{option}</option>
            ))}
        </select>
    );
}