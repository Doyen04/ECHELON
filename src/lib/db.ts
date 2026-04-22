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

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };