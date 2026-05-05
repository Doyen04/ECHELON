import { NextResponse } from "next/server";
import { findBatchDispatchDetails } from "@/lib/repositories/admin-repository";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ batchId: string }> }
) {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const p = await params;
        const batchId = p.batchId;

        const batch = await findBatchDispatchDetails(batchId);

        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        return NextResponse.json(batch);
    } catch (error) {
        console.error("Error fetching batch dispatch details:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
