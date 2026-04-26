import { redirect } from "next/navigation";
import type { Session } from "next-auth";

import { getAuthSession } from "@/lib/auth";

export type SuperAdminSession = Session & {
  user: NonNullable<Session["user"]> & {
    id: string;
    role: "super_admin";
  };
};

export async function getSuperAdminSession(): Promise<SuperAdminSession | null> {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "super_admin" || !session.user.id) {
    return null;
  }
  return session as SuperAdminSession;
}

export async function requireSuperAdminSession() {
  const session = await getSuperAdminSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}
