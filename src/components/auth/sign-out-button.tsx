"use client";

import { signOut } from "next-auth/react";
import { ReactNode } from "react";

type SignOutButtonProps = {
    compact?: boolean;
    children?: ReactNode;
    className?: string;
    title?: string;
};

export function SignOutButton({ compact, children, className, title }: SignOutButtonProps) {
    return (
        <button
            type="button"
            title={title}
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className={className || (compact ? "text-xs font-medium text-white/70 transition hover:text-white" : "rounded-lg border border-(--border-subtle) px-3 py-1.5 text-xs font-medium text-(--text-secondary) transition hover:border-(--border-strong) hover:text-foreground")}
        >
            {children || "Sign Out"}
        </button>
    );
}
