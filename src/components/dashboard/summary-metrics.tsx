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
                    className="dashboard-card group px-5 py-5"
                    style={{ animationDelay: `${index * 90}ms` }}
                >
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
                        {metric.label}
                    </p>
                    <div className="mt-3 flex items-baseline justify-between gap-3">
                        <p className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                            {metric.value}
                        </p>
                        <Badge variant="outline" className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${trendTone[metric.trend]}`}>
                            {metric.change}
                        </Badge>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground/70">{metric.helper}</p>
                </Card>
            ))}
        </section>
    );
}
