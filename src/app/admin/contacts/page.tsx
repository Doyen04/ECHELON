import type { Metadata } from "next";

import { GuardianContactManager } from "@/components/admin/guardian-contact-manager";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Contacts",
    description: "Manage parent contact records linked to students.",
};

export default async function ContactsPage() {
    const db = prisma as any;

    const guardians = await db.guardian.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            student: {
                select: {
                    id: true,
                    fullName: true,
                    matricNumber: true,
                    department: true,
                    faculty: true,
                    level: true,
                },
            },
        },
    });

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-background">
            <PageHeader
                title="Contacts"
                breadcrumbs={
                    <div className="flex items-center gap-1">
                        <Link href="/admin/dashboard" className="transition-colors hover:text-foreground">
                            Dashboard
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">Contact Management</span>
                    </div>
                }
            />

            <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <div className="mb-2">
                    <p className="text-sm text-muted-foreground">
                        Edit, search, upload, and delete parent contact records linked to students.
                    </p>
                </div>

                <GuardianContactManager
                    guardians={guardians.map((guardian: any) => ({
                        id: guardian.id,
                        studentId: guardian.studentId,
                        studentName: guardian.student.fullName,
                        matricNumber: guardian.student.matricNumber,
                        department: guardian.student.department,
                        faculty: guardian.student.faculty,
                        level: guardian.student.level,
                        name: guardian.name,
                        relationship: guardian.relationship,
                        email: guardian.email,
                        phone: guardian.phone,
                    }))}
                />
            </main>
        </div>
    );
}
