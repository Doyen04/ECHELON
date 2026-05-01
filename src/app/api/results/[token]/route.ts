import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const p = await params;
        const token = p.token;

        if (!token) {
            return NextResponse.json({ error: "Token missing" }, { status: 400 });
        }

        const portalToken = await prisma.portalToken.findUnique({
            where: { token },
            include: {
                studentResult: {
                    include: {
                        student: {
                            include: {
                                guardians: true,
                            },
                        },
                        batch: true,
                    },
                },
            },
        });

        if (!portalToken) {
            return NextResponse.json({ type: "not_found", error: "Token not found" }, { status: 404 });
        }

        if (portalToken.invalidated || portalToken.expiresAt <= new Date()) {
            return NextResponse.json({ type: "expired", error: "Token expired" }, { status: 410 });
        }

        if (!portalToken.viewedAt) {
            const now = new Date();
            await prisma.portalToken.update({
                where: { token },
                data: { viewedAt: now },
            });
            portalToken.viewedAt = now;
        }

        return NextResponse.json(portalToken);
    } catch (error) {
        console.error("Error fetching portal token:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
