"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BookOpen,
    ChevronRight,
    LayoutDashboard,
    LogOut,
    Menu,
    Send,
    Settings,
    ShieldCheck,
    Upload,
    Users,
    ClipboardList,
    Layers,
} from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { useSidebar } from "@/components/admin/sidebar-provider";

type NavItem = {
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
    roles?: Array<"super_admin">;
};

type AdminSidebarProps = {
    email?: string | null;
    name?: string | null;
    role: "super_admin";
};

const navItems: Array<{ section: string; items: NavItem[] }> = [
    {
        section: "Overview",
        items: [{ label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard }],
    },
    {
        section: "Results",
        items: [
            { label: "Result Batches", href: "/admin/batches", icon: ClipboardList },
            { label: "Upload Batch", href: "/admin/batches/upload", icon: Upload },
            { label: "Approvals", href: "/admin/approvals", icon: ShieldCheck },
        ],
    },
    {
        section: "Dispatch",
        items: [{ label: "Delivery Logs", href: "/admin/delivery", icon: Send }],
    },
    {
        section: "Admin",
        items: [
            { label: "Students", href: "/admin/students", icon: Users },
            { label: "Audit Log", href: "/admin/audit", icon: BookOpen },
            { label: "Settings", href: "/admin/settings", icon: Settings },
        ],
    },
];

function initials(name?: string | null, email?: string | null) {
    const source = name?.trim() || email?.trim() || "Echelon";
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
}

export function AdminSidebar({ email, name, role }: AdminSidebarProps) {
    const pathname = usePathname();
    const userInitials = initials(name, email);
    const { isCollapsed, toggleSidebar, isMobileOpen, closeMobileMenu } = useSidebar();

    const roleLabel = role === "super_admin" ? "Super Admin" : role;

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-50 overflow-hidden border-r border-white/10 bg-brand text-white transition-all duration-300 ease-out 
                ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                ${isCollapsed ? "md:w-16" : "md:w-60"}
                w-60
            `}
        >
            <div className="flex h-full w-full flex-col px-3 py-4">
                {/* Absolute Toggle Button for Desktop */}
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-8 hidden h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-brand text-white shadow-md hover:bg-white/10 hover:text-white transition-all duration-300 md:flex z-50 ring-2 ring-background"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <ChevronRight className={`h-3 w-3 transition-transform duration-300 ${isCollapsed ? "" : "rotate-180"}`} />
                </button>

                <div className={`flex gap-3 px-2 transition-all duration-300 group ${isCollapsed ? "flex-col items-center py-2" : "h-16 items-center justify-start"}`}>
                    {/* Stylized Logo for Echelon */}
                    <div className={`flex shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-white shadow-xl transition-all duration-300 ${isCollapsed ? "h-10 w-10" : "h-11 w-11"}`}>
                        <Layers className={`${isCollapsed ? "h-5 w-5" : "h-6 w-6"} text-white`} strokeWidth={2.5} />
                    </div>
                    
                    <div
                        className={`min-w-0 transition-all duration-200 ${isCollapsed ? "h-0 w-0 opacity-0 pointer-events-none overflow-hidden" : "w-auto opacity-100"
                            }`}
                    >
                        <h1 className="truncate font-serif text-xl tracking-tight text-white">Echelon Registry</h1>
                    </div>
                    
                    {/* Close Mobile Menu Button */}
                    <button 
                        onClick={closeMobileMenu}
                        className="absolute top-4 right-4 md:hidden text-white/50 hover:text-white"
                    >
                        <ChevronRight className="h-5 w-5 rotate-180" />
                    </button>
                </div>

                <div className="mt-3 border-t border-white/10 pt-3 flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {(() => {
                        const allHrefs = navItems.flatMap(g => g.items.map(i => i.href));
                        return navItems.map((group) => (
                            <div key={group.section} className="mb-4">
                                <p
                                    className={`px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 transition-all duration-200 ${isCollapsed ? "opacity-0 h-0 pointer-events-none overflow-hidden" : "opacity-100 h-auto"
                                        }`}
                                >
                                    {group.section}
                                </p>
                                <div className="space-y-0.5">
                                    {group.items
                                        .filter((item) => !item.roles || item.roles.includes(role))
                                        .map((item) => {
                                            const Icon = item.icon;
                                            
                                            // 1. Exact match always wins
                                            // 2. Partial match (startsWith) only applies if no other item has an exact match
                                            const isExactMatch = pathname === item.href;
                                            const isPartialMatch = pathname?.startsWith(`${item.href}/`) && !allHrefs.includes(pathname || "");
                                            const active = isExactMatch || isPartialMatch;

                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={closeMobileMenu}
                                                    className={`flex h-11 items-center rounded-xl border border-transparent px-3 text-sm transition-all duration-200 relative group/link ${isCollapsed ? "justify-center" : "gap-3"
                                                        } ${active
                                                            ? "border-white/10 bg-white/12 text-white shadow-sm"
                                                            : "text-white/60 hover:bg-white/5 hover:text-white"
                                                        }`}
                                                >
                                                <Icon className={`h-5 w-5 shrink-0 transition-transform group-hover/link:scale-110 ${active ? "text-white" : "text-white/70"}`} />
                                                <span
                                                    className={`min-w-0 truncate font-medium transition-all duration-300 ${isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
                                                        }`}
                                                >
                                                    {item.label}
                                                </span>
                                                {!isCollapsed && active && (
                                                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ));
                    })()}
                </div>

                <div className="mt-auto pt-4 px-1 pb-1">
                    <div className={`rounded-[2rem] border border-white/15 bg-white/10 p-2.5 text-white/90 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 ${isCollapsed ? "items-center" : ""}`}>
                        <div
                            className={`flex ${isCollapsed ? "flex-col items-center gap-3 pt-1" : "items-center gap-3.5"
                                }`}
                        >
                            <div className="relative flex shrink-0 items-center justify-center">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/20 text-[12px] font-bold text-white shadow-inner">
                                    {userInitials}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-brand bg-emerald-500 shadow-sm" />
                            </div>

                            <div
                                className={`min-w-0 flex-1 transition-all duration-300 ${isCollapsed ? "h-0 w-0 opacity-0 pointer-events-none overflow-hidden" : "opacity-100"
                                    }`}
                            >
                                <p className="truncate text-sm font-semibold tracking-tight text-white leading-tight">{name ?? "User"}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="inline-flex rounded-full bg-amber-500/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                                        {roleLabel}
                                    </span>
                                </div>
                            </div>

                            <div className={`${isCollapsed ? "w-full flex justify-center border-t border-white/10 pt-2 pb-1" : ""}`}>
                                <SignOutButton 
                                    className={`flex items-center justify-center rounded-full transition-all duration-200 hover:bg-white/15 hover:scale-105 active:scale-95 text-white/70 hover:text-white ${
                                        isCollapsed ? "h-9 w-9 bg-white/5" : "h-9 w-9"
                                    }`} 
                                    title="Log out"
                                >
                                    <LogOut className="h-4.5 w-4.5" />
                                </SignOutButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
