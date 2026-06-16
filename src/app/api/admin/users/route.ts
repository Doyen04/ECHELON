import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/hod-session";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { institutionId: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { institutionId: user.institutionId },
        include: { department: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: skip,
      }),
      prisma.user.count({ where: { institutionId: user.institutionId } })
    ]);

    return NextResponse.json({ 
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error("[Admin users] Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
