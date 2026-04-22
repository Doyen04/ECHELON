"use client";

import { ErrorState } from "@/components/ui/error-state";

type SignInErrorProps = {
    error: Error & { digest?: string };
    reset: () => void;
};

export default function SignInError({ reset }: SignInErrorProps) {
    return (
        <ErrorState
            title="Sign-in page unavailable"
            description="We could not load the sign-in form. Please try again."
            onRetry={reset}
        />
    );
}