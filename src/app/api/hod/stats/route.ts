import { NextResponse } from "next/server";
import { getHodSession } from "@/lib/hod-session";
import { prisma } from "@/lib/db";
import { filterBatchesByUserRole, filterProgramsByUserRole } from "@/lib/query-filters";

export async function GET() {
  const session = await getHodSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const batchFilter = filterBatchesByUserRole(session.user);
    const programFilter = filterProgramsByUserRole(session.user);

    const [totalBatches, pendingBatches, approvedBatches, totalPrograms] = await Promise.all([
      prisma.resultBatch.count({ where: batchFilter }),
      prisma.resultBatch.count({ where: { ...batchFilter, status: "PENDING" } }),
      prisma.resultBatch.count({ where: { ...batchFilter, status: "APPROVED" } }),
      prisma.program.count({ where: programFilter }),
    ]);

    const recentBatches = await prisma.resultBatch.findMany({
      where: batchFilter,
      orderBy: { uploadedAt: "desc" },
      take: 5,
      select: {
        id: true,
        session: true,
        semester: true,
        level: true,
        status: true,
        uploadedAt: true,
        program: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json({
      stats: {
        totalBatches,
        pendingBatches,
        approvedBatches,
        totalPrograms,
      },
      recentBatches,
    });
  } catch (error) {
    console.error("[HOD stats] Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
