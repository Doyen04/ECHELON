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
"use client";

import { ErrorState } from "@/components/ui/state-panels";

export default function ResultsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <ErrorState
            title="Result view unavailable"
            description="The public result page could not load. Try again or return to the registry lookup page."
            onRetry={reset}
            ctaLabel="Open result view"
            ctaHref="/results/view"
        />
    );
}