import { NextResponse } from "next/server";

import { getFailedSendPreview, retryFailedDispatchSends } from "@/lib/delivery-retry";
import { getSuperAdminSession } from "@/lib/super-admin-session";

type RouteContext = {
    params: Promise<{
        dispatchId: string;
    }>;
};

export async function GET(_request: Request, context: RouteContext) {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dispatchId } = await context.params;
    if (!dispatchId) {
        return NextResponse.json({ error: "Dispatch id is required." }, { status: 400 });
    }

    try {
        const preview = await getFailedSendPreview(dispatchId);
        return NextResponse.json(preview);
    } catch {
        return NextResponse.json({ error: "Failed to load failed sends." }, { status: 500 });
    }
}

export async function POST(_request: Request, context: RouteContext) {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dispatchId } = await context.params;
    if (!dispatchId) {
        return NextResponse.json({ error: "Dispatch id is required." }, { status: 400 });
    }

    try {
        const result = await retryFailedDispatchSends(dispatchId);
        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to retry failed sends.";
        return NextResponse.json({ error: message }, { status: 422 });
    }
}