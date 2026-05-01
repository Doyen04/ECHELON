"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/badges";
import { relativeTimeFromNow, semesterLabel, toBadgeStatus } from "@/lib/admin-format";

export const columns = [
    {
        header: "Batch ID",
        accessorKey: "id",
        className: "w-28 font-mono text-[10px] text-muted-foreground",
        cell: (batch: any) => (
            <div className="max-w-24 truncate" title={batch.id}>
                {batch.id}
            </div>
        ),
    },
    {
        header: "Session",
        accessorKey: "session",
        className: "w-24 text-sm text-foreground",
    },
    {
        header: "Semester",
        accessorKey: "semester",
        className: "w-24 text-sm text-foreground",
        cell: (batch: any) => semesterLabel(batch.semester),
    },
    {
        header: "Department",
        accessorKey: "department",
        className: "w-36 text-sm font-medium text-foreground",
    },
    {
        header: "Students",
        className: "w-20 text-sm text-foreground",
        cell: (batch: any) => batch._count?.studentResults ?? 0,
    },
    {
        header: "Source",
        className: "w-20",
        cell: (batch: any) => (
            <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {String(batch.source).toUpperCase()}
            </Badge>
        ),
    },
    {
        header: "Status",
        className: "w-24",
        cell: (batch: any) => <StatusBadge status={toBadgeStatus(batch.status)} />,
    },
    {
        header: "Uploaded",
        className: "w-36",
        cell: (batch: any) => (
            <div className="min-w-0 flex flex-col">
                <span className="truncate text-sm text-foreground">{batch.uploadedBy?.name ?? "System"}</span>
                <span className="text-xs text-muted-foreground">{relativeTimeFromNow(batch.uploadedAt)}</span>
            </div>
        ),
    },
    {
        header: "",
        className: "w-20 text-right",
        cell: (batch: any) => (
            <Link
                href={`/admin/batches/${batch.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover hover:underline"
            >
                View <ChevronRight className="h-4 w-4" />
            </Link>
        ),
    },
];
