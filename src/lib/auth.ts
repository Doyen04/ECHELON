import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/db";

const credentialsSchema = z.object({
    email: z.email().transform((value) => value.toLowerCase().trim()),
    password: z.string().min(8),
});

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    providers: [
        CredentialsProvider({
            name: "Email and Password",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = credentialsSchema.safeParse(credentials);
                if (!parsed.success) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: parsed.data.email },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        departmentId: true,
                        passwordHash: true,
                    },
                });

                if (!user) {
                    return null;
                }

                const isValidPassword = await bcrypt.compare(
                    parsed.data.password,
                    user.passwordHash,
                );

                if (!isValidPassword) {
                    return null;
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role as "super_admin" | "hod",
                    departmentId: user.departmentId ?? undefined,
                };
            },
        }),
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.departmentId = user.departmentId;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as "super_admin" | "hod";
                session.user.departmentId = token.departmentId as string | undefined;
            }
            return session;
        },
    },
    pages: {
        signIn: "/sign-in",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

export async function getAuthSession() {
    return getServerSession(authOptions);
}
