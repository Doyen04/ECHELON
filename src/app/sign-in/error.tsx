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
"use client";

import { ErrorState } from "@/components/ui/state-panels";

export default function SignInError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <ErrorState
            title="Sign-in page failed to load"
            description="The login screen could not finish rendering. Retry to continue or go back to the home page."
            onRetry={reset}
            ctaLabel="Home"
            ctaHref="/"
        />
    );
}