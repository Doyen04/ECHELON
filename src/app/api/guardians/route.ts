import { NextResponse } from "next/server";
import { listGuardiansWithStudent } from "@/lib/repositories/admin-repository";
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
    const query = searchParams.get("q") || undefined;

    try {
        const { guardians, total } = await listGuardiansWithStudent({
            skip,
            take: limit,
            query,
        });

        return NextResponse.json({
            guardians,
            pagination: {
                total,
                pages: Math.max(1, Math.ceil(total / limit)),
                currentPage: page,
                limit,
            },
        });
    } catch (error) {
        console.error("Error fetching guardians:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
