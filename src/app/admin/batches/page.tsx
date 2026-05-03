"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Download,
  Filter,
  Search,
  ChevronRight,
  Upload,
  Loader2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/badges";
import { ExportButton } from "@/components/features/admin/export-button";
import {
  relativeTimeFromNow,
  semesterLabel,
  toBadgeStatus,
} from "@/lib/admin-format";
import { useApi } from "@/hooks/use-api";
import { ApiGate } from "@/components/shared/api-gate";

import { columns } from "./columns";
import { DataTable } from "@/components/shared/data-table";

export default function BatchesPage() {
  const {
    data: batches = [],
    isLoading,
    error,
  } = useApi<any[]>("/api/batches", { immediate: true });

  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [programs, setPrograms] = useState<any[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);

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

  const filteredBatches = useMemo(() => {
    return (batches || []).filter((b: any) => {
      const matchesDept =
        !selectedDept ||
        b.program?.department?.id === selectedDept ||
        b.department === departments.find((d) => d.id === selectedDept)?.name;
      const matchesProg =
        !selectedProgram ||
        b.programId === selectedProgram ||
        b.program?.id === selectedProgram;
      const matchesLevel = !selectedLevel || String(b.level) === selectedLevel;
      return matchesDept && matchesProg && matchesLevel;
    });
  }, [batches, selectedDept, selectedProgram, selectedLevel, departments]);

  const sessions = Array.from(
    new Set((batches || []).map((b: any) => b.session)),
  ).filter(Boolean);
  const levels = Array.from(
    new Set((batches || []).map((b: any) => String(b.level))),
  )
    .filter((l) => l !== "null" && l !== "undefined")
    .sort();

  return (
    <ApiGate
      data={batches}
      isLoading={isLoading}
      error={error}
      loadingTitle='Loading batches...'
      errorMessage='Failed to load batches'
    >
      {(batches) => (
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
                {levels.map((l) => (
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
              data={filteredBatches}
              columns={columns}
              searchKey='id'
              searchPlaceholder='Search by Batch ID...'
            />
          </main>
        </div>
      )}
    </ApiGate>
  );
}
