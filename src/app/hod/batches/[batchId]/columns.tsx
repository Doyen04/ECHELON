"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const getStatusBadge = (status: string) => {
    switch (status) {
        case "APPROVED":
            return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase">Approved</Badge>;
        case "PENDING":
            return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase">Pending</Badge>;
        case "DISPATCHED":
            return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase">Dispatched</Badge>;
        case "REJECTED":
            return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 px-2 py-0.5 text-[10px] font-bold uppercase">Rejected</Badge>;
        default:
            return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20 px-2 py-0.5 text-[10px] font-bold uppercase">{status}</Badge>;
    }
};

export const columns = [
    {
        header: "Student",
        accessorKey: "student",
        className: "px-6 py-4 text-sm text-foreground",
        cell: (row: any) => (
            <>
                <div className="font-semibold text-foreground">{row.student.fullName}</div>
                <div className="mt-0.5 text-[10px] font-mono text-muted-foreground uppercase">
                    {row.student.matricNumber}
                </div>
            </>
        ),
    },
    {
        header: "GPA",
        accessorKey: "gpa",
        className: "px-6 py-4 text-sm font-bold text-foreground",
        cell: (row: any) => <>{row.gpa.toFixed(2)}</>,
    },
    {
        header: "Status",
        accessorKey: "status",
        className: "px-6 py-4",
        cell: (row: any) => getStatusBadge(row.status),
    },
    {
        header: "Courses",
        accessorKey: "courses",
        className: "px-6 py-4 text-xs text-foreground",
        cell: (row: any) => {
            const courses = Array.isArray(row.courses) ? row.courses : [];
            return <>{courses.length} courses</>;
        },
    },
];
