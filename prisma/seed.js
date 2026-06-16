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

    // Seed Departments and Programs
    const csmDept = await prisma.department.upsert({
        where: { institutionId_code: { institutionId, code: "CSM" } },
        update: { name: "Computer Science & Mathematics" },
        create: {
            institutionId,
            code: "CSM",
            name: "Computer Science & Mathematics",
        },
    });

    const programs = [
        { code: "CS", name: "Computer Science" },
        { code: "SWE", name: "Software Engineering" },
        { code: "CYB", name: "Cybersecurity" },
        { code: "DS", name: "Data Science" },
    ];

    for (const prog of programs) {
        await prisma.program.upsert({
            where: { departmentId_code: { departmentId: csmDept.id, code: prog.code } },
            update: { name: prog.name },
            create: {
                departmentId: csmDept.id,
                code: prog.code,
                name: prog.name,
            },
        });
    }

    // Seed an HOD user
    const hodEmail = "hod@mtu.edu.ng";
    await prisma.user.upsert({
        where: { email: hodEmail },
        update: {
            name: "HOD CSM",
            role: "hod",
            departmentId: csmDept.id,
            passwordHash,
        },
        create: {
            email: hodEmail,
            name: "HOD CSM",
            role: "hod",
            departmentId: csmDept.id,
            passwordHash,
            institutionId,
        },
    });

    console.log(`Seeded super admin: ${email}`);
    console.log(`Seeded HOD admin: ${hodEmail}`);
}

main()
    .catch((error) => {
        console.error("Seeding failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
