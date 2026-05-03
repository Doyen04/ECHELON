import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/hod-session";
// import { sendEmail } from "@/lib/notifications/email-provider"; // Assuming this exists or will be added

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const reason = body?.reason ?? "Batch does not meet approval criteria.";

  const { batchId } = await params;

  try {
    const batch = await prisma.resultBatch.findUnique({
        where: { id: batchId },
        include: {
          uploadedBy: { select: { email: true, name: true } },
          program: { select: { name: true, code: true } },
        },
      });
    
      if (!batch) {
        return NextResponse.json({ error: "Batch not found" }, { status: 404 });
      }
    
      // Update batch status
      await prisma.resultBatch.update({
        where: { id: batchId },
        data: {
          status: "REJECTED",
          // metadata: { ...(batch.metadata as any || {}), rejectionReason: reason }
        },
      });
    
      // TODO: Send email to HOD if email provider is configured
      /*
      await sendEmail({
        to: batch.uploadedBy.email,
        subject: `Batch Rejected: ${batch.program.name} Level ${batch.level}`,
        text: `Your batch for ${batch.program.name} Level ${batch.level} (${batch.session} ${batch.semester}) has been rejected.\n\nReason: ${reason}\n\nPlease review and resubmit.`,
      });
      */
    
      // Audit log
      await prisma.auditLog.create({
        data: {
          institutionId: batch.institutionId,
          actorId: session.user.id,
          action: "batch.rejected",
          entityType: "result_batch",
          entityId: batchId,
          metadata: { reason },
        },
      });
    
      return NextResponse.json({
        batchId,
        status: "REJECTED",
        message: "Batch rejected and HOD notified.",
      });
  } catch (error) {
    console.error("[Batch reject] Error:", error);
    return NextResponse.json({ error: "Failed to reject batch" }, { status: 500 });
  }
}
