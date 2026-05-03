import { NextResponse } from "next/server";
import { getHodSession } from "@/lib/hod-session";
import { getProgramsForHod } from "@/lib/hod-upload-validation";

export async function GET() {
  const session = await getHodSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const programs = await getProgramsForHod(session.user.departmentId);
    return NextResponse.json({ programs });
  } catch (error) {
    console.error("[HOD programs] Error:", error);
    return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 });
  }
}
