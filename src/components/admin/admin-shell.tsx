"use client";

import React from "react";
import { useSidebar } from "./sidebar-provider";

interface AdminShellProps {
    sidebar: React.ReactNode;
    children: React.ReactNode;
}

export function AdminShell({ sidebar, children }: AdminShellProps) {
    const { isCollapsed } = useSidebar();

    return (
        <div className="flex min-h-screen bg-background">
            {sidebar}

            <main
                className={`min-h-screen flex-1 transition-[padding] duration-300 ease-in-out ${isCollapsed ? "md:pl-16" : "md:pl-60"
                    }`}
            >
                <div className="relative h-full w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
