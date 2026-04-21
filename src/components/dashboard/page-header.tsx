export function PageHeader() {
    return (
        <header className="dashboard-header relative overflow-hidden rounded-3xl border border-(--border-strong) bg-[linear-gradient(135deg,var(--hero-deep),var(--hero-mid)_52%,var(--hero-accent))] px-6 py-7 text-(--hero-text) shadow-[0_25px_60px_-30px_rgba(2,23,23,0.75)] md:px-8 md:py-9">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.35),transparent_65%)]" />
            <div className="pointer-events-none absolute -bottom-16 left-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(252,211,77,0.28),transparent_70%)]" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-(--hero-kicker)">
                        Result Notification System
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-(--hero-text) sm:text-4xl lg:text-5xl">
                        Parent Result Dispatch Dashboard
                    </h1>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-(--hero-subtle) sm:text-base">
                        Monitor Senate approvals, verify NDPR contact readiness, and trigger
                        secure multi-channel notifications for approved student results.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <a
                        className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
                        href="/admin/batches/upload"
                    >
                        Upload New Batch
                    </a>
                    <a
                        className="rounded-xl border border-amber-200/45 bg-amber-200/15 px-4 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-200/25"
                        href="/admin/batches"
                    >
                        Send Approved Results
                    </a>
                    <div className="rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-xs text-(--hero-subtle) sm:col-span-2">
                        Last SIS sync: 4 mins ago • Next cron pull: 6:00 AM
                    </div>
                </div>
            </div>
        </header>
    );
}
