import type { Metadata } from "next";
import Link from "next/link";
import { Search, ChevronRight, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badges";
import { DataTable } from "@/components/ui/data-table";
import type { DataTableColumn } from "@/components/ui/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { prisma } from "@/lib/db";
import { relativeTimeFromNow, semesterLabel, toBadgeStatus } from "@/lib/admin-format";

export const metadata: Metadata = {
    title: "Result Batches",
    description: "Review uploaded result batches and their current statuses.",
};

type BatchRow = {
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

export default async function BatchesPage() {
    const db = prisma as any;

    const rawBatches = await db.resultBatch.findMany({
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

    const batches: BatchRow[] = rawBatches.map((batch: any) => ({
        id: batch.id,
        session: batch.session,
        semester: batch.semester,
        department: batch.department,
        source: String(batch.source).toUpperCase(),
        status: batch.status,
        uploadedAt: batch.uploadedAt,
        uploaderName: batch.uploadedBy?.name ?? "System",
        studentCount: batch._count?.studentResults ?? 0,
    }));

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
            cell: (row) => semesterLabel(row.semester),
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
                        <FilterSelect placeholder="Session: All" options={Array.from(new Set(batches.map((b) => b.session)))} />
                        <FilterSelect placeholder="Semester: All" options={Array.from(new Set(batches.map((b) => semesterLabel(b.semester))))} />
                        <FilterSelect placeholder="Status: All" options={Array.from(new Set(batches.map((b) => b.status)))} />
                        <FilterSelect placeholder="Department: All" options={Array.from(new Set(batches.map((b) => b.department)))} />

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
                    pagination={
                        <>
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
                        </>
                    }
                />
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