import { NextResponse } from "next/server";
import { listPendingAndReviewedBatches } from "@/lib/repositories/admin-repository";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET() {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {

        const [pendingBatches, reviewedBatches] = await listPendingAndReviewedBatches();

        return NextResponse.json({ pendingBatches, reviewedBatches });
    } catch (error) {
        console.error("Error fetching approvals:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
