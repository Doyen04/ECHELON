"use client";

import { ErrorState } from "@/components/shared/error-state";

type ResultViewErrorProps = {
    error: Error & { digest?: string };
    reset: () => void;
};

export default function ResultViewError({ reset }: ResultViewErrorProps) {
    return (
        <ErrorState
            title="Unable to load result details"
            description="This result link could not be processed right now."
            onRetry={reset}
        />
    );
}
