import Link from "next/link";
import type { ReactNode } from "react";

type BreadcrumbItem = {
    label: string;
    href?: string;
};

type PageHeaderProps = {
    title: string;
    subtitle?: string;
    breadcrumbs?: BreadcrumbItem[];
    action?: ReactNode;
};

export function PageHeader({ title, subtitle, breadcrumbs, action }: PageHeaderProps) {
    return (
        <header className="sticky top-0 z-20 border-b border-border-subtle bg-surface-main/95 backdrop-blur-sm">
            <div className="flex h-16 items-center justify-between gap-4 px-6 lg:px-8">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-(--text-secondary)">
                        {breadcrumbs?.map((crumb, index) => (
                            <span key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                                {crumb.href ? (
                                    <Link href={crumb.href} className="transition hover:text-(--text-primary)">
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="text-(--text-muted)">{crumb.label}</span>
                                )}
                                {index < (breadcrumbs?.length ?? 0) - 1 ? <span className="text-(--text-muted)">/</span> : null}
                            </span>
                        ))}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3">
                        <h1 className="truncate font-serif text-[20px] leading-none text-(--text-primary)">{title}</h1>
                    </div>
                    {subtitle ? <p className="mt-1 text-xs text-(--text-secondary)">{subtitle}</p> : null}
                </div>

                {action ? <div className="shrink-0">{action}</div> : null}
            </div>
        </header>
    );
}
