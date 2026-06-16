"use client";

import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { DispatchCard } from "@/components/features/admin/dispatch-card";
import { LoadingState } from "@/components/shared/loading-state";
import { ApiGate } from "@/components/shared/api-gate";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { PageHeader } from "@/components/shared/page-header";

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
          <div className='flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-background'>
            <PageHeader
              title='Dispatch Activity'
              
            />

            <main className='mx-auto w-full max-w-7xl min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
              <div className='space-y-4'>
                {dispatches.map((dispatch: any) => (
                  <DispatchCard key={dispatch.id} dispatch={dispatch} />
                ))}
                {dispatches.length === 0 && (
                  <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <p className='text-sm text-muted-foreground'>
                      No delivery dispatches found.
                    </p>
                  </Card>
                )}
              </div>
            </main>
          </div>
        );
      }}
    </ApiGate>
  );
}
