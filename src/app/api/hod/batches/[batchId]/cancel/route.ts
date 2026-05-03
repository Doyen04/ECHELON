import { NextResponse } from "next/server";
import { getHodSession } from "@/lib/hod-session";
import { prisma } from "@/lib/db";
import { filterBatchesByUserRole } from "@/lib/query-filters";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const session = await getHodSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { batchId } = await params;

  try {
    const filter = filterBatchesByUserRole(session.user);
    const batch = await prisma.resultBatch.findFirst({
      where: {
        id: batchId,
        ...filter,
        status: "PENDING", // Only pending batches can be cancelled
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found or cannot be cancelled" }, { status: 404 });
    }

    // Mark as archived or delete? 
    // The plan says "cancel", usually means archived or deleted if it's just pending.
    // Let's archive it by changing status to ARCHIVED if possible, or just delete it.
    // Looking at the schema, we don't have ARCHIVED status yet.
    // Let's just delete the pending batch and its student results.
    
    await prisma.resultBatch.delete({
      where: { id: batchId },
    });

    return NextResponse.json({ message: "Batch cancelled successfully" });
  } catch (error) {
    console.error("[HOD batch cancel] Error:", error);
    return NextResponse.json({ error: "Failed to cancel batch" }, { status: 500 });
  }
}
