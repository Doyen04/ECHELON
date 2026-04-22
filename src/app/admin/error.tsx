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