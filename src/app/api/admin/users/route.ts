import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/hod-session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { institutionId: session.user.institutionId },
      include: { department: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[Admin users] Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
