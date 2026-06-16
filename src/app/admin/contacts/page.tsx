"use client";

import { useEffect, useState } from "react";
import { GuardianContactManager } from "@/components/features/contacts/guardian-contact-manager";
import { useApi } from "@/hooks/use-api";
import { ApiGate } from "@/components/shared/api-gate";
import { PageHeader } from "@/components/shared/page-header";

export default function ContactsPage() {
    const [query, setQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
    });
    if (query.trim()) {
        params.set("q", query.trim());
    }

    const { data, isLoading, error } = useApi<any>(
        `/api/guardians?${params.toString()}`,
        { immediate: true },
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [query]);


    return (
        <ApiGate
            data={data}
            isLoading={isLoading}
            error={error}
            loadingTitle='Loading contacts...'
            errorMessage='Failed to load contacts'
        >
            {(data) => {
                const guardians = data?.guardians ?? [];
                const pagination = data?.pagination ?? {
                    currentPage: 1,
                    pages: 1,
                    total: 0,
                };
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
                                query={query}
                                onQueryChange={setQuery}
                                currentPage={pagination.currentPage}
                                totalPages={pagination.pages}
                                totalCount={pagination.total}
                                onPageChange={setCurrentPage}
                            />
                        </main>
                    </div>
                );
            }}
        </ApiGate>
    );
}
