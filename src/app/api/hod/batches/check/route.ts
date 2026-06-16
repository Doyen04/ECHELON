import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHodSession } from "@/lib/hod-session";
import { checkDuplicateBatch, parseSemester } from "@/lib/hod-upload-validation";

export async function GET(request: Request) {
    const session = await getHodSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("programId");
    const academicSession = searchParams.get("session");
    const semester = parseSemester(searchParams.get("semester") ?? "");
    const level = parseInt(searchParams.get("level") || "");

    if (!programId || !academicSession || !semester || isNaN(level)) {
        return NextResponse.json(
            { error: "Missing required query parameters" },
            { status: 400 }
        );
    }

    // Verify program belongs to HOD's department
    const program = await prisma.program.findUnique({
        where: { id: programId },
        select: { departmentId: true },
    });

    if (!program || program.departmentId !== session.user.departmentId) {
        return NextResponse.json(
            { error: "Program not found or unauthorized" },
            { status: 403 }
        );
    }

    try {
        const existing = await checkDuplicateBatch(
            programId,
            academicSession,
            semester,
            level
        );

        return NextResponse.json({
            exists: !!existing,
            batch: existing,
        });
    } catch (error) {
        console.error("[HOD duplicate check] Error:", error);
        return NextResponse.json(
            { error: "Failed to check for duplicates" },
            { status: 500 }
        );
    }
}
