import type { Metadata } from "next";
import Link from "next/link";
import { Search, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/db";
import { semesterLabel } from "@/lib/admin-format";
import { BatchesClient, type BatchRow } from "./batches-client";

export const metadata: Metadata = {
    title: "Result Batches",
    description: "Review uploaded result batches and their current statuses.",
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
                        <FilterSelect placeholder="Semester: All" options={Array.from(new Set(batches.map((b) => semesterLabel(b.semester as any))))} />
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

                <BatchesClient batches={batches} />
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