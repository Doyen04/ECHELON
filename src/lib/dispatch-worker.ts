import { randomBytes } from "node:crypto";

import { Resend } from "resend";

import { prisma } from "@/lib/db";
import type { NotifyJobPayload } from "@/lib/queue";

type DispatchWorkerResult = {
    ok: boolean;
    message: string;
    channel?: "WHATSAPP" | "EMAIL" | "SMS";
};

type ChannelSelection = {
    channel: "WHATSAPP" | "EMAIL" | "SMS";
    destination: string;
};

function buildChannelPriority(preferredChannel: string) {
    if (preferredChannel === "EMAIL") {
        return ["EMAIL", "WHATSAPP", "SMS"] as const;
    }
    if (preferredChannel === "SMS") {
        return ["SMS", "WHATSAPP", "EMAIL"] as const;
    }
    return ["WHATSAPP", "EMAIL", "SMS"] as const;
}

function selectChannel(guardian: any): ChannelSelection | null {
    const channels = buildChannelPriority(guardian.preferredChannel ?? "WHATSAPP");

    for (const channel of channels) {
        if ((channel === "WHATSAPP" || channel === "SMS") && guardian.phone) {
            return { channel, destination: guardian.phone };
        }
        if (channel === "EMAIL" && guardian.email) {
            return { channel, destination: guardian.email };
        }
    }

    return null;
}

async function getOrCreatePortalToken(studentResultId: string) {
    const db = prisma as any;
    const now = new Date();

    const existingToken = await db.portalToken.findFirst({
        where: {
            studentResultId,
            invalidated: false,
            expiresAt: { gt: now },
        },
        orderBy: { createdAt: "desc" },
    });

    if (existingToken) {
        return existingToken.token as string;
    }

    const token = randomBytes(32).toString("hex");
    const expiryDays = Number(process.env.TOKEN_EXPIRY_DAYS ?? "30");
    const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

    await db.portalToken.create({
        data: {
            studentResultId,
            token,
            expiresAt,
        },
    });

    return token;
}

async function sendNotification(
    channelSelection: ChannelSelection,
    payload: {
        parentName: string;
        studentName: string;
        matricNumber: string;
        semester: string;
        portalLink: string;
    },
) {
    const notificationMode = process.env.NOTIFICATION_ENV ?? "mock";

    if (notificationMode === "mock") {
        return {
            ok: true,
            providerMessageId: `mock-${Date.now()}`,
            status: "DELIVERED" as const,
        };
    }

    if (channelSelection.channel === "EMAIL" && process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL ?? "Results <noreply@example.edu>",
            to: channelSelection.destination,
            subject: `[Result Notification] ${payload.studentName} - ${payload.semester}`,
            text: `Hello ${payload.parentName}, the results for ${payload.studentName} (${payload.matricNumber}) are ready. View full details: ${payload.portalLink}`,
        });

        return {
            ok: true,
            providerMessageId: `resend-${Date.now()}`,
            status: "SENT" as const,
        };
    }

    return {
        ok: true,
        providerMessageId: `${channelSelection.channel.toLowerCase()}-${Date.now()}`,
        status: "SENT" as const,
    };
}

async function markDispatchProgress(dispatchId: string, ok: boolean) {
    const db = prisma as any;

    await db.notificationDispatch.update({
        where: { id: dispatchId },
        data: {
            status: "PROCESSING",
            sentCount: { increment: ok ? 1 : 0 },
            failedCount: { increment: ok ? 0 : 1 },
        },
    });

    const dispatch = await db.notificationDispatch.findUnique({ where: { id: dispatchId } });

    if (!dispatch) {
        return;
    }

    const processed = (dispatch.sentCount as number) + (dispatch.failedCount as number);
    if (processed < (dispatch.totalCount as number)) {
        return;
    }

    await db.notificationDispatch.update({
        where: { id: dispatchId },
        data: {
            status: dispatch.failedCount > 0 ? "PARTIAL_FAILURE" : "COMPLETE",
        },
    });
}

export async function processNotifyJob(payload: NotifyJobPayload): Promise<DispatchWorkerResult> {
    const db = prisma as any;

    const studentResult = await db.studentResult.findUnique({
        where: { id: payload.studentResultId },
        include: {
            student: {
                include: {
                    guardians: true,
                },
            },
            batch: true,
        },
    });

    if (!studentResult) {
        await markDispatchProgress(payload.dispatchId, false);
        return { ok: false, message: "Student result not found." };
    }

    if (studentResult.status !== "APPROVED") {
        await markDispatchProgress(payload.dispatchId, false);
        return { ok: false, message: "Result is not approved for dispatch." };
    }

    const guardians = (studentResult.student.guardians as any[]).filter(
        (guardian) => guardian.ndprConsent === true,
    );

    const guardian = guardians[0];
    if (!guardian) {
        await db.notificationLog.create({
            data: {
                dispatchId: payload.dispatchId,
                studentResultId: studentResult.id,
                studentId: studentResult.studentId,
                channel: "EMAIL",
                status: "FAILED",
                failureReason: "No guardian with valid NDPR consent.",
            },
        });

        await markDispatchProgress(payload.dispatchId, false);
        return { ok: false, message: "No guardian with valid NDPR consent." };
    }

    const channelSelection = selectChannel(guardian);
    if (!channelSelection) {
        await db.notificationLog.create({
            data: {
                dispatchId: payload.dispatchId,
                studentResultId: studentResult.id,
                studentId: studentResult.studentId,
                guardianId: guardian.id,
                channel: "EMAIL",
                status: "FAILED",
                failureReason: "Guardian has no sendable channel details.",
            },
        });

        await markDispatchProgress(payload.dispatchId, false);
        return { ok: false, message: "Guardian has no sendable channel details." };
    }

    const token = await getOrCreatePortalToken(studentResult.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const portalLink = `${appUrl}/results/view?token=${token}`;

    const sendResult = await sendNotification(channelSelection, {
        parentName: guardian.name,
        studentName: studentResult.student.fullName,
        matricNumber: studentResult.student.matricNumber,
        semester: `${studentResult.batch.session} ${studentResult.batch.semester}`,
        portalLink,
    });

    await db.notificationLog.create({
        data: {
            dispatchId: payload.dispatchId,
            studentResultId: studentResult.id,
            studentId: studentResult.studentId,
            guardianId: guardian.id,
            channel: channelSelection.channel,
            status: sendResult.ok ? sendResult.status : "FAILED",
            providerMessageId: sendResult.providerMessageId,
            failureReason: sendResult.ok ? null : "Provider rejected message.",
            deliveredAt: sendResult.status === "DELIVERED" ? new Date() : null,
        },
    });

    await markDispatchProgress(payload.dispatchId, sendResult.ok);

    return {
        ok: sendResult.ok,
        message: sendResult.ok ? "Notification processed." : "Notification failed.",
        channel: channelSelection.channel,
    };
}
