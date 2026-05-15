"use client";

import { GuardianContactManager } from "@/components/features/contacts/guardian-contact-manager";
import { useApi } from "@/hooks/use-api";
import { ApiGate } from "@/components/shared/api-gate";
import { PageHeader } from "@/components/shared/page-header";

export default function ContactsPage() {
    const { data, isLoading, error } = useApi< [{}] >(
        "/api/guardians",
        { immediate: true },
    );
    

    return (
        <ApiGate
            data={data}
            isLoading={isLoading}
            error={error}
            loadingTitle='Loading contacts...'
            errorMessage='Failed to load contacts'
        >
            {(data) => {
                const  guardians  = data;
                console.log(guardians, "print");
                return (
                    <div className='flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-background'>
                        <PageHeader title='Contact Management' />

                        <main className='mx-auto w-full max-w-7xl min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
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
            }}
        </ApiGate>
    );
}
