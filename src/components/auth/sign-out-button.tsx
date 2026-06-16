"use client";

import { signOut } from "next-auth/react";
import { ReactNode } from "react";

import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
    compact?: boolean;
    children?: ReactNode;
    className?: string;
    title?: string;
};

export function SignOutButton({ compact, children, className, title }: SignOutButtonProps) {
    return (
        <Button
            type="button"
            title={title}
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            variant={compact ? "ghost" : "outline"}
            size={compact ? "icon-sm" : "sm"}
            className={className || (compact ? "text-white/70 hover:bg-white/10 hover:text-white" : "rounded-full")}
        >
            {children || "Sign Out"}
        </Button>
    );
}
