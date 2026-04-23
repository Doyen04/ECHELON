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
            className={`dashboard-section rounded-3xl border border-(--border-subtle) bg-(--surface-strong) p-6 ${className ?? ""}`}
        >
            <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                        {title}
                    </h2>
                    {description ? (
                        <p className="mt-1 text-sm text-(--text-muted)">{description}</p>
                    ) : null}
                </div>
                {action ? <div>{action}</div> : null}
            </header>
            {children}
        </section>
    );
}
