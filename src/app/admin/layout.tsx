import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireSuperAdminSession } from "@/lib/super-admin-session";

type AdminLayoutProps = {
    children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
    const session = await requireSuperAdminSession();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <AdminSidebar
                email={session.user.email}
                name={session.user.name}
                role={session.user.role}
            />
            <main className="min-h-screen md:pl-16 xl:pl-60">
                {children}
            </main>
        </div>
    );
}
