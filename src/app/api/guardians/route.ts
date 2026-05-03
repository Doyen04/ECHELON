import { NextResponse } from "next/server";
import { listGuardiansWithStudent } from "@/lib/repositories/admin-repository";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET() {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const guardians = await listGuardiansWithStudent();

        return NextResponse.json({ guardians });
    } catch (error) {
        console.error("Error fetching guardians:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
