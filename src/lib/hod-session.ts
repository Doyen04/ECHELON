import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { getAuthSession } from "@/lib/auth";

export type HodSession = Session & {
  user: NonNullable<Session["user"]> & {
    id: string;
    role: "hod";
    departmentId: string; // always present for HOD
  };
};

export async function getHodSession(): Promise<HodSession | null> {
  const session = await getAuthSession();
  if (
    !session?.user ||
    session.user.role !== "hod" ||
    !session.user.departmentId
  ) {
    return null;
  }
  return session as HodSession;
}

export async function requireHodSession(): Promise<HodSession> {
  const session = await getHodSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}

export type AdminSession = Session & {
  user: NonNullable<Session["user"]> & {
    id: string;
    role: "super_admin";
  };
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "super_admin") {
    return null;
  }
  return session as AdminSession;
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}
