import { NextResponse } from "next/server";
import { listBatchesSummary } from "@/lib/repositories/admin-repository";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET(request: Request) {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
    const skip = (page - 1) * limit;
    const departmentId = searchParams.get("departmentId");
    const programId = searchParams.get("programId");
    const level = searchParams.get("level");
    const query = searchParams.get("q");

    try {
        const { batches, total } = await listBatchesSummary({
            skip,
            take: limit,
            departmentId,
            programId,
            level,
            query,
        });

        return NextResponse.json({
            batches,
            pagination: {
                total,
                pages: Math.max(1, Math.ceil(total / limit)),
                currentPage: page,
                limit,
            },
        });
    } catch (error) {
        console.error("Error fetching batches:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
