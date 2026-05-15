"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
    Plus,
    Search,
    Filter,
    Calendar,
    User,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronRight,
    Loader2,
    BookOpen,
    ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/shared/data-table";

export default function HodBatchesPage() {
    const [batches, setBatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;

    useEffect(() => {
        const params = new URLSearchParams({
            page: String(currentPage),
            limit: String(pageSize),
        });
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        if (selectedLevel) params.set("level", selectedLevel);
        if (selectedStatus) params.set("status", selectedStatus);

        fetch(`/api/hod/batches?${params.toString()}`)
            .then((res) => res.json())
            .then((data) => {
                setBatches(data.batches || []);
                setTotalPages(data.pagination?.pages ?? 1);
                setTotalCount(data.pagination?.total ?? 0);
            })
            .catch((err) => {
                console.error("Failed to load batches", err);
                toast.error("Failed to load batches");
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [currentPage, searchQuery, selectedLevel, selectedStatus]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedLevel, selectedStatus]);

    const levels = Array.from(
        new Set(batches.map((b) => String(b.level))),
    ).sort();
    const statuses = Array.from(new Set(batches.map((b) => b.status)));

    const columns = [
        {
            header: "Program / Level",
            accessorKey: "program",
            className: "px-6 py-4",
            cell: (batch: any) => (
                <div className='flex items-center gap-3'>
                    <div className='h-9 w-9 rounded-xl bg-brand/5 flex items-center justify-center text-brand border border-brand/10'>
                        <BookOpen className='h-4 w-4' />
                    </div>
                    <div>
                        <p className='font-bold text-foreground text-sm'>
                            {batch.program.name}
                        </p>
                        <p className='text-[10px] font-mono font-bold uppercase text-muted-foreground tracking-tighter'>
                            {batch.level} Level
                        </p>
                    </div>
                </div>
            ),
        },
        {
            header: "Period",
            accessorKey: "session",
            className: "px-6 py-4",
            cell: (batch: any) => (
                <div className='flex flex-col'>
                    <span className='text-sm font-semibold text-foreground'>
                        {batch.session}
                    </span>
                    <span className='text-[10px] font-bold uppercase text-muted-foreground tracking-widest'>
                        {batch.semester}
                    </span>
                </div>
            ),
        },
        {
            header: "Students",
            accessorKey: "_count",
            className: "px-6 py-4 text-center",
            cell: (batch: any) => (
                <Badge
                    variant='secondary'
                    className='bg-muted/50 text-foreground font-bold px-2 py-0.5 border-none'
                >
                    {batch._count?.studentResults ?? 0}
                </Badge>
            ),
        },
        {
            header: "Status",
            accessorKey: "status",
            className: "px-6 py-4",
            cell: (batch: any) => (
                <Badge
                    variant='outline'
                    className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border-none",
                        batch.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-600"
                            : batch.status === "REJECTED"
                                ? "bg-rose-50 text-rose-600"
                                : "bg-amber-50 text-amber-600",
                    )}
                >
                    {batch.status === "APPROVED" ? (
                        <CheckCircle2 className='h-3 w-3 mr-1 inline' />
                    ) : (
                        <Clock className='h-3 w-3 mr-1 inline' />
                    )}
                    {batch.status}
                </Badge>
            ),
        },
        {
            header: "Uploaded",
            accessorKey: "uploadedAt",
            className: "px-6 py-4",
            cell: (batch: any) => (
                <div className='flex flex-col items-end'>
                    <span className='text-sm font-bold text-foreground'>
                        {new Date(batch.uploadedAt).toLocaleDateString()}
                    </span>
                    <span className='text-[10px] text-muted-foreground font-medium'>
                        {new Date(batch.uploadedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                </div>
            ),
        },
        {
            header: "",
            className: "px-6 py-4 text-right",
            cell: (batch: any) => (
                <Link
                    href={`/hod/batches/${batch.id}`}
                    className='inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-brand'
                >
                    <ChevronRight className='h-4 w-4' />
                </Link>
            ),
        },
    ];

    return (
        <div className='flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-background'>
            <PageHeader
                title='My Result Batches'
                // description="Review and manage academic results for your programs."
                breadcrumbs={
                    <div className='flex items-center gap-1'>
                        <span>Portal</span>
                        <span>/</span>
                        <span className='text-(--text-muted)'>Batch History</span>
                    </div>
                }
                action={
                    <Button
                        asChild
                        className='bg-brand hover:bg-brand-hover rounded-full font-bold'
                    >
                        <Link href='/hod/upload'>
                            <Plus className='h-4 w-4 mr-2' />
                            New Upload
                        </Link>
                    </Button>
                }
            />

            <main className='mx-auto w-full max-w-7xl py-8 px-4 sm:px-6 lg:px-8'>
                <div className='mb-8 flex flex-wrap items-stretch gap-3 rounded-2xl border border-border bg-card/30 p-4 sm:items-center'>
                    <div className='flex items-center gap-2 mr-2'>
                        <Filter className='h-4 w-4 text-muted-foreground' />
                        <span className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>
                            Filters
                        </span>
                    </div>

                    <div className='relative w-full min-w-0 sm:min-w-60 sm:max-w-sm sm:flex-1'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground' />
                        <Input
                            placeholder='Search by program...'
                            className='pl-9 h-9 rounded-full border-input bg-background text-xs font-bold uppercase tracking-tight'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <select
                        className='h-9 w-full rounded-full border border-input bg-background px-4 text-xs font-bold uppercase tracking-tight outline-none focus:ring-2 focus:ring-brand/30 sm:w-auto'
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                    >
                        <option value=''>All Levels</option>
                        {levels.map((l) => (
                            <option key={l} value={l}>
                                {l} Level
                            </option>
                        ))}
                    </select>

                    <select
                        className='h-9 w-full rounded-full border border-input bg-background px-4 text-xs font-bold uppercase tracking-tight outline-none focus:ring-2 focus:ring-brand/30 sm:w-auto'
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <option value=''>All Statuses</option>
                        {statuses.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>

                    {(searchQuery || selectedLevel || selectedStatus) && (
                        <Button
                            type="button"
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedLevel("");
                                setSelectedStatus("");
                            }}
                            className='text-[10px] font-bold uppercase tracking-widest h-8'
                        >
                            Reset
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className='flex flex-col items-center justify-center py-20 gap-4'>
                        <Loader2 className='h-8 w-8 animate-spin text-brand' />
                        <p className='text-sm text-muted-foreground font-medium tracking-tight'>
                            Syncing with registry...
                        </p>
                    </div>
                ) : (
                    <Card className='overflow-hidden border-border bg-card shadow-sm'>
                        <DataTable
                            data={batches}
                            columns={columns}
                            className='border-none'
                            manualPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalCount={totalCount}
                            onPageChange={setCurrentPage}
                        />
                    </Card>
                )}
            </main>
        </div>
    );
}
