"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

type ErrorStateProps = {
    title?: string;
    description?: string;
    onRetry?: () => void;
};

export function ErrorState({
    title = "Something went wrong",
    description = "We could not load this page. Please try again.",
    onRetry,
}: ErrorStateProps) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="w-full max-w-xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-sm modal-enter">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
                    <AlertCircle className="h-6 w-6" />
                </div>
                <h2 className="font-serif text-2xl text-[var(--color-text-primary)]">{title}</h2>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{description}</p>
                {onRetry ? (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-6 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
                    >
                        Try again
                    </button>
                ) : null}
            </div>
        </div>
    );
}
