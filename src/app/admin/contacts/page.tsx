"use client";

import { GuardianContactManager } from "@/components/features/contacts/guardian-contact-manager";
import { Card } from "@/components/ui/card";
import { useApi } from "@/hooks/use-api";
import { LoadingState } from "@/components/shared/loading-state";
import { ApiGate } from "@/components/shared/api-gate";

export default function ContactsPage() {
  const { data, isLoading, error } = useApi<{ guardians: any[] }>(
    "/api/guardians",
    { immediate: true },
  );

  return (
    <ApiGate
      data={data}
      isLoading={isLoading}
      error={error}
      loadingTitle="Loading contacts..."
      errorMessage="Failed to load contacts"
    >
      {(data) => {
        const { guardians } = data;
        return (
          <main className='dashboard-root min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8'>
            <div className='dashboard-grid-overlay' aria-hidden='true' />
            <Card className='mx-auto w-full max-w-7xl rounded-3xl p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8'>
              <p className='text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)'>
                Contact Management
              </p>
              <h1 className='mt-2 text-3xl font-semibold tracking-tight text-foreground'>
                Contacts
              </h1>
              <p className='mt-3 text-sm text-(--text-secondary)'>
                Edit, search, upload, and delete parent contact records linked to
                students.
              </p>

              <div className='mt-6 space-y-3'>
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
              </div>
            </Card>
          </main>
        );
      }}
    </ApiGate>
  );
}
