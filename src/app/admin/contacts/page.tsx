import type { Metadata } from "next";

import { GuardianContactManager } from "@/components/admin/guardian-contact-manager";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
    title: "Contacts",
    description: "Manage parent contacts and students without guardian records.",
};

export default async function ContactsPage() {
    const db = prisma as any;

    const [guardians, students] = await Promise.all([
        db.guardian.findMany({
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
        }),
        db.student.findMany({
            orderBy: [{ department: "asc" }, { fullName: "asc" }],
            select: {
                id: true,
                fullName: true,
                matricNumber: true,
                department: true,
                faculty: true,
                level: true,
                guardians: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        relationship: true,
                    },
                },
            },
        }),
    ]);

    const studentsWithoutContacts = students.filter((student: any) => {
        return !student.guardians.some((guardian: any) => Boolean(guardian.email || guardian.phone));
    });

    return (
        <main className="dashboard-root min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="dashboard-grid-overlay" aria-hidden="true" />
            <Card className="mx-auto w-full max-w-7xl rounded-3xl p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                    Contact Management
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    Contacts
                </h1>
                <p className="mt-3 text-sm text-(--text-secondary)">
                    Edit, search, upload, and delete parent contact records linked to students.
                </p>

                <div className="mt-6 space-y-3">
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
                        studentsWithoutContacts={studentsWithoutContacts.map((student: any) => ({
                            id: student.id,
                            fullName: student.fullName,
                            matricNumber: student.matricNumber,
                            department: student.department,
                            faculty: student.faculty,
                            level: student.level,
                        }))}
                    />
                </div>
            </Card>
        </main>
    );
}
