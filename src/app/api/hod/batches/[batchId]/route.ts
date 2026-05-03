import { NextResponse } from "next/server";
import { getHodSession } from "@/lib/hod-session";
import { prisma } from "@/lib/db";
import { filterBatchesByUserRole } from "@/lib/query-filters";

export async function GET(
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
      },
      include: {
        program: true,
        uploadedBy: {
          select: { name: true, email: true }
        },
        studentResults: {
          include: {
            student: true,
            reviewedBy: {
              select: { name: true }
            }
          }
        },
        dispatches: {
            include: {
                triggeredBy: { select: { name: true } }
            },
            orderBy: { triggeredAt: "desc" }
        }
      }
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error("[HOD batch detail] Error:", error);
    return NextResponse.json({ error: "Failed to fetch batch" }, { status: 500 });
  }
}
