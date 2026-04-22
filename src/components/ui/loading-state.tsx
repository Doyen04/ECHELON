"use client";

import React from "react";

type LoadingStateProps = {
    title?: string;
    rows?: number;
};

export function LoadingState({ title = "Loading...", rows = 5 }: LoadingStateProps) {
    return (
        <div className="dashboard-root min-h-[50vh] p-6 md:p-8">
            <div className="mx-auto w-full max-w-[1200px] space-y-5">
                <div className="h-7 w-60 rounded-md skeleton" aria-hidden="true" />
                <p className="text-sm text-text-muted">{title}</p>

                <section className="rounded-xl border border-border-subtle bg-surface-main p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="h-24 rounded-lg skeleton" aria-hidden="true" />
                        <div className="h-24 rounded-lg skeleton" aria-hidden="true" />
                        <div className="h-24 rounded-lg skeleton" aria-hidden="true" />
                        <div className="h-24 rounded-lg skeleton" aria-hidden="true" />
                    </div>
                </section>

                <section className="rounded-xl border border-border-subtle bg-surface-main p-4">
                    <div className="space-y-3">
                        {Array.from({ length: rows }).map((_, index) => (
                            <div key={index} className="h-12 rounded-md skeleton" aria-hidden="true" />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
