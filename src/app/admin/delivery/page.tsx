"use client";

import Link from "next/link";
import { useApi } from "@/lib/api";
import { DispatchCard } from "@/components/admin/dispatch-card";
import { LoadingState } from "@/components/ui/loading-state";
import { ApiGate } from "@/components/ui/api-gate";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DeliveryPage() {
  const { data, isLoading, error } = useApi<{ dispatches: any[] }>(
    "/api/delivery",
    { immediate: true },
  );

  return (
    <ApiGate
      data={data}
      isLoading={isLoading}
      error={error}
      loadingTitle="Loading delivery dispatches..."
      errorMessage="Failed to load dispatches"
    >
      {(data) => {
        const { dispatches } = data;
        return (
          <main className='dashboard-root min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8'>
            <div className='dashboard-grid-overlay' aria-hidden='true' />
            <Card className='mx-auto w-full max-w-6xl rounded-3xl p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8'>
              <p className='text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)'>
                Delivery Monitoring
              </p>
              <h1 className='mt-2 text-3xl font-semibold tracking-tight text-foreground'>
                Dispatch Activity
              </h1>
              <p className='mt-3 text-sm text-(--text-secondary)'>
                Track each dispatch job and open detail views for status and failed
                sends.
              </p>

              <div className='mt-6 space-y-3'>
                {dispatches.map((dispatch: any) => (
                  <DispatchCard key={dispatch.id} dispatch={dispatch} />
                ))}
                {dispatches.length === 0 ? (
                  <div className='rounded-2xl border border-dashed border-(--border-subtle) p-8 text-sm text-(--text-secondary)'>
                    No dispatches found.
                  </div>
                ) : null}
              </div>
            </Card>
          </main>
        );
      }}
    </ApiGate>
  );
}
