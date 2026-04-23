import type { Metadata } from "next";
import Link from "next/link";

import { GuardianContactManager } from "@/components/admin/guardian-contact-manager";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
    title: "Parent Contacts",
    description: "Manage parent and guardian contact records.",
};

export default async function StudentsPage() {
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
        <main className="dashboard-root min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="dashboard-grid-overlay" aria-hidden="true" />
            <section className="mx-auto w-full max-w-7xl rounded-3xl border border-(--border-subtle) bg-(--surface-strong) p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                    Contact Management
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    Parent Contacts
                </h1>
                <p className="mt-3 text-sm text-(--text-secondary)">
                    Edit, search, and delete parent contact records linked to students.
                </p>
                <div className="mt-4">
                    <Link
                        href="/admin/students/contacts"
                        className="inline-flex rounded-lg bg-(--accent-strong) px-3 py-2 text-xs font-semibold text-white"
                    >
                        Upload Parent Contacts
                    </Link>
                </div>

                <div className="mt-6 space-y-3">
                    {guardians.length > 0 ? (
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
                    ) : (
                        <div className="rounded-2xl border border-dashed border-(--border-subtle) p-8 text-sm text-(--text-secondary)">
                            No parent contacts found.
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
