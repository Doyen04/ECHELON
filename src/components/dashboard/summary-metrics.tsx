import type { SummaryMetric } from "@/lib/dashboard-data";

const trendTone: Record<SummaryMetric["trend"], string> = {
    up: "text-emerald-700 bg-emerald-100",
    down: "text-rose-700 bg-rose-100",
    steady: "text-slate-700 bg-slate-200",
};

export function SummaryMetrics({ metrics }: { metrics: SummaryMetric[] }) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric, index) => (
                <article
                    key={metric.label}
                    className="dashboard-card group rounded-2xl border border-(--border-subtle) bg-(--surface-strong) px-5 py-5"
                    style={{ animationDelay: `${index * 90}ms` }}
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                        {metric.label}
                    </p>
                    <div className="mt-4 flex items-start justify-between gap-3">
                        <p className="text-3xl font-semibold leading-none tracking-tight text-foreground">
                            {metric.value}
                        </p>
                        <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${trendTone[metric.trend]}`}
                        >
                            {metric.change}
                        </span>
                    </div>
                    <p className="mt-4 text-sm text-(--text-muted)">{metric.helper}</p>
                </article>
            ))}
        </section>
    );
}
