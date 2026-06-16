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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
    const skip = (page - 1) * limit;
    const query = searchParams.get("q")?.trim();
    const level = searchParams.get("level")?.trim();
    const status = searchParams.get("status")?.trim();

    try {
        const filter = filterBatchesByUserRole(session.user) as any;
        const where = {
            ...filter,
            ...(level ? { level: Number(level) } : {}),
            ...(status ? { status } : {}),
            ...(query
                ? {
                    OR: [
                        { session: { contains: query, mode: "insensitive" } },
                        { department: { contains: query, mode: "insensitive" } },
                        { program: { name: { contains: query, mode: "insensitive" } } },
                    ],
                }
                : {}),
        };

        const [batches, total] = await Promise.all([
            prisma.resultBatch.findMany({
                where,
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
            prisma.resultBatch.count({ where })
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
