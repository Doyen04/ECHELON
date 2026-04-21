import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "super_admin";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "super_admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "super_admin";
  }
}
