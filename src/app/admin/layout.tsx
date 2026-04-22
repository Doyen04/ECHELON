import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireSuperAdminSession } from "@/lib/super-admin-session";

type AdminLayoutProps = {
    children: ReactNode;
};

import { SidebarProvider } from "@/components/admin/sidebar-provider";
import { AdminShell } from "@/components/admin/admin-shell";


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
