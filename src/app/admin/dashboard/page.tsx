import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { ApprovalPipelineTable, DeliveryChannels, DispatchQueuePanel, RecentActivity, SummaryMetrics } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
                action={
                    <Button asChild className="rounded-full shadow-sm">
                        <Link href="/admin/batches/upload" className="inline-flex items-center gap-2">
                            Upload Batch
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                }
            />

            <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <Card className="overflow-hidden border-border/70 bg-[radial-gradient(circle_at_top_right,rgba(29,75,143,0.10),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.94),rgba(247,246,243,0.92))] shadow-[0_28px_80px_-56px_rgba(15,23,42,0.45)]">
                    <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.5fr_.9fr] lg:items-end lg:p-8">
                        <div className="space-y-4">
                            <Badge variant="outline" className="inline-flex rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Operational overview
                            </Badge>
                            <div className="max-w-2xl space-y-3">
                                <h2 className="font-serif text-3xl leading-tight text-foreground sm:text-4xl">
                                    Keep approvals, dispatch, and compliance in one clear command center.
                                </h2>
                                <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                                    Monitor batch readiness, delivery health, and audit activity without jumping between screens.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Approval focus</p>
                                <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Live</p>
                            </div>
                            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Delivery channels</p>
                                <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">3</p>
                            </div>
                            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Audit trail</p>
                                <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Ready</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

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