import type { ReactNode } from "react";
import { requireHodSession } from "@/lib/hod-session";
import { HodSidebar } from "@/components/layout/hod-sidebar";
import { SidebarProvider } from "@/providers/sidebar-provider";

type HodLayoutProps = {
  children: ReactNode;
};

import { AdminShell } from "@/components/layout/admin-shell";

export default async function HodLayout({ children }: HodLayoutProps) {
  const session = await requireHodSession();

  return (
    <SidebarProvider>
      <AdminShell
        sidebar={
          <HodSidebar
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
