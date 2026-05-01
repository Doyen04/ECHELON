"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/shared/badges";
import { toBadgeStatus, relativeTimeFromNow } from "@/lib/admin-format";

export const columns = [
  {
    header: "Student",
    accessorKey: "student",
    className: "px-6 py-4 text-sm text-foreground",
    cell: (row: any) => (
      <>
        <div className="font-medium">{row.student.fullName}</div>
        <div className="mt-1 text-xs text-text-muted">
          {row.student.matricNumber}
        </div>
      </>
    ),
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
    className: "px-6 py-4 text-sm text-(--text-secondary)",
    cell: (row: any) => <>{row.cgpa ?? row.gpa}</>,
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
    className: "px-6 py-4 text-sm text-(--text-secondary)",
    cell: (row: any) => {
      const courses = Array.isArray(row.courses) ? row.courses : [];
      return <>{courses.length} courses</>;
    },
  },
];
