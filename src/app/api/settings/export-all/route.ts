import { NextResponse } from "next/server";
import JSZip from "jszip";
import { buildCsv } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET() {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = prisma as any;
    let actor = await db.user.findUnique({
        where: { id: session.user.id },
        select: { institutionId: true },
    });

    // fallback: sometimes the session may not contain a matching id (tokens differ).
    // Try resolving by email when available before failing.
    if (!actor && session.user.email) {
        actor = await db.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, institutionId: true },
        });
    }

    if (!actor) {
        return NextResponse.json({ error: "Authenticated user not found." }, { status: 404 });
    }

    const zip = new JSZip();
    const institutionId = actor.institutionId;

    // 1. Batches
    const batches = await db.resultBatch.findMany({
        where: { institutionId },
        include: { uploadedBy: { select: { name: true } } },
    });
    const batchesCsv = buildCsv(
        ["batch_id", "session", "semester", "department", "status", "uploader", "uploaded_at"],
        batches.map((b: any) => [b.id, b.session, b.semester, b.department, b.status, b.uploadedBy?.name, b.uploadedAt.toISOString()])
    );
    zip.file("batches.csv", batchesCsv);

    // 2. Audit Logs
    const auditLogs = await db.auditLog.findMany({
        where: { institutionId },
        include: { actor: { select: { name: true } } },
    });
    const auditCsv = buildCsv(
        ["timestamp", "actor", "action", "entity_type", "entity_id", "metadata"],
        auditLogs.map((l: any) => [l.createdAt.toISOString(), l.actor?.name, l.action, l.entityType, l.entityId, JSON.stringify(l.metadata)])
    );
    zip.file("audit_logs.csv", auditCsv);

    // 3. Delivery Summary
    const dispatches = await db.notificationDispatch.findMany({
        where: { batch: { is: { institutionId } } },
        include: { triggeredBy: { select: { name: true } } },
    });
    const dispatchCsv = buildCsv(
        ["dispatch_id", "batch_id", "status", "total", "sent", "failed", "triggered_by", "triggered_at"],
        dispatches.map((d: any) => [d.id, d.batchId, d.status, d.totalCount, d.sentCount, d.failedCount, d.triggeredBy?.name, d.triggeredAt.toISOString()])
    );
    zip.file("delivery_summary.csv", dispatchCsv);

    const content = await zip.generateAsync({ type: "uint8array" });
    const body = Uint8Array.from(content).buffer;
    const filename = `full-export-${new Date().toISOString().split("T")[0]}.zip`;

    return new Response(body, {
        headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename=\"${filename}\"`,
            "Cache-Control": "no-store",
        },
    });
}
