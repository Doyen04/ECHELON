import type { SummaryMetric } from "@/lib/dashboard-data";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const trendConfig: Record<SummaryMetric["trend"], { className: string; icon: React.ReactNode }> = {
    up: {
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: <TrendingUp className="h-3 w-3" />,
    },
    down: {
        className: "border-rose-200 bg-rose-50 text-rose-700",
        icon: <TrendingDown className="h-3 w-3" />,
    },
    steady: {
        className: "border-border bg-secondary text-secondary-foreground",
        icon: <Minus className="h-3 w-3" />,
    },
};

export function SummaryMetrics({ metrics }: { metrics: SummaryMetric[] }) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric, index) => {
                const config = trendConfig[metric.trend];

                return (
                    <Card
                        key={metric.label}
                        className="dashboard-card group relative overflow-hidden px-5 py-5 shadow-sm"
                        style={{ animationDelay: `${index * 90}ms` }}
                    >
                        {/* Decorative accent line */}
                        <div className="pointer-events-none absolute left-0 top-0 h-full w-1 rounded-l-3xl bg-gradient-to-b from-brand/40 via-brand/10 to-transparent" />

                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {metric.label}
                        </p>
                        <div className="mt-4 flex items-baseline justify-between gap-3">
                            <p className="text-3xl font-bold leading-none tracking-tight text-foreground">
                                {metric.value}
                            </p>
                            <Badge variant="outline" className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}>
                                {config.icon}
                                {metric.change}
                            </Badge>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">{metric.helper}</p>
                    </Card>
                );
            })}
        </section>
    );
}
