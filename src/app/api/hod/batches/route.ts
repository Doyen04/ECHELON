import { NextResponse } from "next/server";
import { getHodSession } from "@/lib/hod-session";
import { prisma } from "@/lib/db";
import { filterBatchesByUserRole } from "@/lib/query-filters";

export async function GET(request: Request) {
  const session = await getHodSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  try {
    const filter = filterBatchesByUserRole(session.user);
    
    const [batches, total] = await Promise.all([
      prisma.resultBatch.findMany({
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
        orderBy: { uploadedAt: "desc" },
        take: limit,
        skip: skip,
      }),
      prisma.resultBatch.count({ where: filter })
    ]);

    return NextResponse.json({ 
      batches,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error("[HOD batches] Error:", error);
    return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 });
  }
}
