import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/hod-session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const departments = await prisma.department.findMany({
      where: { institutionId: session.user.institutionId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error("[Admin depts] Error:", error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}
