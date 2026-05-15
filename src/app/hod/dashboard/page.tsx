"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Upload,
  ClipboardList,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SummaryMetrics } from "@/components/dashboard/summary-metrics";

export default function HodDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hod/stats")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
        toast.error("Failed to load dashboard data");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center py-20 gap-4 bg-background h-full'>
        <Loader2 className='h-8 w-8 animate-spin text-sidebar-primary' />
        <p className='text-sm text-muted-foreground font-medium'>
          Initializing portal...
        </p>
      </div>
    );
  }

  const stats = data?.stats || {
    totalBatches: 0,
    pendingBatches: 0,
    approvedBatches: 0,
    totalPrograms: 0,
  };
  const recentBatches = data?.recentBatches || [];

  const metrics = [
    {
      label: "Total Batches",
      value: stats.totalBatches,
      trend: "steady" as const,
      change: "Live",
      helper: "Total result uploads recorded",
    },
    {
      label: "Pending Review",
      value: stats.pendingBatches,
      trend: stats.pendingBatches > 0 ? ("up" as const) : ("steady" as const),
      change: stats.pendingBatches > 0 ? "Action Required" : "All Clear",
      helper: "Awaiting administrator approval",
    },
    {
      label: "Managed Programs",
      value: stats.totalPrograms,
      trend: "steady" as const,
      change: "Academic",
      helper: "Programs under your department",
    },
  ];

  return (
    <div className='flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-background'>
      <PageHeader
        title='HOD Portal'
        // description="Academic administration and result management."
        breadcrumbs={
          <div className='flex items-center gap-1'>
            <span>2024/2025</span>
            <span>/</span>
            <span className='text-(--text-muted)'>Department Overview</span>
          </div>
        }
      />

      <main className='mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
        <SummaryMetrics metrics={metrics} />

        <div className='grid gap-6 xl:grid-cols-[1fr_380px]'>
          <aside className='space-y-6'>
            <Card className='relative overflow-hidden border-none bg-brand p-8 text-white shadow-xl'>
              <div className='relative z-10'>
                <p className='text-[10px] font-bold uppercase tracking-[0.2em] text-white/70'>
                  Action Center
                </p>
                <h2 className='mt-3 font-serif text-2xl font-semibold leading-tight'>
                  Upload Result
                  <br />
                  Batch
                </h2>
                <p className='mt-4 text-sm leading-relaxed text-white/80'>
                  Ready to process new results? Upload your CSV or PDF result
                  sheets here.
                </p>
                <div className='mt-8'>
                  <Button
                    asChild
                    className='rounded-full bg-white px-6 text-brand hover:bg-white/90 shadow-lg font-bold'
                  >
                    <Link
                      href='/hod/upload'
                      className='inline-flex items-center gap-2'
                    >
                      Start Upload
                      <ArrowRight className='h-4 w-4' />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className='absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10 blur-3xl' />
              <div className='absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-black/10 blur-3xl' />
            </Card>
          </aside>
          
          <section className='space-y-4'>
            <div className='flex items-center justify-between px-1'>
              <h2 className='text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80'>
                Recent Upload Activity
              </h2>
              <Link
                href='/hod/batches'
                className='text-xs font-bold text-brand hover:underline flex items-center gap-1'
              >
                View History <ArrowUpRight className='h-3 w-3' />
              </Link>
            </div>
            <Card className='overflow-hidden border-border bg-card shadow-sm'>
              {recentBatches.length > 0 ? (
                <div className='divide-y divide-border/50'>
                  {recentBatches.map((batch: any, index: number) => (
                    <Link
                      key={batch.id}
                      href={`/hod/batches/${batch.id}`}
                      className='group flex min-w-0 items-center justify-between gap-3 p-4 transition-all hover:bg-muted/30 sm:p-5'
                      style={{
                        animation: `fade-in 0.4s ease-out ${index * 0.05}s both`,
                      }}
                    >
                      <div className='flex min-w-0 items-center gap-3 sm:gap-4'>
                        <div className='h-11 w-11 rounded-2xl bg-brand/5 flex items-center justify-center text-brand border border-brand/10 group-hover:scale-105 transition-transform'>
                          <BookOpen className='h-5 w-5' />
                        </div>
                        <div className='min-w-0'>
                          <p className='truncate text-sm font-bold text-foreground'>
                            {batch.program.name}
                          </p>
                          <p className='mt-0.5 truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                            {batch.session} • {batch.semester} • {batch.level}L
                          </p>
                        </div>
                      </div>
                      <div className='flex shrink-0 items-center gap-3 sm:gap-6'>
                        <div className='hidden sm:flex flex-col items-end'>
                          <p className='text-[9px] font-bold uppercase text-muted-foreground tracking-tighter'>
                            Status
                          </p>
                          <Badge
                            variant='outline'
                            className={`mt-1 rounded-full px-2 py-0 text-[9px] font-bold border-none ${
                              batch.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-600"
                                : batch.status === "REJECTED"
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {batch.status}
                          </Badge>
                        </div>
                        <div className='h-8 w-8 rounded-full flex items-center justify-center bg-muted/20 group-hover:bg-brand group-hover:text-white transition-all'>
                          <ArrowRight className='h-4 w-4' />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className='p-16 text-center'>
                  <div className='h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4'>
                    <ClipboardList className='h-8 w-8 text-muted-foreground/30' />
                  </div>
                  <p className='text-sm text-muted-foreground font-medium'>
                    No recent uploads found.
                  </p>
                  <Button
                    asChild
                    variant='link'
                    className='mt-2 text-brand h-auto p-0 font-bold'
                  >
                    <Link href='/hod/upload'>
                      Get started with your first upload
                    </Link>
                  </Button>
                </div>
              )}
            </Card>
          </section>

          
        </div>
      </main>
    </div>
  );
}
