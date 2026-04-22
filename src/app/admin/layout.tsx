import type { ReactNode } from "react";
import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireSuperAdminSession } from "@/lib/super-admin-session";

type AdminLayoutProps = {
    children: ReactNode;
};

const navItems = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Batches", href: "/admin/batches" },
    { label: "Batch Upload", href: "/admin/batches/upload" },
    { label: "Approvals", href: "/admin/approvals" },
    { label: "Delivery", href: "/admin/delivery" },
    { label: "Students", href: "/admin/students" },
    { label: "Audit", href: "/admin/audit" },
];

export default async function AdminLayout({ children }: AdminLayoutProps) {
    const session = await requireSuperAdminSession();

    return (
        <div className="h-screen bg-background text-foreground">
            <div className="mx-auto grid h-full w-full max-w-400 grid-cols-1 overflow-hidden lg:grid-cols-[260px_1fr]">
                <aside className="border-b border-(--border-subtle) bg-(--surface-strong) lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:overflow-y-auto">
                    <div className="flex h-full min-h-0 flex-col p-5">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--text-muted)">
                                Result System
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                                Super Admin
                            </h2>
                            <p className="mt-2 text-sm text-(--text-secondary)">
                                Control center for approvals, dispatch, and compliance.
                            </p>
                            <p className="mt-3 text-xs text-(--text-muted)">
                                Signed in as {session.user.email}
                            </p>
                        </div>

                        <nav className="mt-6 space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="block rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-(--text-secondary) transition hover:border-(--border-subtle) hover:bg-(--surface-soft) hover:text-foreground"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="mt-auto rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                                Access Scope
                            </p>
                            <p className="mt-2 text-sm text-(--text-secondary)">
                                This workspace is configured for super-admin operations only.
                            </p>
                        </div>
                    </div>
                </aside>

                <div className="min-w-0 overflow-y-auto">
                    <header className="sticky top-0 z-10 border-b border-(--border-subtle) bg-background px-4 py-3 sm:px-6 lg:px-8">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-[0.16em] text-(--text-muted)">
                                    Admin Workspace
                                </p>
                                <h1 className="mt-1 text-lg font-semibold text-foreground">
                                    Parent Result Dispatch Platform
                                </h1>
                            </div>
                            <SignOutButton />
                        </div>
                    </header>

                    <div className="min-h-[calc(100vh-76px)]">{children}</div>
                </div>
            </div>
        </div>
    );
}
