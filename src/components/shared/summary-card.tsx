import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string | number;
  subvalue?: string | number;
  color?: string;
  className?: string;
}

export function SummaryCard({
  title,
  value,
  subvalue,
  color,
  className,
}: SummaryCardProps) {
  return (
    <article
      className={cn(
        "flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "text-2xl font-bold text-foreground tracking-tight",
            color
          )}
        >
          {value}
        </span>
        {subvalue && (
          <span className="text-xs font-semibold text-muted-foreground">
            {subvalue}
          </span>
        )}
      </div>
    </article>
  );
}
