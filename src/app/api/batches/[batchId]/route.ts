import { NextResponse } from "next/server";
import { findBatchDetails } from "@/lib/repositories/admin-repository";
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
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
        const skip = (page - 1) * limit;
        const query = searchParams.get("q") || undefined;

        const batch = await findBatchDetails(batchId, {
            skip,
            take: limit,
            query,
        });

        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        return NextResponse.json({
            ...batch,
            pagination: {
                total: batch.studentResultsTotal,
                pages: Math.max(1, Math.ceil(batch.studentResultsTotal / limit)),
                currentPage: page,
                limit,
            },
        });
    } catch (error) {
        console.error("Error fetching batch details:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
