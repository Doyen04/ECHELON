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
    const { isCollapsed, toggleSidebar } = useSidebar();

    const roleLabel = role === "super_admin" ? "Super Admin" : role;

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-30 hidden overflow-hidden border-r border-white/10 bg-brand text-white transition-[width] duration-300 ease-out md:flex ${
                isCollapsed ? "w-16" : "w-60"
            }`}
        >
            <div className="flex h-full w-full flex-col px-3 py-4">
                <div className={`flex h-16 items-center gap-3 px-2 ${isCollapsed ? "justify-center" : "justify-start"}`}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/12 text-sm font-semibold text-white">
                        RN
                    </div>
                    <div
                        className={`min-w-0 transition-all duration-200 ${
                            isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
                        }`}
                    >
                        <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">Institution</p>
                        <h1 className="mt-0.5 truncate font-serif text-xl text-white">Echelon Registry</h1>
                    </div>
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        className={`ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white ${
                            isCollapsed ? "ml-0" : ""
                        }`}
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <Menu className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-3 border-t border-white/10 pt-3">
                    {navItems.map((group) => (
                        <div key={group.section} className="mb-3">
                            <p
                                className={`px-2 text-[10px] uppercase tracking-[0.28em] text-white/40 transition-all duration-200 ${
                                    isCollapsed ? "h-0 opacity-0 pointer-events-none" : "h-auto opacity-100"
                                }`}
                            >
                                {group.section}
                            </p>
                            <div className="mt-2 space-y-1">
                                {group.items
                                    .filter((item) => !item.roles || item.roles.includes(role))
                                    .map((item) => {
                                        const Icon = item.icon;
                                        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`flex h-10 items-center rounded-xl border border-transparent px-3 text-sm transition ${
                                                    isCollapsed ? "justify-center" : "gap-3"
                                                } ${active
                                                        ? "border-white/15 bg-white/15 text-white"
                                                        : "text-white/70 hover:bg-white/10 hover:text-white"
                                                    }`}
                                            >
                                                <Icon className="h-4 w-4 shrink-0" />
                                                <span
                                                    className={`min-w-0 truncate transition-all duration-200 ${
                                                        isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
                                                    }`}
                                                >
                                                    {item.label}
                                                </span>
                                                <ChevronRight
                                                    className={`ml-auto h-3.5 w-3.5 shrink-0 transition-opacity duration-200 ${
                                                        isCollapsed ? "opacity-0" : "opacity-40"
                                                    }`}
                                                />
                                            </Link>
                                        );
                                    })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto px-1 pb-1">
                    <div className="rounded-3xl border border-white/10 bg-white/8 p-3 text-white/90 shadow-[0_12px_30px_-20px_rgba(0,0,0,0.45)]">
                        <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : "justify-between"}`}>
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold text-white z-10 relative">
                                    {userInitials}
                                </div>
                                <div
                                    className={`min-w-0 transition-all duration-200 ${
                                        isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
                                    }`}
                                >
                                    <p className="truncate text-sm font-medium text-white pr-2">{name ?? email ?? "User"}</p>
                                    <span className="mt-1 inline-flex rounded-full bg-[#B8860B] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                                        {roleLabel}
                                    </span>
                                </div>
                            </div>
                            
                            <div className={`shrink-0 transition-opacity duration-200 ${isCollapsed ? "hidden" : "opacity-100"}`}>
                                <SignOutButton className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-white/10 transition cursor-pointer text-white/70 hover:text-white" title="Log out">
                                    <LogOut className="h-4 w-4" />
                                </SignOutButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
