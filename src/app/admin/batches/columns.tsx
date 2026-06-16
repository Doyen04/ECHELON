"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/badges";
import { relativeTimeFromNow, semesterLabel, toBadgeStatus } from "@/lib/admin-format";

export const columns = [
    {
        header: "Batch ID",
        accessorKey: "id",
        className: "",
        cell: (batch: any) => (
            <div className="max-w-24 truncate text-[10px] font-mono text-muted-foreground" title={batch.id}>
                {batch.id}
            </div>
        ),
    },
    {
        header: "Session",
        accessorKey: "session",
        className: "",
        cell: (batch: any) => <div className="text-sm font-bold text-foreground">{batch.session}</div>,
    },
    {
        header: "Semester",
        accessorKey: "semester",
        className: "",
        cell: (batch: any) => <div className="text-sm font-bold text-foreground">{semesterLabel(batch.semester)}</div>,
    },
    {
        header: "Program / Level",
        accessorKey: "program",
        className: "",
        cell: (batch: any) => (
            <>
                <div className="text-sm font-bold text-foreground">
                    {batch.program?.name || batch.department}
                </div>
                {batch.level && (
                    <div className="mt-1 text-[11px] font-medium text-muted-foreground uppercase tracking-tight">
                        {batch.level} Level
                    </div>
                )}
            </>
        ),
    },
    {
        header: "Students",
        className: "",
        cell: (batch: any) => <div className="text-[11px] font-medium text-muted-foreground">{batch._count?.studentResults ?? 0}</div>,
    },
    {
        header: "Source",
        className: "",
        cell: (batch: any) => (
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tight">
                {String(batch.source).toUpperCase()}
            </Badge>
        ),
    },
    {
        header: "Status",
        className: "",
        cell: (batch: any) => <StatusBadge status={toBadgeStatus(batch.status)} />,
    },
    {
        header: "Uploaded",
        className: "",
        cell: (batch: any) => (
            <div className="min-w-0 flex flex-col gap-0.5">
                <span className="text-sm font-bold text-foreground truncate">{batch.uploadedBy?.name ?? "System"}</span>
                <span className="text-[11px] font-medium text-muted-foreground">{relativeTimeFromNow(batch.uploadedAt)}</span>
            </div>
        ),
    },
    {
        header: "",
        className: "text-right",
        cell: (batch: any) => (
            <Link
                href={`/admin/batches/${batch.id}`}
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-brand hover:text-brand-hover hover:underline"
            >
                View <ChevronRight className="h-4 w-4" />
            </Link>
        ),
    },
];
