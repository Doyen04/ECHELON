import type { ReactNode } from "react";

type SectionFrameProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionFrame({
  title,
  description,
  action,
  children,
  className,
}: SectionFrameProps) {
  return (
    <section
      className={`dashboard-section rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-strong)] p-6 shadow-[0_20px_50px_-35px_rgba(2,23,23,0.55)] ${className ?? ""}`}
    >
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </header>
      {children}
    </section>
  );
}
