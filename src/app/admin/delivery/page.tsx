import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/db";
import { relativeTimeFromNow } from "@/lib/admin-format";

export const metadata: Metadata = {
    title: "Delivery",
    description: "Notification delivery tracking and retry controls.",
};

export const dynamic = "force-dynamic";

export default async function DeliveryPage() {
    const db = prisma as any;

    const dispatches = await db.notificationDispatch.findMany({
        orderBy: { triggeredAt: "desc" },
        take: 25,
        include: {
            batch: { select: { department: true, session: true, semester: true } },
            triggeredBy: { select: { name: true } },
            _count: { select: { notificationLogs: true } },
        },
    });

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-background">
            <PageHeader
                title="Delivery"
                breadcrumbs={
                    <div className="flex items-center gap-1">
                        <Link href="/admin/dashboard" className="transition-colors hover:text-foreground">
                            Dashboard
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">Dispatch Activity</span>
                    </div>
                }
            />

            <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Track each dispatch job and open detail views for status and failed sends.
                        </p>
                    </div>
                    <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
                        {dispatches.length} dispatches
                    </Badge>
                </div>

                <div className="space-y-3">
                    {dispatches.map((dispatch: any, index: number) => (
                        <Card
                            key={dispatch.id}
                            className="dashboard-card rounded-xl px-5 py-4 shadow-sm transition-colors hover:border-brand/30"
                            style={{ animationDelay: `${index * 40}ms` }}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-foreground">
                                        {dispatch.batch.department}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {dispatch.batch.session} • {String(dispatch.batch.semester).toLowerCase()} • <span className="font-mono">{dispatch.id}</span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Triggered by {dispatch.triggeredBy?.name ?? "System"} • {relativeTimeFromNow(dispatch.triggeredAt)}
                                    </p>
                                </div>
                                <Button asChild size="sm" className="rounded-full">
                                    <Link href={`/admin/delivery/${dispatch.id}`}>Open Logs</Link>
                                </Button>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium">
                                <span className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-muted-foreground">
                                    Success <span className="text-foreground">{dispatch.sentCount ?? 0}</span>
                                </span>
                                <span className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-muted-foreground">
                                    Failed <span className="text-foreground">{dispatch.failedCount ?? 0}</span>
                                </span>
                                <span className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-muted-foreground">
                                    Total <span className="text-foreground">{dispatch.totalCount ?? dispatch._count.notificationLogs}</span>
                                </span>
                                <span className="ml-1 text-muted-foreground">
                                    {dispatch._count.notificationLogs} log(s)
                                </span>
                                <Badge variant="outline" className="rounded-full text-[11px]">Dispatch</Badge>
                            </div>
                        </Card>
                    ))}
                    {dispatches.length === 0 ? (
                        <Card className="rounded-xl border-dashed p-8 text-sm text-muted-foreground shadow-sm">
                            No dispatches found.
                        </Card>
                    ) : null}
                </div>
            </main>
        </div>
    );
}
