"use client";

import { StatusBadge } from "@/components/shared/badges";
import { toBadgeStatus } from "@/lib/admin-format";
import { Badge } from "@/components/ui/badge";

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export const getColumns = (onReview: (student: any) => void) => [
    {
        header: "Student",
        accessorKey: "student",
        className: "",
        cell: (row: any) => (
            <div className="flex items-center gap-3 min-w-[250px] max-w-[400px]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground shrink-0">
                    {row.student.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="truncate">
                    <div className="text-sm font-bold text-foreground truncate">{row.student.fullName}</div>
                    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight">
                        {row.student.matricNumber}
                    </div>
                </div>
            </div>
        ),
    },
    {
        header: "Level",
        accessorKey: "level",
        className: "",
        cell: (row: any) => <Badge variant="outline" className="border-muted-foreground/20 text-[10px] font-bold uppercase">{row.student.level}</Badge>,
    },
    {
        header: "Status",
        accessorKey: "status",
        className: "whitespace-nowrap",
        cell: (row: any) => <StatusBadge status={toBadgeStatus(row.status)} />,
    },
    {
        header: "GPA",
        accessorKey: "gpa",
        className: "whitespace-nowrap",
        cell: (row: any) => <span className="text-sm font-bold text-brand">{Number(row.gpa).toFixed(2)}</span>,
    },
    {
        header: "CGPA",
        accessorKey: "cgpa",
        className: "whitespace-nowrap",
        cell: (row: any) => row.cgpa ? <span className="text-sm font-bold text-muted-foreground">{Number(row.cgpa).toFixed(2)}</span> : <span className="text-[11px] font-medium text-muted-foreground/50">—</span>,
    },
    {
        header: "Courses",
        accessorKey: "courses",
        className: "",
        cell: (row: any) => {
            const courses = Array.isArray(row.courses) ? row.courses : [];
            return <span className="text-[11px] font-medium text-muted-foreground">{courses.length} Units</span>;
        },
    },
    {
        header: "Actions",
        accessorKey: "actions",
        className: "text-right",
        cell: (row: any) => (
            <Button
                variant="ghost"
                size="sm"
                className="gap-2 h-8 text-[10px] font-bold uppercase tracking-widest text-brand hover:text-brand-hover hover:bg-brand/5"
                onClick={() => onReview(row)}
            >
                <Eye className="h-3 w-3" />
                Review Detail
            </Button>
        ),
    },
];
