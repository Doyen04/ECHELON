import Link from "next/link";

type EmptyStateProps = {
    title: string;
    description: string;
    ctaLabel?: string;
    ctaHref?: string;
};

export function EmptyState({ title, description, ctaLabel, ctaHref }: EmptyStateProps) {
    return (
        <div className="rounded-3xl border border-dashed border-(--color-border) bg-[var(--color-surface-2)] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-[var(--color-accent)] shadow-sm">
                •
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-(--text-secondary)">{description}</p>
            {ctaLabel && ctaHref ? (
                <Link
                    href={ctaHref}
                    className="mt-5 inline-flex rounded-xl bg-(--accent-strong) px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-(--hero-mid)"
                >
                    {ctaLabel}
                </Link>
            ) : null}
        </div>
    );
}
