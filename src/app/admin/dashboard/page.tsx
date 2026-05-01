import type { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    ArrowUpRight,
    Upload,
    BarChart3,
    TrendingUp,
    Users,
    Bell,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Activity,
} from "lucide-react";

import { DeliveryChannels, DispatchQueuePanel, RecentActivity, SummaryMetrics } from "@/components/dashboard";
import { NotificationPanelTrigger } from "@/components/dashboard/notification-panel-trigger";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getDashboardViewData } from "@/lib/dashboard-queries";

export const metadata: Metadata = {
    title: "Dashboard",
    description: "Operational overview of result review and parent delivery.",
};

export default async function DashboardPage() {
    const data = await getDashboardViewData();

    // Parse key numbers from the metrics
    const pendingReviews = data.summaryMetrics[0]?.value ?? "0";
    const approvedCount = data.summaryMetrics[1]?.value ?? "0";
    const deliveryRate = data.summaryMetrics[2]?.value ?? "0%";

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-background">
            <PageHeader
                title="Dashboard"
                breadcrumbs={
                    <div className="flex items-center gap-1">
                        <span>2024/2025</span>
                        <span>/</span>
                        <span className="text-muted-foreground">First Semester</span>
                    </div>
                }
                action={<NotificationPanelTrigger notifications={data.notifications} />}
            />

            <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                {/* ── Hero Stats Row ── */}
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <HeroStatCard
                        icon={<Clock className="h-5 w-5" />}
                        iconBg="bg-amber-500/10 text-amber-600"
                        label="Pending Reviews"
                        value={pendingReviews}
                        change={data.summaryMetrics[0]?.change ?? "Live"}
                        trend={data.summaryMetrics[0]?.trend ?? "steady"}
                        helper={data.summaryMetrics[0]?.helper ?? "Across active batches"}
                        href="/admin/approvals"
                        delay={0}
                    />
                    <HeroStatCard
                        icon={<CheckCircle2 className="h-5 w-5" />}
                        iconBg="bg-emerald-500/10 text-emerald-600"
                        label="Approved"
                        value={approvedCount}
                        change={data.summaryMetrics[1]?.change ?? "Live"}
                        trend={data.summaryMetrics[1]?.trend ?? "steady"}
                        helper={data.summaryMetrics[1]?.helper ?? "Ready for dispatch"}
                        href="/admin/batches"
                        delay={80}
                    />
                    <HeroStatCard
                        icon={<TrendingUp className="h-5 w-5" />}
                        iconBg="bg-blue-500/10 text-blue-600"
                        label="Delivery Rate"
                        value={deliveryRate}
                        change={data.summaryMetrics[2]?.change ?? "24h"}
                        trend={data.summaryMetrics[2]?.trend ?? "steady"}
                        helper={data.summaryMetrics[2]?.helper ?? "Notification success"}
                        href="/admin/delivery"
                        delay={160}
                    />
                    <HeroStatCard
                        icon={<Users className="h-5 w-5" />}
                        iconBg="bg-violet-500/10 text-violet-600"
                        label="Contacts"
                        value="—"
                        change="Live"
                        trend="steady"
                        helper="Guardian contacts on file"
                        href="/admin/contacts"
                        delay={240}
                    />
                </section>

                {/* ── Quick Actions + Upload ── */}
                <section className="grid gap-4 lg:grid-cols-3">
                    <QuickActionCard
                        icon={<Upload className="h-5 w-5" />}
                        iconBg="bg-brand/10 text-brand"
                        title="Upload Batch"
                        description="Import student results from CSV and trigger review"
                        href="/admin/batches/upload"
                        cta="Start Upload"
                    />
                    <QuickActionCard
                        icon={<BarChart3 className="h-5 w-5" />}
                        iconBg="bg-teal-500/10 text-teal-600"
                        title="Review Queue"
                        description="Approve or reject pending result batches"
                        href="/admin/approvals"
                        cta="Open Queue"
                    />
                    <QuickActionCard
                        icon={<Activity className="h-5 w-5" />}
                        iconBg="bg-orange-500/10 text-orange-600"
                        title="Audit Log"
                        description="View immutable action history and compliance reports"
                        href="/admin/audit"
                        cta="View Log"
                    />
                </section>

                {/* ── Analytics Row (Delivery + Dispatch) ── */}
                <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <DeliveryChannels channels={data.channelDelivery} />
                    <DispatchQueuePanel queue={data.dispatchQueue} />
                </section>

                {/* ── Activity Feed ── */}
                <section>
                    <RecentActivity events={data.recentActivity} />
                </section>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Hero Stat Card                                                     */
/* ------------------------------------------------------------------ */

type TrendDirection = "up" | "down" | "steady";

function HeroStatCard({
    icon,
    iconBg,
    label,
    value,
    change,
    trend,
    helper,
    href,
    delay,
}: {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string;
    change: string;
    trend: TrendDirection;
    helper: string;
    href: string;
    delay: number;
}) {
    const trendColor =
        trend === "up"
            ? "text-emerald-600 bg-emerald-50 border-emerald-200"
            : trend === "down"
                ? "text-rose-600 bg-rose-50 border-rose-200"
                : "text-muted-foreground bg-muted border-border";

    return (
        <Link href={href}>
            <Card
                className="dashboard-card group relative overflow-hidden px-5 py-5 shadow-sm transition-all hover:border-brand/40 hover:shadow-md"
                style={{ animationDelay: `${delay}ms` }}
            >
                {/* Decorative corner gradient */}
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-brand/8 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="flex items-center justify-between">
                    <div className={`inline-flex rounded-xl p-2.5 ${iconBg}`}>
                        {icon}
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-text-muted opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>

                <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {label}
                    </p>
                    <div className="mt-2 flex items-baseline gap-2.5">
                        <p className="text-3xl font-bold tracking-tight text-foreground">
                            {value}
                        </p>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${trendColor}`}>
                            {change}
                        </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
                </div>
            </Card>
        </Link>
    );
}

/* ------------------------------------------------------------------ */
/*  Quick Action Card                                                  */
/* ------------------------------------------------------------------ */

function QuickActionCard({
    icon,
    iconBg,
    title,
    description,
    href,
    cta,
}: {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    description: string;
    href: string;
    cta: string;
}) {
    return (
        <Card className="dashboard-section group relative overflow-hidden border border-border/70 p-5 shadow-sm transition-all hover:border-brand/30 hover:shadow-md">
            {/* Subtle gradient on hover */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/3 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="relative">
                <div className={`inline-flex rounded-xl p-2.5 ${iconBg}`}>
                    {icon}
                </div>
                <h3 className="mt-3 font-serif text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
                <div className="mt-4">
                    <Button asChild size="sm" className="rounded-full shadow-sm">
                        <Link href={href} className="inline-flex items-center gap-2">
                            {cta}
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </Card>
    );
}