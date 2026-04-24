import type { SummaryMetric } from "@/lib/dashboard-data";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const trendTone: Record<SummaryMetric["trend"], string> = {
    up: "border-emerald-200 bg-emerald-50 text-emerald-700",
    down: "border-rose-200 bg-rose-50 text-rose-700",
    steady: "border-border bg-secondary text-secondary-foreground",
};

export function SummaryMetrics({ metrics }: { metrics: SummaryMetric[] }) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric, index) => (
                <Card
                    key={metric.label}
                    className="dashboard-card group px-5 py-5 shadow-sm"
                    style={{ animationDelay: `${index * 90}ms` }}
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                        {metric.label}
                    </p>
                    <div className="mt-4 flex items-start justify-between gap-3">
                        <p className="text-3xl font-semibold leading-none tracking-tight text-foreground">
                            {metric.value}
                        </p>
                        <Badge variant="outline" className={`rounded-full px-2.5 py-1 text-xs font-semibold ${trendTone[metric.trend]}`}>
                            {metric.change}
                        </Badge>
                    </div>
                    <p className="mt-4 text-sm text-(--text-muted)">{metric.helper}</p>
                </Card>
            ))}
        </section>
    );
}
