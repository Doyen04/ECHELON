import { NextResponse } from "next/server";
import { buildCsv } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

type RouteContext = {
    params: Promise<{
        batchId: string;
    }>;
};

export async function GET(_request: Request, context: RouteContext) {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { batchId } = await context.params;
    if (!batchId) {
        return NextResponse.json({ error: "Batch id is required." }, { status: 400 });
    }

    const db = prisma as any;
    const actor = await db.user.findUnique({
        where: { id: session.user.id },
        select: { institutionId: true },
    });

    if (!actor) {
        return NextResponse.json({ error: "Authenticated user not found." }, { status: 404 });
    }

    const batch = await db.resultBatch.findUnique({
        where: { id: batchId },
        select: { institutionId: true, department: true, session: true, semester: true },
    });

    if (!batch || batch.institutionId !== actor.institutionId) {
        return NextResponse.json({ error: "Batch not found." }, { status: 404 });
    }

    const studentResults = await db.studentResult.findMany({
        where: { batchId },
        include: {
            student: {
                select: { fullName: true, matricNumber: true },
            },
            portalTokens: {
                where: { invalidated: false },
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
    });

    const headers = [
        "student_name",
        "matric_number",
        "gpa",
        "cgpa",
        "status",
        "latest_portal_token",
        "token_expires_at",
    ];

    const rows = studentResults.map((result: any) => [
        result.student?.fullName ?? "Unknown",
        result.student?.matricNumber ?? result.studentId,
        result.gpa,
        result.cgpa ?? "",
        result.status,
        result.portalTokens[0]?.token ?? "",
        result.portalTokens[0]?.expiresAt ? result.portalTokens[0].expiresAt.toISOString() : "",
    ]);

    const csv = buildCsv(headers, rows);
    const filename = `batch-detail-${batchId}.csv`;

    return new Response(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename=\"${filename}\"`,
            "Cache-Control": "no-store",
        },
    });
}
