import { NextResponse } from "next/server";

import { buildStudentResultPdfAttachment } from "@/lib/result-email-pdf";
import { findPortalTokenDetails, updatePortalTokenViewedAt } from "@/lib/repositories/admin-repository";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ token: string }> },
) {
    try {
        const { token } = await params;

        const portalToken = await findPortalTokenDetails(token);

        if (!portalToken) {
            return NextResponse.json({ error: "Token not found" }, { status: 404 });
        }

        if (portalToken.invalidated || portalToken.expiresAt <= new Date()) {
            return NextResponse.json({ error: "Token expired" }, { status: 410 });
        }

        if (!portalToken.viewedAt) {
            await updatePortalTokenViewedAt(token, new Date());
        }

        const result  = portalToken.studentResult;
        const student = result.student;
        const batch   = result.batch;
        const courses = Array.isArray(result.courses) ? result.courses : [];

        const attachment = await buildStudentResultPdfAttachment({
            studentName:     student.fullName,
            matricNumber:    student.matricNumber,
            department:      student.department ?? "Computer Science",
            faculty:         student.faculty    ?? "",
            level:           Number(student.level ?? 0),
            session:         String(batch.session),
            semester:        String(batch.semester),
            gpa:             Number(result.gpa  ?? 0),
            cgpa:            result.cgpa != null ? Number(result.cgpa) : null,
            courses,
            institutionName: "Mountain Top University",
            submissionId:    batch.id ?? null,
            logoUrl:         "/mtu-logo.png",
        });

        const buf = attachment.content as Buffer;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new Response(buf as any, {
            status: 200,
            headers: {
                "Content-Type":        "application/pdf",
                "Content-Disposition": `inline; filename="${attachment.filename}"`,
                "Cache-Control":       "private, max-age=300",
            },
        });
    } catch (error) {
        console.error("[GET /api/results/[token]/pdf]", error);
        return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
    }
}
