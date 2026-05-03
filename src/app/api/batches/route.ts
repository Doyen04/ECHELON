import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET(request: Request) {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const programId = searchParams.get("programId");
    const level = searchParams.get("level");

    try {
        const where: any = {};
        if (departmentId) {
            where.program = { departmentId };
        }
        if (programId) {
            where.programId = programId;
        }
        if (level) {
            where.level = parseInt(level);
        }

        const batches = await prisma.resultBatch.findMany({
            where,
            orderBy: { uploadedAt: "desc" },
            take: 200, // Reasonable hard limit to ensure speed without breaking most views
            select: {
                id: true,
                session: true,
                semester: true,
                department: true,
                program: {
                    select: {
                        id: true,
                        name: true,
                        department: { select: { id: true, name: true } }
                    }
                },
                level: true,
                source: true,
                status: true,
                uploadedAt: true,
                uploadedBy: { select: { name: true } },
                _count: {
                    select: {
                        studentResults: true,
                    },
                },
            },
        });

        return NextResponse.json(batches);
    } catch (error) {
        console.error("Error fetching batches:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
