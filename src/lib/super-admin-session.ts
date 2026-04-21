import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/auth";

export async function getSuperAdminSession() {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "super_admin") {
    return null;
  }
  return session;
}

export async function requireSuperAdminSession() {
  const session = await getSuperAdminSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}
