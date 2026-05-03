import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/hod-session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ departmentId: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { departmentId } = await params;

  try {
    const programs = await prisma.program.findMany({
      where: { departmentId },
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(programs);
  } catch (error) {
    console.error("[Admin programs list] Error:", error);
    return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 });
  }
}
