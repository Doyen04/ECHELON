import { NextResponse } from "next/server";

import { DispatchTriggerError, triggerDispatchForBatch } from "@/lib/dispatch-service";
import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

type RouteContext = {
  params: Promise<{
    batchId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { batchId } = await context.params;
  if (!batchId) {
    return NextResponse.json({ error: "Batch id is required." }, { status: 400 });
  }

  const db = prisma as any;
  const actor = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, institutionId: true },
  });

  if (!actor) {
    return NextResponse.json({ error: "Authenticated user not found." }, { status: 404 });
  }

  const batch = await db.resultBatch.findUnique({
    where: { id: batchId },
    include: {
      studentResults: {
        select: { status: true },
      },
    },
  });

  if (!batch || batch.institutionId !== actor.institutionId) {
    return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  }

  if (batch.status === "DISPATCHED") {
    return NextResponse.json({ error: "Batch has already been dispatched." }, { status: 409 });
  }

  const pendingCount = batch.studentResults.filter((result: any) => result.status === "PENDING").length;

  await db.$transaction(async (tx: any) => {
    if (pendingCount > 0) {
      await tx.studentResult.updateMany({
        where: {
          batchId,
          status: "PENDING",
        },
        data: {
          status: "APPROVED",
          reviewedById: actor.id,
          reviewedAt: new Date(),
        },
      });
    }

    await tx.resultBatch.update({
      where: { id: batchId },
      data: {
        status: "APPROVED",
        approvedById: actor.id,
        approvedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        institutionId: actor.institutionId,
        actorId: actor.id,
        action: "batch.approved",
        entityType: "result_batch",
        entityId: batchId,
        metadata: {
          pendingApproved: pendingCount,
        },
      },
    });
  });

  try {
    const dispatch = await triggerDispatchForBatch({
      batchId,
      triggeredById: actor.id,
    });

    return NextResponse.json({
      batchId,
      approvedPending: pendingCount,
      dispatch,
    });
  } catch (error) {
    if (error instanceof DispatchTriggerError) {
      return NextResponse.json(
        {
          batchId,
          approvedPending: pendingCount,
          dispatch: null,
          error: error.message,
        },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      {
        batchId,
        approvedPending: pendingCount,
        dispatch: null,
        error: "Batch approved but dispatch failed.",
      },
      { status: 500 },
    );
  }
}
