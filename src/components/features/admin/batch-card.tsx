"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/badges";
import { semesterLabel, relativeTimeFromNow, toBadgeStatus } from "@/lib/admin-format";
import { ApproveDispatchButton } from "./approve-dispatch-button";
import { Button } from "@/components/ui/button";

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
      className="dashboard-card group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-sidebar-primary/50 hover:shadow-md"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="space-y-4 flex-1">
          <div>
            <h3 className="mb-1 font-sans text-lg font-bold text-foreground">
              {batch.department} - {semesterLabel(batch.semester)} {batch.session}
            </h3>
            <p className="text-sm text-muted-foreground">
              Uploaded by{" "}
              <span className="font-semibold text-foreground">
                {batch.uploadedBy?.name ?? "System"}
              </span>{" "}
              • {relativeTimeFromNow(batch.uploadedAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className="px-3 py-1 font-semibold text-muted-foreground"
            >
              {studentCount} student records
            </Badge>
            {pendingCount > 0 && (
              <Badge
                variant="outline"
                className="px-3 py-1 font-semibold text-muted-foreground"
              >
                Pending: {pendingCount}
              </Badge>
            )}
            {approvedCount > 0 && (
              <Badge
                variant="outline"
                className="px-3 py-1 font-semibold text-muted-foreground"
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
              <Button
                asChild
                variant="outline"
                className="w-full rounded-full md:w-auto px-6"
              >
                <Link href={`/admin/batches/${batch.id}`}>
                  Begin Review{" "}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <ApproveDispatchButton batchId={batch.id} />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
