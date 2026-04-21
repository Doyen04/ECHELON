import { NextResponse } from "next/server";
import { z } from "zod";

import { processNotifyJob } from "@/lib/dispatch-worker";
import { prisma } from "@/lib/db";
import { enqueueNotifyJob } from "@/lib/queue";
import { getSuperAdminSession } from "@/lib/super-admin-session";

const requestSchema = z.object({
    batchId: z.string().min(1),
});

export async function POST(request: Request) {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const db = prisma as any;

    const batch = await db.resultBatch.findUnique({
        where: { id: parsed.data.batchId },
        include: {
            studentResults: {
                where: { status: "APPROVED" },
                select: { id: true },
            },
        },
    });

    if (!batch) {
        return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    if (batch.status !== "APPROVED") {
        return NextResponse.json(
            { error: "Batch must be approved before dispatch." },
            { status: 409 },
        );
    }

    if (batch.studentResults.length === 0) {
        return NextResponse.json(
            { error: "No approved student results available to dispatch." },
            { status: 409 },
        );
    }

    const dispatch = await db.notificationDispatch.create({
        data: {
            batchId: batch.id,
            triggeredById: session.user.id,
            totalCount: batch.studentResults.length,
            status: "QUEUED",
        },
    });

    await db.auditLog.create({
        data: {
            institutionId: batch.institutionId,
            actorId: session.user.id,
            action: "dispatch.triggered",
            entityType: "notification_dispatch",
            entityId: dispatch.id,
            metadata: {
                batchId: batch.id,
                approvedResultCount: batch.studentResults.length,
            },
        },
    });

    const queuedResults: Array<{ studentResultId: string; mode: "queued" | "inline" }> = [];

    for (const result of batch.studentResults as Array<{ id: string }>) {
        const queueResult = await enqueueNotifyJob({
            dispatchId: dispatch.id,
            studentResultId: result.id,
        });

        if (!queueResult.queued) {
            await processNotifyJob({
                dispatchId: dispatch.id,
                studentResultId: result.id,
            });

            queuedResults.push({ studentResultId: result.id, mode: "inline" });
            continue;
        }

        queuedResults.push({ studentResultId: result.id, mode: "queued" });
    }

    await db.resultBatch.update({
        where: { id: batch.id },
        data: { status: "DISPATCHED" },
    });

    return NextResponse.json({
        dispatchId: dispatch.id,
        totalStudents: batch.studentResults.length,
        queued: queuedResults.filter((item) => item.mode === "queued").length,
        inlineProcessed: queuedResults.filter((item) => item.mode === "inline").length,
    });
}
