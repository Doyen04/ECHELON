"use client";

import React from "react";
import type { DashboardViewData } from "@/lib/dashboard-queries";

import {
  DeliveryChannels,
  DispatchQueuePanel,
  RecentActivity,
  SummaryMetrics,
} from "./index";
import { NotificationPanelTrigger } from "./notification-panel-trigger";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Props = {
  data: DashboardViewData;
};

export default function DashboardClient({ data }: Props) {
  return (
    <div className='flex h-full w-full flex-col overflow-y-auto bg-background'>
      <PageHeader
        title='Dashboard'
        breadcrumbs={
          <div className='flex items-center gap-1'>
            <span>2024/2025</span>
            <span>/</span>
            <span className='text-(--text-muted)'>First Semester</span>
          </div>
        }
        action={<NotificationPanelTrigger notifications={data.notifications} />}
      />

      <div className='mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
        <SummaryMetrics metrics={data.summaryMetrics} />

        <div className='grid gap-6 xl:grid-cols-[0.9fr_1.1fr]'>
          <DeliveryChannels channels={data.channelDelivery} />

          <Card className='relative overflow-hidden border-none bg-[#1D4B8F] p-8 text-white'>
            <div className='relative z-10'>
              <p className='text-xs font-bold uppercase tracking-[0.2em] text-blue-100/70'>
                Operational Action
              </p>
              <h2 className='mt-3 font-serif text-3xl font-semibold leading-tight'>
                Upload New
                <br />
                Batch Data
              </h2>
              <p className='mt-4 max-w-[280px] text-sm leading-relaxed text-blue-50/80'>
                Seamlessly import student results and trigger automated
                multi-channel delivery.
              </p>
              <div className='mt-8'>
                <Button
                  asChild
                  className='rounded-full bg-white px-6 text-[#1D4B8F] hover:bg-blue-50'
                >
                  <Link
                    href='/admin/batches/upload'
                    className='inline-flex items-center gap-2'
                  >
                    Get Started
                    <ArrowRight className='h-4 w-4' />
                  </Link>
                </Button>
              </div>
            </div>
            {/* Decorative element */}
            <div className='absolute -right-8 -top-8 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl' />
            <div className='absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-blue-900/20 blur-3xl' />
          </Card>
        </div>

        <div className='grid gap-6 xl:grid-cols-[1fr_1fr]'>
          <DispatchQueuePanel queue={data.dispatchQueue} />
          <RecentActivity events={data.recentActivity} />
        </div>
      </div>
    </div>
  );
}
