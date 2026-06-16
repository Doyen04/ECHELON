"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    ChevronRight,
    LayoutDashboard,
    LogOut,
    Upload,
    ClipboardList,
    Layers,
} from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { useSidebar } from "@/providers/sidebar-provider";

type NavItem = {
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
};

type HodSidebarProps = {
    email?: string | null;
    name?: string | null;
    role: "hod";
};

const navItems: Array<{ section: string; items: NavItem[] }> = [
    {
        section: "Overview",
        items: [{ label: "Dashboard", href: "/hod/dashboard", icon: LayoutDashboard }],
    },
    {
        section: "Results Management",
        items: [
            { label: "My Batches", href: "/hod/batches", icon: ClipboardList },
            { label: "Upload Result", href: "/hod/upload", icon: Upload },
        ],
    },
];

function initials(name?: string | null, email?: string | null) {
    const source = name?.trim() || email?.trim() || "HOD";
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
}

export function HodSidebar({ email, name, role }: HodSidebarProps) {
    const pathname = usePathname();
    const userInitials = initials(name, email);
    const { isCollapsed, toggleSidebar, isMobileOpen, closeMobileMenu } = useSidebar();

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-50 overflow-visible border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-out 
                ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                ${isCollapsed ? "md:w-16" : "md:w-60"}
                w-60
            `}
        >
            <div className="flex h-full w-full flex-col px-3 py-4">
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="absolute left-full top-16 hidden h-6 w-6 items-center justify-center rounded-none bg-sidebar text-sidebar-foreground opacity-100  transition-colors duration-150 hover:bg-sidebar md:flex z-50"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <ChevronRight className={`h-2.5 w-2.5 transition-transform duration-300 ${isCollapsed ? "" : "rotate-180"}`} />
                </button>

                <div className={`flex gap-3 px-2 transition-all duration-300 group ${isCollapsed ? "flex-col items-center py-2" : "h-16 items-center justify-start"}`}>
                    <div className={`flex shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-white  transition-all duration-300 ${isCollapsed ? "h-10 w-10" : "h-11 w-11"}`}>
                        <Layers className={`${isCollapsed ? "h-5 w-5" : "h-6 w-6"} text-white`} strokeWidth={2.5} />
                    </div>

                    <div className={`min-w-0 transition-all duration-200 ${isCollapsed ? "h-0 w-0 opacity-0 pointer-events-none overflow-hidden" : "w-auto opacity-100"}`}>
                        <h1 className="truncate font-sans text-lg font-bold tracking-tight text-white">HOD Portal</h1>
                    </div>

                    <button
                        onClick={closeMobileMenu}
                        className="absolute top-4 right-4 md:hidden text-white/50 hover:text-white"
                    >
                        <ChevronRight className="h-5 w-5 rotate-180" />
                    </button>
                </div>

                <div className="mt-3 border-t border-white/10 pt-3 flex-1 overflow-y-auto">
                    {navItems.map((group) => (
                        <div key={group.section} className="mb-4">
                            <p className={`px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 ${isCollapsed ? "hidden" : "block"}`}>
                                {group.section}
                            </p>
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={closeMobileMenu}
                                            className={`flex h-10 items-center rounded-lg px-3 text-sm transition-all duration-200 relative group/link ${isCollapsed ? "justify-center" : "gap-3"} ${active ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}
                                        >
                                            <Icon className={`h-5 w-5 shrink-0 ${active ? "text-sidebar-primary" : "text-sidebar-foreground/40"}`} />
                                            {!isCollapsed && <span className="truncate font-medium">{item.label}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto shrink-0 px-1 pb-1">
                    <div className={`text-white/90 transition-all duration-300 ${isCollapsed ? "p-1" : "p-2"}`}>
                        <div className={`flex ${isCollapsed ? "flex-col items-center gap-2" : "items-center gap-3.5"}`}>
                            <div className="relative flex shrink-0 items-center justify-center">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[12px] font-bold text-sidebar-foreground ">
                                     {userInitials}
                                 </div>
                                 <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar bg-emerald-500 " />
                            </div>
 
                            {!isCollapsed && (
                                <div className="min-w-0 flex-1 opacity-100 transition-all duration-300">
                                    <p className="truncate text-sm font-semibold tracking-tight text-white leading-tight">{name ?? "HOD"}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="inline-flex rounded-full bg-sidebar-primary/20 border border-sidebar-primary/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sidebar-primary ">
                                            HOD
                                        </span>
                                    </div>
                                </div>
                            )}
 
                            <SignOutButton
                                compact
                                className={`flex items-center justify-center rounded-full text-sidebar-foreground/50 transition-all duration-200 hover:bg-sidebar-accent hover:text-white active:scale-95 ${isCollapsed ? "h-9 w-9" : "ml-auto h-9 w-9"}`}
                            >
                                <LogOut className="h-4 w-4" />
                            </SignOutButton>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
