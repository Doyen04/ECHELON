"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/sign-in" })}
      className="rounded-lg border border-(--border-subtle) px-3 py-1.5 text-xs font-medium text-(--text-secondary) transition hover:border-(--border-strong) hover:text-foreground"
    >
      Sign Out
    </button>
  );
}
