"use client";

import Link from "next/link";
import { Download, Filter, Search, ChevronRight, Upload } from "lucide-react";

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
import { LoadingState } from "@/components/shared/loading-state";
import { ApiGate } from "@/components/shared/api-gate";

import { columns } from "./columns";
import { DataTable } from "@/components/shared/data-table";

export default function BatchesPage() {
  const {
    data: batches = [],
    isLoading,
    error,
  } = useApi<any[]>("/api/batches", { immediate: true });

  return (
    <ApiGate
      data={batches}
      isLoading={isLoading}
      error={error}
      loadingTitle="Loading batches..."
      errorMessage="Failed to load batches"
    >
      {(batches) => {
        const sessions: string[] = Array.from(
          new Set((batches || []).map((b: any) => b.session as string)),
        ).filter(Boolean) as string[];
        const departments: string[] = Array.from(
          new Set((batches || []).map((b: any) => b.department as string)),
        ).filter(Boolean) as string[];

        return (
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
                    <Link href='/admin/batches/upload'>
                      <Upload className='h-4 w-4' />
                      Upload Batch
                    </Link>
                  </Button>
                </div>
              }
            />

            <main className='mx-auto w-full max-w-7xl min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
              <DataTable
                data={batches || []}
                columns={columns}
                searchKey='department'
                searchPlaceholder='Search by department...'
                filters={
                  <div className='flex flex-wrap items-center gap-3'>
                    <FilterSelect placeholder='Session: All' options={sessions} />
                    <FilterSelect
                      placeholder='Department: All'
                      options={departments}
                    />
                  </div>
                }
              />
            </main>
          </div>
        );
      }}
    </ApiGate>
  );
}

function FilterSelect({
  placeholder,
  options,
}: {
  placeholder: string;
  options: string[];
}) {
  const uniqueOptions = Array.from(new Set(options)).filter(Boolean);

  return (
    <select
      defaultValue=''
      className='h-10 cursor-pointer rounded-full border border-input bg-background px-3 text-sm text-foreground hover:bg-muted/60 focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none'
    >
      <option value='' disabled hidden>
        {placeholder}
      </option>
      {uniqueOptions.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}
