import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/super-admin-session";

export async function GET(request: Request) {
    const session = await getSuperAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    try {
        const [guardians, total] = await Promise.all([
            prisma.guardian.findMany({
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: skip,
                include: {
                    student: {
                        select: {
                            id: true,
                            fullName: true,
                            matricNumber: true,
                            department: true,
                            faculty: true,
                            level: true,
                        },
                    },
                },
            }),
            prisma.guardian.count()
        ]);

        return NextResponse.json({ 
            guardians,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.error("Error fetching guardians:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
