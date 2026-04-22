"use client";

import { ErrorState } from "@/components/ui/error-state";

type ResultsErrorProps = {
    error: Error & { digest?: string };
    reset: () => void;
};

export default function ResultsError({ reset }: ResultsErrorProps) {
    return (
        <ErrorState
            title="Result page error"
            description="We could not load this result view."
            onRetry={reset}
        />
    );
}