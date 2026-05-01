"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/shared/badges";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { toBadgeStatus } from "@/lib/admin-format";

export type StudentResultRow = {
    id: string;
    fullName: string;
    matricNumber: string;
    status: string;
    gpa: string;
    token: string | null;
    courseCount: number;
};

export function BatchDetailClient({ studentResults }: { studentResults: StudentResultRow[] }) {
    const resultColumns: DataTableColumn<StudentResultRow>[] = [
        {
            header: "Student",
            cell: (row) => (
                <div>
                    <div className="font-medium text-foreground">{row.fullName}</div>
                    <div className="mt-0.5 text-xs text-text-muted">{row.matricNumber}</div>
                </div>
            ),
        },
        {
            header: "Status",
            cell: (row) => <StatusBadge status={toBadgeStatus(row.status)} />,
        },
        {
            header: "GPA",
            cell: (row) => <span className="text-foreground">{row.gpa}</span>,
            hideOnMobile: true,
        },
        {
            header: "Token",
            cell: (row) =>
                row.token ? (
                    <Link href={`/results/view?token=${row.token}`} target="_blank" className="text-brand hover:underline">
                        View portal link
                    </Link>
                ) : (
                    <span className="text-text-muted">Not generated</span>
                ),
            hideOnMobile: true,
        },
        {
            header: "Courses",
            cell: (row) => <span>{row.courseCount} courses</span>,
            hideOnMobile: true,
        },
    ];

    return (
        <DataTable
            columns={resultColumns}
            data={studentResults}
            rowKey={(row) => row.id}
            emptyMessage="No student results are stored for this batch yet."
            className="shadow-sm"
            pageSize={10}
        />
    );
}
