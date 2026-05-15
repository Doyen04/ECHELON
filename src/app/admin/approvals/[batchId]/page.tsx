import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/badges";
import { ArrowRight, ChevronDown, CheckSquare, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { BatchCard } from "@/components/features/admin/batch-card";

export default function ApprovalsPage() {
  const pendingBatches = [
    {
      id: "BCH-8A92",
      department: "Computer Science",
      session: "2024/2025",
      semester: 1,
      uploadedBy: { name: "Registrar Adeyemi" },
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      studentResults: new Array(247),
      status: "PENDING",
      source: "CSV"
    },
    {
      id: "BCH-9M2P",
      department: "Mathematics",
      session: "2024/2025",
      semester: 1,
      uploadedBy: { name: "Registrar Adeyemi" },
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      studentResults: new Array(86),
      status: "PENDING",
      source: "CSV"
    }
  ];

  return (
    <div className='flex flex-col h-full overflow-y-auto w-full bg-background dashboard-root'>
      <PageHeader title='Approvals' breadcrumbs='Review Queue' />

      <main className='p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto'>
        <div className='space-y-4'>
          <h2 className='text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1'>
            <Clock className='h-4 w-4' /> Action Required ({pendingBatches.length})
          </h2>

          <div className='grid gap-4'>
            {pendingBatches.map((batch) => (
              <BatchCard key={batch.id} batch={batch} />
            ))}
          </div>
        </div>

        <Card className='p-0  overflow-hidden'>
          <details className='group'>
            <summary className='flex cursor-pointer items-center justify-between p-5 list-none [&::-webkit-details-marker]:hidden bg-muted/30 hover:bg-muted/50 transition-colors'>
              <div className='flex items-center gap-2'>
                <CheckSquare className='h-5 w-5 text-success' />
                <h3 className='font-semibold text-foreground'>
                  Recently Reviewed <span className='text-muted-foreground ml-1 font-medium'>(12)</span>
                </h3>
              </div>
              <ChevronDown className='h-5 w-5 text-muted-foreground transition-transform group-open:rotate-180' />
            </summary>

            <div className='border-t border-border bg-card'>
              <DataTable
                data={[
                  { id: "BCH-7F1X", department: "Physics", session: "2024/2025", status: "APPROVED" },
                  { id: "BCH-4L8K", department: "Chemistry", session: "2024/2025", status: "APPROVED" }
                ]}
                className='border-0  -mx-px'
                columns={[
                  { header: "Batch ID", accessorKey: "id", className: "px-6 font-mono text-xs text-muted-foreground" },
                  { header: "Department", accessorKey: "department", className: "px-6 font-semibold" },
                  { header: "Status", className: "px-6", cell: (row: any) => <StatusBadge status={row.status} /> }
                ]}
              />
            </div>
          </details>
        </Card>
      </main>
    </div>
  );
}
