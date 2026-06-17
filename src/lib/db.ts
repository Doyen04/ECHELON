import { PrismaClient } from "../app/generated/prisma-client";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
    process.env.PRISMA_DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error(
        "Missing Prisma connection string. Set PRISMA_DATABASE_URL or POSTGRES_URL.",
    );
}

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

function makePrismaClient() {
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}