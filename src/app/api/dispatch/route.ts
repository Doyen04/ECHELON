import { NextResponse } from "next/server";
import { z } from "zod";

import { DispatchTriggerError, triggerDispatchForBatch } from "@/lib/dispatch-service";
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

    try {
        const dispatchResult = await triggerDispatchForBatch({
            batchId: parsed.data.batchId,
            triggeredById: session.user.id,
        });

        return NextResponse.json(dispatchResult);
    } catch (error) {
        if (error instanceof DispatchTriggerError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }

        return NextResponse.json({ error: "Failed to trigger dispatch." }, { status: 500 });
    }
}
