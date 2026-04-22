"use client";

import { ErrorState } from "@/components/ui/error-state";

type AppErrorProps = {
    error: Error & { digest?: string };
    reset: () => void;
};

export default function AppError({ reset }: AppErrorProps) {
    return (
        <ErrorState
            title="Application error"
            description="An unexpected error occurred while loading the app shell."
            onRetry={reset}
        />
    );
}
"use client";

import { ErrorState } from "@/components/ui/state-panels";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <ErrorState
            title="Something went wrong"
            description="The application encountered an unexpected error. You can try again or return to the home page."
            onRetry={reset}
