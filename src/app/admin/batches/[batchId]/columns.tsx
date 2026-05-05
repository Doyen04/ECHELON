"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/shared/badges";
import { toBadgeStatus, relativeTimeFromNow } from "@/lib/admin-format";
import { Badge } from "@/components/ui/badge";

export const columns = [
    {
        header: "Student",
        accessorKey: "student",
        className: "px-6 py-4 text-sm text-foreground",
        cell: (row: any) => (
            <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                    {row.student.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                    <div className="font-bold text-sm">{row.student.fullName}</div>
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
        header: "Token",
        accessorKey: "token",
        className: "px-6 py-4 text-sm text-(--text-secondary)",
        cell: (row: any) => {
            const token = row.portalTokens?.[0]?.token;
            return token ? (
                <Link
                    href={`/results/view?token=${token}`}
                    target="_blank"
                    className="text-brand hover:underline"
                >
                    View portal link
                </Link>
            ) : (
                "Not generated"
            );
        },
    },
    {
        header: "Accessed",
        accessorKey: "accessed",
        className: "px-6 py-4 text-sm text-(--text-secondary)",
        cell: (row: any) => {
            const portalToken = row.portalTokens?.[0];
            if (!portalToken) return <span className="text-(--text-muted)">N/A</span>;
            if (!portalToken.viewedAt) return <span className="text-(--text-muted)">Not viewed yet</span>;
            return <span className="text-[var(--color-success)]">Viewed {relativeTimeFromNow(portalToken.viewedAt)}</span>;
        },
    },
    {
        header: "Courses",
        accessorKey: "courses",
        className: "px-4 py-4 min-w-[200px]",
        cell: (row: any) => {
            const courses = Array.isArray(row.courses) ? row.courses : [];
            return (
                <div className="flex flex-wrap gap-1">
                    {courses.slice(0, 3).map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-1 rounded bg-muted/50 px-1.5 py-0.5 text-[9px] font-bold border border-border/50">
                            <span className="text-muted-foreground">{c.courseCode}:</span>
                            <span className="text-brand">{c.grade}</span>
                        </div>
                    ))}
                    {courses.length > 3 && (
                        <Badge variant="outline" className="h-4 px-1 text-[8px] font-bold text-muted-foreground">
                            +{courses.length - 3} more
                        </Badge>
                    )}
                </div>
            );
        },
    },
];
