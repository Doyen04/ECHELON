"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    Filter,
    Upload,
    Search,
} from "lucide-react";


import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ExportButton } from "@/components/features/admin/export-button";
import { useApi } from "@/hooks/use-api";
import { ApiGate } from "@/components/shared/api-gate";

import { columns } from "./columns";
import { DataTable } from "@/components/shared/data-table";

export default function BatchesPage() {
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedProgram, setSelectedProgram] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [departments, setDepartments] = useState<any[]>([]);
    const [programs, setPrograms] = useState<any[]>([]);
    const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);

    const queryParams = new URLSearchParams();
    queryParams.append("page", String(currentPage));
    queryParams.append("limit", String(pageSize));
    if (selectedDept) queryParams.append("departmentId", selectedDept);
    if (selectedProgram) queryParams.append("programId", selectedProgram);
    if (selectedLevel) queryParams.append("level", selectedLevel);
    if (searchQuery.trim()) queryParams.append("q", searchQuery.trim());

    const {
        data: response,
        isLoading,
        error,
    } = useApi<any>(`/api/batches?${queryParams.toString()}`, { immediate: true });

    const batches = response?.batches ?? [];
    const pagination = response?.pagination ?? {
        currentPage: 1,
        pages: 1,
        total: 0,
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedDept, selectedProgram, selectedLevel, searchQuery]);

    useEffect(() => {
        fetch("/api/admin/departments")
            .then((res) => res.json())
            .then((data) => setDepartments(data.departments || []));
    }, []);

    useEffect(() => {
        if (selectedDept) {
            setIsLoadingPrograms(true);
            fetch(`/api/admin/programs/${selectedDept}/list`)
                .then((res) => res.json())
                .then((data) => setPrograms(data || []))
                .finally(() => setIsLoadingPrograms(false));
        } else {
            setPrograms([]);
            setSelectedProgram("");
        }
    }, [selectedDept]);

    const sessions = Array.from(
        new Set((batches || []).map((b: any) => b.session)),
    ).filter(Boolean);
    const levels = Array.from(
        new Set((batches || []).map((b: any) => String(b.level))),
    ) as string[];
    const normalizedLevels = levels
        .filter((l) => l !== "null" && l !== "undefined")
        .sort();

    return (
        <ApiGate
            data={response}
            isLoading={isLoading}
            error={error}
            loadingTitle='Loading batches...'
            errorMessage='Failed to load batches'
        >
            {() => (
                <div className='flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-background'>
                    <PageHeader
                        title='Result Batches'
                        action={
                            <div className='flex items-center gap-3'>
                                <ExportButton
                                    endpoint='/api/batches/export'
                                    filename={`batches-${new Date().toISOString().split("T")[0]}.csv`}
                                />
                                <Button
                                    asChild
                                    className='rounded-full page-transition-enter bg-brand hover:bg-brand-hover'
                                >
                                    <Link href='/admin/upload'>
                                        <Upload className='h-4 w-4 mr-2' />
                                        Upload Batch
                                    </Link>
                                </Button>
                            </div>
                        }
                    />

                    <main className='mx-auto w-full max-w-7xl min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
                        <div className='flex flex-wrap items-center gap-3 mb-6 bg-card/30 p-4 rounded-2xl border border-border'>
                            <div className='flex items-center gap-2 mr-2'>
                                <Filter className='h-4 w-4 text-muted-foreground' />
                                <span className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>
                                    Filters
                                </span>
                            </div>

                            <div className='relative min-w-56 flex-1 max-w-sm'>
                                <Search className='absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground' />
                                <input
                                    className='h-9 w-full rounded-full border border-input bg-background pl-9 pr-3 text-xs font-bold uppercase tracking-tight outline-none focus:ring-2 focus:ring-brand/30'
                                    placeholder='Search batch ID, program, session...'
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <select
                                className='h-9 rounded-full border border-input bg-background px-3 text-xs font-bold uppercase tracking-tight outline-none focus:ring-2 focus:ring-brand/30'
                                value={selectedDept}
                                onChange={(e) => {
                                    setSelectedDept(e.target.value);
                                    setSelectedProgram("");
                                }}
                            >
                                <option value=''>All Departments</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                className='h-9 rounded-full border border-input bg-background px-3 text-xs font-bold uppercase tracking-tight outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50'
                                value={selectedProgram}
                                onChange={(e) => setSelectedProgram(e.target.value)}
                                disabled={!selectedDept || isLoadingPrograms}
                            >
                                <option value=''>All Programs</option>
                                {programs.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                className='h-9 rounded-full border border-input bg-background px-3 text-xs font-bold uppercase tracking-tight outline-none focus:ring-2 focus:ring-brand/30'
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                            >
                                <option value=''>All Levels</option>
                                {normalizedLevels.map((l) => (
                                    <option key={l} value={l}>
                                        {l} Level
                                    </option>
                                ))}
                            </select>

                            {(selectedDept || selectedProgram || selectedLevel) && (
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => {
                                        setSelectedDept("");
                                        setSelectedProgram("");
                                        setSelectedLevel("");
                                    }}
                                    className='text-[10px] font-bold uppercase tracking-widest h-8'
                                >
                                    Clear
                                </Button>
                            )}
                        </div>

                        <DataTable
                            data={batches}
                            columns={columns}
                            manualPagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.pages}
                            totalCount={pagination.total}
                            onPageChange={setCurrentPage}
                        />
                    </main>
                </div>
            )}
        </ApiGate>
    );
}
