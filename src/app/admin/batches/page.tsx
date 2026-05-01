import type { Metadata } from "next";
import Link from "next/link";
import { Download, Filter, Search, ChevronRight, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badges";
import { ExportButton } from "@/components/admin/export-button";
import { prisma } from "@/lib/db";
import { relativeTimeFromNow, semesterLabel, toBadgeStatus } from "@/lib/admin-format";

export const metadata: Metadata = {
    title: "Result Batches",
    description: "Review uploaded result batches and their current statuses.",
};

import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";

export default async function BatchesPage() {
    const db = prisma as any;

    const batches = await db.resultBatch.findMany({
        orderBy: { uploadedAt: "desc" },
        take: 100, // Increased to allow client-side pagination/search to be more useful
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

    const sessions: string[] = Array.from(new Set(batches.map((b: any) => b.session as string))).filter(Boolean) as string[];
    const departments: string[] = Array.from(new Set(batches.map((b: any) => b.department as string))).filter(Boolean) as string[];

    return (
        <div className="flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-background">
            <PageHeader
                title="Result Batches"
                action={
                    <div className="flex items-center gap-3">
                        <ExportButton 
                            endpoint="/api/batches/export" 
                            filename={`batches-${new Date().toISOString().split('T')[0]}.csv`}
                        />
                        <Button asChild className="rounded-full page-transition-enter bg-brand hover:bg-brand-hover">
                            <Link href="/admin/batches/upload">
                                <Upload className="h-4 w-4" />
                                Upload Batch
                            </Link>
                        </Button>
                    </div>
                }
            />

            <main className="mx-auto w-full max-w-7xl min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <DataTable 
                    data={batches} 
                    columns={columns} 
                    searchKey="department"
                    searchPlaceholder="Search by department..."
                    filters={
                        <div className="flex flex-wrap items-center gap-3">
                            <FilterSelect placeholder="Session: All" options={sessions} />
                            <FilterSelect placeholder="Department: All" options={departments} />
                        </div>
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