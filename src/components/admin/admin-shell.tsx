"use client";

import React from "react";
import { Menu } from "lucide-react";
import { useSidebar } from "./sidebar-provider";

interface AdminShellProps {
    sidebar: React.ReactNode;
    children: React.ReactNode;
}

export function AdminShell({ sidebar, children }: AdminShellProps) {
    const { isCollapsed, isMobileOpen, toggleMobileMenu, closeMobileMenu } = useSidebar();

    return (
        <div className="flex min-h-screen bg-background">
            {/* Mobile Header */}
            <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-brand px-4 text-white md:hidden">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/12 text-xs font-semibold text-white">
                        RN
                    </div>
                    <span className="font-serif text-lg">Echelon</span>
                </div>
                <button
                    onClick={toggleMobileMenu}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    aria-label="Toggle Menu"
                >
                    <Menu className="h-6 w-6" />
                </button>
            </header>

            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
                    onClick={closeMobileMenu}
                />
            )}

            {sidebar}

            <main
                className={`min-h-screen flex-1 transition-[padding] duration-300 ease-in-out pt-16 md:pt-0 ${isCollapsed ? "md:pl-16" : "md:pl-60"
                    }`}
            >
                <div className="relative h-full w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
