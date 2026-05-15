import { NextResponse } from "next/server";
import { listPendingAndReviewedBatches } from "@/lib/repositories/admin-repository";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET(request: Request) {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reviewedPage = Math.max(1, parseInt(searchParams.get("reviewedPage") || "1", 10));
    const reviewedLimit = Math.max(1, parseInt(searchParams.get("reviewedLimit") || "10", 10));
    const reviewedSkip = (reviewedPage - 1) * reviewedLimit;

    try {
        const { pendingBatches, reviewedBatches, reviewedTotal } = await listPendingAndReviewedBatches({
            reviewedSkip,
            reviewedTake: reviewedLimit,
        });

        return NextResponse.json({
            pendingBatches,
            reviewedBatches,
            reviewedPagination: {
                total: reviewedTotal,
                pages: Math.max(1, Math.ceil(reviewedTotal / reviewedLimit)),
                currentPage: reviewedPage,
                limit: reviewedLimit,
            },
        });
    } catch (error) {
        console.error("Error fetching approvals:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
