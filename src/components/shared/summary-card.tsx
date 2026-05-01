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
        "flex flex-col justify-between rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-5 shadow-sm",
        className
      )}
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
        {title}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "text-3xl font-serif text-foreground",
            color
          )}
        >
          {value}
        </span>
        {subvalue && (
          <span className="text-sm font-medium text-text-muted">
            {subvalue}
          </span>
        )}
      </div>
    </article>
  );
}
