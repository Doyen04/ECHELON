"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/badges";
import { semesterLabel, relativeTimeFromNow, toBadgeStatus } from "@/lib/admin-format";
import { ApproveDispatchButton } from "./approve-dispatch-button";

interface BatchCardProps {
  batch: any;
  index?: number;
  showActions?: boolean;
}

export function BatchCard({ batch, index = 0, showActions = true }: BatchCardProps) {
  const studentCount = batch.studentResults?.length ?? batch._count?.studentResults ?? 0;
  const pendingCount = batch.studentResults?.filter(
    (result: any) => result.status === "PENDING"
  ).length ?? 0;
  const approvedCount = batch.studentResults?.filter(
    (result: any) => result.status === "APPROVED"
  ).length ?? 0;

  return (
    <Card
      className="dashboard-card rounded-xl border-border/70 bg-card p-6 shadow-sm transition-colors hover:border-brand/30"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="space-y-4 flex-1">
          <div>
            <h3 className="mb-1 font-serif text-lg text-foreground">
              {batch.department} - {semesterLabel(batch.semester)} {batch.session}
            </h3>
            <p className="text-sm text-text-muted">
              Uploaded by{" "}
              <span className="font-medium text-foreground">
                {batch.uploadedBy?.name ?? "System"}
              </span>{" "}
              • {relativeTimeFromNow(batch.uploadedAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 text-[11px] font-medium text-text-muted"
            >
              {studentCount} student records
            </Badge>
            {pendingCount > 0 && (
              <Badge
                variant="outline"
                className="rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-text-muted"
              >
                Pending: {pendingCount}
              </Badge>
            )}
            {approvedCount > 0 && (
              <Badge
                variant="outline"
                className="rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-text-muted"
              >
                Approved: {approvedCount}
              </Badge>
            )}
            <StatusBadge status={toBadgeStatus(batch.status)} />
          </div>
        </div>

        {showActions && (
          <div className="flex w-full shrink-0 items-center md:w-auto">
            <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:items-end">
              <Link
                href={`/admin/batches/${batch.id}`}
                className="group flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98] md:w-auto"
              >
                Begin Review{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <ApproveDispatchButton batchId={batch.id} />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
