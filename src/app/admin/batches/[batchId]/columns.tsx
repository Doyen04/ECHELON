"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/shared/badges";
import { toBadgeStatus, relativeTimeFromNow } from "@/lib/admin-format";
import { Badge } from "@/components/ui/badge";

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export const getColumns = (onReview: (student: any) => void) => [
    {
        header: "Student",
        accessorKey: "student",
        className: "px-6 py-4 text-sm text-foreground",
        cell: (row: any) => (
            <div className="flex items-center gap-3 min-w-[200px]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground shrink-0">
                    {row.student.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="truncate">
                    <div className="font-bold text-sm truncate">{row.student.fullName}</div>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-tight">
                        {row.student.matricNumber}
                    </div>
                </div>
            </div>
        ),
    },
    {
        header: "Level",
        accessorKey: "level",
        className: "px-4 py-4 text-xs font-bold text-muted-foreground",
        cell: (row: any) => <Badge variant="outline" className="border-muted-foreground/20">{row.student.level}</Badge>,
    },
    {
        header: "Status",
        accessorKey: "status",
        className: "px-6 py-4",
        cell: (row: any) => <StatusBadge status={toBadgeStatus(row.status)} />,
    },
    {
        header: "GPA",
        accessorKey: "gpa",
        className: "px-4 py-4 text-sm font-bold text-foreground",
        cell: (row: any) => <span className="text-brand">{Number(row.gpa).toFixed(2)}</span>,
    },
    {
        header: "CGPA",
        accessorKey: "cgpa",
        className: "px-4 py-4 text-sm font-bold text-muted-foreground",
        cell: (row: any) => row.cgpa ? Number(row.cgpa).toFixed(2) : <span className="text-muted-foreground/30">—</span>,
    },
    {
        header: "Courses",
        accessorKey: "courses",
        className: "px-4 py-4",
        cell: (row: any) => {
            const courses = Array.isArray(row.courses) ? row.courses : [];
            return <span className="text-xs font-medium text-muted-foreground">{courses.length} Units</span>;
        },
    },
    {
        header: "Actions",
        accessorKey: "actions",
        className: "px-6 py-4 text-right",
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
