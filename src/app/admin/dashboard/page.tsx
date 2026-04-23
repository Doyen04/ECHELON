import type { Metadata } from "next";
import Link from "next/link";

import { ApprovalPipelineTable, DeliveryChannels, DispatchQueuePanel, PageHeader, RecentActivity, SummaryMetrics } from "@/components/dashboard";
import { getDashboardViewData } from "@/lib/dashboard-queries";

export const metadata: Metadata = {
    title: "Dashboard",
    description: "Operational overview of result review and parent delivery.",
};

export default async function DashboardPage() {
    const data = await getDashboardViewData();

    return (
        <main className="dashboard-root min-h-screen bg-background">
            <PageHeader
                title="Dashboard"
                breadcrumbs="2024/2025 • First Semester"
                action={
                    <Link
                        href="/admin/batches/upload"
                        className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-hover"
                    >
                        Upload Batch
                    </Link>
                }
            />

            <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <SummaryMetrics metrics={data.summaryMetrics} />

                <div className="grid gap-8 xl:grid-cols-[1.3fr_.7fr]">
                    <ApprovalPipelineTable batches={data.approvalBatches} />
                    <DeliveryChannels channels={data.channelDelivery} />
                </div>

                <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
                    <DispatchQueuePanel queue={data.dispatchQueue} />
                    <RecentActivity events={data.recentActivity} />
                </div>
            </div>
        </main>
    );
}