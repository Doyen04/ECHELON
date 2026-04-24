import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { ApprovalPipelineTable, DeliveryChannels, DispatchQueuePanel, RecentActivity, SummaryMetrics } from "@/components/dashboard";
import { NotificationPanelTrigger } from "@/components/dashboard/notification-panel-trigger";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getDashboardViewData } from "@/lib/dashboard-queries";

export const metadata: Metadata = {
    title: "Dashboard",
    description: "Operational overview of result review and parent delivery.",
};

export default async function DashboardPage() {
    const data = await getDashboardViewData();

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-background">
            <PageHeader
                title="Dashboard"
                breadcrumbs={
                    <div className="flex items-center gap-1">
                        <span>2024/2025</span>
                        <span>/</span>
                        <span className="text-(--text-muted)">First Semester</span>
                    </div>
                }
                action={<NotificationPanelTrigger notifications={data.notifications} />}
            />

            <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <div className="flex justify-end">
                    <Button asChild className="rounded-full shadow-sm">
                        <Link href="/admin/batches/upload" className="inline-flex items-center gap-2">
                            Upload Batch
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                {data.notifications.length > 0 ? (
                    <Alert variant="destructive" className="dashboard-section">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Email delivery attention required</AlertTitle>
                        <AlertDescription>
                            <p>{data.notifications[0].detail}</p>
                            {data.notifications.length > 1 ? (
                                <p className="mt-1">+{data.notifications.length - 1} more alert{data.notifications.length - 1 > 1 ? "s" : ""} in notifications panel.</p>
                            ) : null}
                        </AlertDescription>
                    </Alert>
                ) : null}

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
        </div>
    );
}