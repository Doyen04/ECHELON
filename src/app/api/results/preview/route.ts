import { NextResponse } from "next/server";

import { findStudentResultByBatchAndMatric } from "@/lib/repositories/admin-repository";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET(request: Request) {
    try {
        const session = await getSuperAdminSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const batchId = searchParams.get("batchId");
        const matric = searchParams.get("matric");

        if (!batchId || !matric) {
            return NextResponse.json({ error: "batchId and matric are required" }, { status: 400 });
        }

        const studentResult = await findStudentResultByBatchAndMatric(batchId, matric);

        if (!studentResult) {
            return NextResponse.json({ type: "not_found", error: "Student result not found" }, { status: 404 });
        }

        // Return same shape as /api/results/[token] so the page component can consume it identically
        const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return NextResponse.json({
            studentResult,
            expiresAt: thirtyDays,
            viewedAt: null,
            isPreview: true,
        });
    } catch (error) {
        console.error("Error fetching preview result:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
