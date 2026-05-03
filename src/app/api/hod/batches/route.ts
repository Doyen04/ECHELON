import { NextResponse } from "next/server";
import { getHodSession } from "@/lib/hod-session";
import { prisma } from "@/lib/db";
import { filterBatchesByUserRole } from "@/lib/query-filters";

export async function GET() {
  const session = await getHodSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const filter = filterBatchesByUserRole(session.user);
    const batches = await prisma.resultBatch.findMany({
      where: filter,
      include: {
        program: true,
        uploadedBy: {
          select: { name: true, email: true }
        },
        _count: {
          select: { studentResults: true }
        }
      },
      orderBy: { uploadedAt: "desc" }
    });

    return NextResponse.json({ batches });
  } catch (error) {
    console.error("[HOD batches] Error:", error);
    return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 });
  }
}
