import { NextResponse } from "next/server";
import { getHodSession } from "@/lib/hod-session";
import { prisma } from "@/lib/db";
import { filterBatchesByUserRole } from "@/lib/query-filters";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ batchId: string }> }
) {
    const session = await getHodSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { batchId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
    const skip = (page - 1) * limit;
    const query = searchParams.get("q")?.trim();

    try {
        const filter = filterBatchesByUserRole(session.user);
        const studentResultWhere = {
            batchId,
            ...(query
                ? {
                    student: {
                        is: {
                            OR: [
                                { fullName: { contains: query, mode: "insensitive" } },
                                { matricNumber: { contains: query, mode: "insensitive" } },
                            ],
                        },
                    },
                }
                : {}),
        };

        const batch = await prisma.resultBatch.findFirst({
            where: {
                id: batchId,
                ...filter,
            },
            include: {
                program: true,
                uploadedBy: {
                    select: { name: true, email: true }
                },
                dispatches: {
                    select: {
                        id: true,
                        status: true,
                        triggeredAt: true,
                        totalCount: true,
                        sentCount: true,
                        failedCount: true,
                        triggeredBy: { select: { name: true } }
                    },
                    orderBy: { triggeredAt: "desc" }
                }
            }
        });

        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        const [studentResults, studentResultsTotal, statusGroups, gpaAggregate] = await Promise.all([
            prisma.studentResult.findMany({
                where: studentResultWhere,
                orderBy: { id: "desc" },
                skip,
                take: limit,
                select: {
                    id: true,
                    gpa: true,
                    cgpa: true,
                    status: true,
                    withheldReason: true,
                    student: {
                        select: {
                            fullName: true,
                            matricNumber: true,
                            level: true,
                        }
                    },
                    reviewedBy: {
                        select: { name: true }
                    }
                }
            }),
            prisma.studentResult.count({ where: studentResultWhere }),
            prisma.studentResult.groupBy({
                by: ["status"],
                where: { batchId },
                _count: { _all: true },
            }),
            prisma.studentResult.aggregate({
                where: { batchId },
                _avg: { gpa: true },
            }),
        ]);

        return NextResponse.json({
            ...batch,
            studentResults,
            studentResultsTotal,
            statusCounts: statusGroups.reduce((acc: Record<string, number>, row: any) => {
                acc[row.status] = row._count._all;
                return acc;
            }, {}),
            averageGpa: gpaAggregate?._avg?.gpa ?? null,
            pagination: {
                total: studentResultsTotal,
                pages: Math.max(1, Math.ceil(studentResultsTotal / limit)),
                currentPage: page,
                limit,
            },
        });
    } catch (error) {
        console.error("[HOD batch detail] Error:", error);
        return NextResponse.json({ error: "Failed to fetch batch" }, { status: 500 });
    }
}
