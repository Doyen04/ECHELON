import { processNotifyJob } from "@/lib/dispatch-worker";
import {
    createAuditLog,
    createNotificationDispatch,
    findDispatchBatchWithApprovedResults,
    updateResultBatchStatus,
} from "@/lib/repositories/notification-repository";
import { enqueueNotifyJob } from "@/lib/queue";

type TriggerDispatchInput = {
    batchId: string;
    triggeredById: string;
};

type TriggerDispatchResult = {
    dispatchId: string;
    totalStudents: number;
    queued: number;
    inlineProcessed: number;
};

export class DispatchTriggerError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = "DispatchTriggerError";
        this.statusCode = statusCode;
    }
}

export async function triggerDispatchForBatch(
    input: TriggerDispatchInput,
): Promise<TriggerDispatchResult> {
    const batch = await findDispatchBatchWithApprovedResults(input.batchId);

    if (!batch) {
        throw new DispatchTriggerError("Batch not found", 404);
    }

    if (batch.status !== "APPROVED") {
        throw new DispatchTriggerError("Batch must be approved before dispatch.", 409);
    }

    if (batch.studentResults.length === 0) {
        throw new DispatchTriggerError("No approved student results available to dispatch.", 409);
    }

    const dispatch = await createNotificationDispatch({
        batchId: batch.id,
        triggeredById: input.triggeredById,
        totalCount: batch.studentResults.length,
        status: "QUEUED",
    });

    await createAuditLog({
        institutionId: batch.institutionId,
        actorId: input.triggeredById,
        action: "dispatch.triggered",
        entityType: "notification_dispatch",
        entityId: dispatch.id,
        metadata: {
            batchId: batch.id,
            approvedResultCount: batch.studentResults.length,
        },
    });

    let queuedCount = 0;
    let inlineProcessedCount = 0;

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
            inlineProcessedCount += 1;
            continue;
        }

        queuedCount += 1;
    }

    await updateResultBatchStatus(batch.id, "DISPATCHED");

    return {
        dispatchId: dispatch.id,
        totalStudents: batch.studentResults.length,
        queued: queuedCount,
        inlineProcessed: inlineProcessedCount,
    };
}
