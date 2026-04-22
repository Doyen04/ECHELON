"use client";

import { signOut } from "next-auth/react";

type SignOutButtonProps = {
    compact?: boolean;
};

export function SignOutButton({ compact }: SignOutButtonProps) {
    return (
        <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className={compact ? "text-xs font-medium text-white/70 transition hover:text-white" : "rounded-lg border border-(--border-subtle) px-3 py-1.5 text-xs font-medium text-(--text-secondary) transition hover:border-(--border-strong) hover:text-foreground"}
        >
            Sign Out
        </button>
    );
}
