import { NextResponse } from "next/server";
import { listRecentDispatches } from "@/lib/repositories/admin-repository";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET() {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const dispatches = await listRecentDispatches();

        return NextResponse.json({ dispatches });
    } catch (error) {
        console.error("Error fetching dispatches:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
