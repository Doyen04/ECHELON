import { NextResponse } from "next/server";
import { buildCsv } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET() {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = prisma as any;
    const actor = await db.user.findUnique({
        where: { id: session.user.id },
        select: { institutionId: true },
    });

    if (!actor) {
        return NextResponse.json({ error: "Authenticated user not found." }, { status: 404 });
    }

    const batches = await db.resultBatch.findMany({
        where: { institutionId: actor.institutionId },
        orderBy: { uploadedAt: "desc" },
        include: {
            uploadedBy: { select: { name: true } },
            _count: {
                select: { studentResults: true },
            },
        },
    });

    const headers = [
        "batch_id",
        "session",
        "semester",
        "department",
        "source",
        "status",
        "student_count",
        "uploader",
        "uploaded_at",
    ];

    const rows = batches.map((batch: any) => [
        batch.id,
        batch.session,
        batch.semester,
        batch.department,
        batch.source,
        batch.status,
        batch._count.studentResults,
        batch.uploadedBy?.name ?? "System",
        batch.uploadedAt.toISOString(),
    ]);

    const csv = buildCsv(headers, rows);
    const filename = `batches-${new Date().toISOString().split("T")[0]}.csv`;

    return new Response(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename=\"${filename}\"`,
            "Cache-Control": "no-store",
        },
    });
}
