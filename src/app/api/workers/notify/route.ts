import { NextResponse } from "next/server";
import { z } from "zod";

import { processNotifyJob } from "@/lib/dispatch-worker";

const payloadSchema = z.object({
    dispatchId: z.string().min(1),
    studentResultId: z.string().min(1),
});

export async function POST(request: Request) {
    const workerSecret = process.env.WORKER_SHARED_SECRET;

    if (workerSecret) {
        const providedSecret = request.headers.get("x-worker-secret");
        if (providedSecret !== workerSecret) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }

    const body = await request.json().catch(() => null);
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await processNotifyJob(parsed.data);
    if (!result.ok) {
        return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result);
}
