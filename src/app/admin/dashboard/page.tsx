import type { Metadata } from "next";

import {
    ApprovalPipelineTable,
    DeliveryChannels,
    DispatchQueuePanel,
    PageHeader,
    QuickActions,
    RecentActivity,
    SummaryMetrics,
} from "@/components/dashboard";
import { getDashboardViewData } from "@/lib/dashboard-queries";

export const metadata: Metadata = {
    title: "Admin Dashboard | Result Notification System",
    description:
        "Operational dashboard for senate approvals, parent result dispatch, and delivery monitoring.",
};

export default async function AdminDashboardPage() {
    const data = await getDashboardViewData();

    return (
        <main className="dashboard-root min-h-screen bg-background pb-10 pt-6 text-foreground sm:pt-8">
            <div className="dashboard-grid-overlay" aria-hidden="true" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
                <PageHeader />

                <SummaryMetrics metrics={data.summaryMetrics} />

                <section className="grid gap-6 xl:grid-cols-12">
                    <div className="space-y-6 xl:col-span-8">
                        <ApprovalPipelineTable batches={data.approvalBatches} />
                        <DispatchQueuePanel queue={data.dispatchQueue} />
                    </div>

                    <div className="space-y-6 xl:col-span-4">
                        <QuickActions />
                        <DeliveryChannels channels={data.channelDelivery} />
                    </div>
                </section>

                <RecentActivity events={data.recentActivity} />
            </div>
        </main>
    );
}
