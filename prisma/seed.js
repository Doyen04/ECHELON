require("dotenv/config");

const bcrypt = require("bcryptjs");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../src/app/generated/prisma-client");

const email = "solaopeyemi93@gmail.com";
const plainPassword = "ademola12345";
const institutionId = "seed-institution";

const connectionString =
    process.env.PRISMA_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error(
        "Missing Prisma connection string. Set PRISMA_DATABASE_URL, POSTGRES_URL, or DATABASE_URL.",
    );
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    await prisma.institution.upsert({
        where: { id: institutionId },
        update: {
            name: "Default Institution",
        },
        create: {
            id: institutionId,
            name: "Default Institution",
        },
    });

    await prisma.user.upsert({
        where: { email },
        update: {
            name: "Sola Opeyemi",
            role: "super_admin",
            passwordHash,
        },
        create: {
            email,
            name: "Sola Opeyemi",
            role: "super_admin",
            passwordHash,
            institutionId,
        },
    });

    console.log(`Seeded super admin: ${email}`);
}

main()
    .catch((error) => {
        console.error("Seeding failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
