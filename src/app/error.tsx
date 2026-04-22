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
