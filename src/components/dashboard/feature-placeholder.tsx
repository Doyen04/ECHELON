import Link from "next/link";

type FeaturePlaceholderProps = {
    title: string;
    description: string;
};

export function FeaturePlaceholder({ title, description }: FeaturePlaceholderProps) {
    return (
        <main className="dashboard-root min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="dashboard-grid-overlay" aria-hidden="true" />

            <section className="mx-auto w-full max-w-3xl rounded-3xl border border-(--border-subtle) bg-(--surface-strong) p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                    Admin Module
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {title}
                </h1>
                <p className="mt-4 text-base leading-7 text-(--text-secondary)">
                    {description}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                        href="/admin/dashboard"
                        className="rounded-xl border border-(--border-strong) px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-(--surface-muted)"
                    >
                        Back to Dashboard
                    </Link>
                    <Link
                        href="/admin/dashboard"
                        className="rounded-xl bg-[linear-gradient(120deg,var(--accent-strong),var(--accent-soft))] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                    >
                        Continue Setup
                    </Link>
                </div>
            </section>
        </main>
    );
}
