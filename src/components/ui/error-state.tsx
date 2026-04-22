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
            <div className="w-full max-w-xl rounded-2xl border border-border-subtle bg-surface-main p-8 text-center shadow-sm modal-enter">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-status-danger-soft text-status-danger">
                    <AlertCircle className="h-6 w-6" />
                </div>
                <h2 className="font-serif text-2xl text-foreground">{title}</h2>
                <p className="mt-2 text-sm text-text-muted">{description}</p>
                {onRetry ? (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-6 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-hover"
                    >
                        Try again
                    </button>
                ) : null}
            </div>
        </div>
    );
}
