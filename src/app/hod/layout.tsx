import type { ReactNode } from "react";
import { requireHodSession } from "@/lib/hod-session";
import { HodSidebar } from "@/components/layout/hod-sidebar";
import { SidebarProvider } from "@/providers/sidebar-provider";

type HodLayoutProps = {
  children: ReactNode;
};

export default async function HodLayout({ children }: HodLayoutProps) {
  const session = await requireHodSession();

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-[#0A0A0B] text-slate-200">
        <HodSidebar
          email={session.user.email}
          name={session.user.name}
          role={session.user.role}
        />
        <main className="flex-1 overflow-y-auto md:pl-0 pt-16 md:pt-0">
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
