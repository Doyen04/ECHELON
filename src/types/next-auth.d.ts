import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "super_admin" | "hod";
      departmentId?: string; // present if role=hod
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "super_admin" | "hod";
    departmentId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "super_admin" | "hod";
    departmentId?: string;
  }
}
