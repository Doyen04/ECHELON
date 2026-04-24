import type { Metadata } from "next";
import Link from "next/link";
import { Download, Filter, Search, ChevronRight, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
                    <Button asChild className="rounded-full page-transition-enter">
                        <Link href="/admin/batches/upload">
                            <Upload className="h-4 w-4" />
                            Upload Batch
                        </Link>
                    </Button>
                }
            />

            <main className="mx-auto w-full max-w-7xl min-w-0 space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <Card className="dashboard-section flex min-w-0 flex-col justify-between gap-4 p-4 shadow-sm xl:flex-row xl:items-center">
                    <div className="flex flex-wrap items-center gap-3">
                        <FilterSelect placeholder="Session: All" options={Array.from(new Set(batches.map((batch: any) => batch.session)))} />
                        <FilterSelect placeholder="Semester: All" options={Array.from(new Set(batches.map((batch: any) => semesterLabel(batch.semester))))} />
                        <FilterSelect placeholder="Status: All" options={Array.from(new Set(batches.map((batch: any) => batch.status)))} />
                        <FilterSelect placeholder="Department: All" options={Array.from(new Set(batches.map((batch: any) => batch.department)))} />

                        <div className="relative min-w-0">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                            <Input
                                type="text"
                                placeholder="Search batches..." 
                                className="min-w-0 rounded-full pl-9"
                            />
                        </div>
                    </div>

                    <div className="text-sm text-text-muted xl:text-right whitespace-nowrap">
                        Showing <span className="font-medium text-foreground">{batches.length}</span> live batches 
                    </div>
                </Card>

                <Card className="dashboard-section min-w-0 overflow-hidden rounded-xl shadow-sm">
                    <div className="max-h-[calc(100vh-18rem)] min-w-0 overflow-auto">
                        <table className="w-full table-fixed divide-y divide-border-subtle">
                        <thead className="bg-surface-subtle/40">
                            <tr>
                                <th className="w-10 px-2 py-3 text-left"><input type="checkbox" className="rounded border-border-subtle accent-brand" /></th>
                                <th className="w-28 px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Batch ID</th>
                                <th className="w-24 px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Session</th>
                                <th className="w-24 px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Semester</th>
                                <th className="w-36 px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Department</th>
                                <th className="w-20 px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Students</th>
                                <th className="w-20 px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Source</th>
                                <th className="w-24 px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                                <th className="w-36 px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Uploaded</th>
                                <th className="w-20 px-2 py-3 text-right">
                                    <Button variant="outline" size="xs" className="rounded-full">
                                        <Download className="h-4 w-4" /> Export
                                    </Button>
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
                                        <td className="px-2 py-3 align-top whitespace-nowrap"><input type="checkbox" className="rounded border-border-subtle accent-brand" /></td>
                                        <td className="px-2 py-3 align-top text-[10px] font-mono text-text-muted">
                                            <div className="max-w-24 truncate" title={batch.id}>
                                                {batch.id}
                                            </div>
                                        </td>
                                        <td className="truncate px-2 py-3 align-top text-sm text-foreground">{batch.session}</td>
                                        <td className="truncate px-2 py-3 align-top text-sm text-foreground">{semesterLabel(batch.semester)}</td>
                                        <td className="truncate px-2 py-3 align-top text-sm font-medium text-foreground">{batch.department}</td>
                                        <td className="px-2 py-3 align-top text-sm text-foreground">{studentCount}</td>
                                        <td className="px-2 py-3 align-top whitespace-nowrap">
                                            <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
                                                {source}
                                            </Badge>
                                        </td>
                                        <td className="px-2 py-3 align-top whitespace-nowrap">
                                            <StatusBadge status={toBadgeStatus(batch.status)} />
                                        </td>
                                        <td className="px-2 py-3 align-top">
                                            <div className="min-w-0 flex flex-col">
                                                <span className="truncate text-sm text-foreground">{uploader}</span>
                                                <span className="text-xs text-text-muted">{relativeTimeFromNow(batch.uploadedAt)}</span>
                                            </div>
                                        </td>
                                        <td className="px-2 py-3 align-top whitespace-nowrap text-right">
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
                            <Button disabled variant="outline" size="sm" className="rounded-full">
                                Previous
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-full">
                                Next
                            </Button>
                        </div>
                    </div>
                </Card>
            </main>
        </div>
    );
}

function FilterSelect({ placeholder, options }: { placeholder: string; options: string[] }) {
    const uniqueOptions = Array.from(new Set(options)).filter(Boolean);

    return (
        <select defaultValue="" className="h-10 cursor-pointer rounded-full border border-input bg-background px-3 text-sm text-foreground shadow-sm hover:bg-muted/60 focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none">
            <option value="" disabled hidden>
                {placeholder}
            </option>
            {uniqueOptions.map((option) => (
                <option key={option}>{option}</option>
            ))}
        </select>
    );
}