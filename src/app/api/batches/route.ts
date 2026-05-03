import { NextResponse } from "next/server";
import { listBatchesSummary } from "@/lib/repositories/admin-repository";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET() {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const batches = await listBatchesSummary();

        return NextResponse.json(batches);
    } catch (error) {
        console.error("Error fetching batches:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
