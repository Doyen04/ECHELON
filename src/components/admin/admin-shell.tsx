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
    <div className="min-h-screen bg-[var(--color-bg)] flex transition-all duration-300">
      {/* Sidebar gets it's own internal width logic, but we need to ensure main respects it */}
      {sidebar}
      
      <main 
        className={`min-h-screen flex-1 transition-all duration-300 ease-in-out ${
          isCollapsed ? "md:pl-16" : "md:pl-16 xl:pl-60"
        }`}
      >
        <div className="h-full w-full relative">
          {children}
        </div>
      </main>
    </div>
  );
}
