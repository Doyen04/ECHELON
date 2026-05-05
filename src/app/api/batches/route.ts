import { NextResponse } from "next/server";
import { listBatchesSummary } from "@/lib/repositories/admin-repository";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET(request: Request) {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const programId = searchParams.get("programId");
    const level = searchParams.get("level");

    try {
        const batches = await listBatchesSummary();

        return NextResponse.json(batches);
    } catch (error) {
        console.error("Error fetching batches:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
