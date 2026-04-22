"use client";

import { ErrorState } from "@/components/ui/error-state";

type AdminErrorProps = {
    error: Error & { digest?: string };
    reset: () => void;
};

export default function AdminError({ reset }: AdminErrorProps) {
    return (
        <ErrorState
            title="Unable to load admin page"
            description="The requested admin page could not be loaded. Please retry."
            onRetry={reset}
        />
    );
}


export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <ErrorState
            title="Admin workspace failed to load"
            description="The dashboard route could not finish rendering. Retry to reload the current admin page."
            onRetry={reset}
            ctaLabel="Back to dashboard"
            ctaHref="/admin/dashboard"
        />
    );
}