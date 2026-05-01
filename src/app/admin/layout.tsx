import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { requireSuperAdminSession } from "@/lib/super-admin-session";

type AdminLayoutProps = {
    children: ReactNode;
};

import { SidebarProvider } from "@/providers/sidebar-provider";
import { AdminShell } from "@/components/layout/admin-shell";


export default async function AdminLayout({ children }: AdminLayoutProps) {
    const session = await requireSuperAdminSession();

    return (
        <SidebarProvider>
            <AdminShell
                sidebar={
                    <AdminSidebar
                        email={session.user.email}
                        name={session.user.name}
                        role={session.user.role}
                    />
                }
            >
                {children}
            </AdminShell>
        </SidebarProvider>
    );
}
