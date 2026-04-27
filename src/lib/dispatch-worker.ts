import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/notifications/email-provider";
import { sendWhatsApp } from "@/lib/notifications/whatsapp-provider";
import { sendSms } from "@/lib/notifications/sms-provider";
import { buildResultNotificationEmailTemplate } from "@/lib/result-email-template";
import { buildStudentScopedPdfAttachment } from "@/lib/result-email-pdf";
import type { NotifyJobPayload } from "@/lib/queue";

type DispatchWorkerResult = {
    ok: boolean;
    message: string;
    channel?: "WHATSAPP" | "EMAIL" | "SMS";
};

type ProviderSendResult = {
    ok: boolean;
    providerMessageId: string | null;
    status: "SENT" | "FAILED";
    failureReason?: string;
};

type ChannelSelection = {
    channel: "WHATSAPP" | "EMAIL" | "SMS";
    destination: string;
};

function selectChannels(guardian: any): ChannelSelection[] {
    const channels: ChannelSelection[] = [];

    if (guardian.email) {
        channels.push({ channel: "EMAIL", destination: guardian.email });
    }

    if (guardian.phone) {
        channels.push({ channel: "WHATSAPP", destination: guardian.phone });
        channels.push({ channel: "SMS", destination: guardian.phone });
    }

    return channels;
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
        semesterLabel: string;
        portalLink: string;
    },
) {
    if (channelSelection.channel === "EMAIL") {
        try {
            const emailTemplate = buildResultNotificationEmailTemplate({
                parentName: payload.parentName,
                studentName: payload.studentName,
                matricNumber: payload.matricNumber,
                semesterLabel: payload.semesterLabel,
                portalLink: payload.portalLink,
            });

            // Try to attach a per-student PDF slice when available.
            const attachments = [] as any[];
            try {
                // studentResult batch rawFileUrl may exist on the batch in the DB; lookup is done by caller.
                // If the caller provides batch.rawFileUrl on payload, use it; otherwise attempt to read via DB.
                // Here payload doesn't include rawFileUrl, so attempt best-effort via studentResult reference.
            } catch {
                // ignore
            }

            // Build attachment using batch rawFileUrl if present on the studentResult object
            try {
                // payload doesn't include batch info here; but the caller passes `studentResult` as the payload's context when invoking.
            } catch { }

            // If we can access the batch rawFileUrl via closure, prefer it. As a pragmatic approach, try reading from the DB now.
            try {
                const db = prisma as any;
                const batch = await db.resultBatch.findUnique({ where: { id: (payload as any).batchId ?? null }, select: { rawFileUrl: true } }).catch(() => null);
                if (batch?.rawFileUrl) {
                    const attach = await buildStudentScopedPdfAttachment(batch.rawFileUrl, payload.matricNumber).catch(() => null);
                    if (attach) attachments.push(attach);
                }
            } catch { }

            const response = await sendEmail({
                to: channelSelection.destination,
                subject: emailTemplate.subject,
                text: emailTemplate.text,
                attachments: attachments.length > 0 ? attachments : undefined,
            });

            if (!response.ok) {
                return {
                    ok: false,
                    providerMessageId: null,
                    status: "FAILED",
                    failureReason: response.failureReason ?? "Email provider rejected message.",
                } satisfies ProviderSendResult;
            }

            return {
                ok: true,
                providerMessageId: response.providerMessageId,
                status: "SENT",
            } satisfies ProviderSendResult;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown SMTP provider error.";
            return {
                ok: false,
                providerMessageId: null,
                status: "FAILED",
                failureReason: `Email send failed: ${message}`,
            } satisfies ProviderSendResult;
        }
    }

    if (channelSelection.channel === "WHATSAPP") {
        try {
            const response = await sendWhatsApp({
                to: channelSelection.destination,
                templateParams: [payload.parentName, payload.semesterLabel, payload.studentName, payload.matricNumber, payload.portalLink],
            });

            if (!response.ok) {
                return {
                    ok: false,
                    providerMessageId: null,
                    status: "FAILED",
                    failureReason: response.failureReason ?? "WhatsApp provider rejected message.",
                } satisfies ProviderSendResult;
            }

            return {
                ok: true,
                providerMessageId: response.providerMessageId,
                status: "SENT",
            } satisfies ProviderSendResult;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown WhatsApp provider error.";
            return {
                ok: false,
                providerMessageId: null,
                status: "FAILED",
                failureReason: `WhatsApp send failed: ${message}`,
            } satisfies ProviderSendResult;
        }
    }

    if (channelSelection.channel === "SMS") {
        try {
            const text = `Hello ${payload.parentName}, the ${payload.semesterLabel} results for ${payload.studentName} (${payload.matricNumber}) are ready. View here: ${payload.portalLink}`;
            const response = await sendSms({
                to: channelSelection.destination,
                text,
            });

            if (!response.ok) {
                return {
                    ok: false,
                    providerMessageId: null,
                    status: "FAILED",
                    failureReason: response.failureReason ?? "SMS provider rejected message.",
                } satisfies ProviderSendResult;
            }

            return {
                ok: true,
                providerMessageId: response.providerMessageId,
                status: "SENT",
            } satisfies ProviderSendResult;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown SMS provider error.";
            return {
                ok: false,
                providerMessageId: null,
                status: "FAILED",
                failureReason: `SMS send failed: ${message}`,
            } satisfies ProviderSendResult;
        }
    }

    return {
        ok: false,
        providerMessageId: null,
        status: "FAILED" as const,
        failureReason: `${channelSelection.channel} delivery is not implemented yet.`,
    } satisfies ProviderSendResult;
}

async function sendGuardianNotifications(
    guardian: any,
    studentResult: any,
    portalLink: string,
) {
    const db = prisma as any;
    const channelSelections = selectChannels(guardian);

    if (channelSelections.length === 0) {
        await db.notificationLog.create({
            data: {
                dispatchId: studentResult.dispatchId,
                studentResultId: studentResult.id,
                studentId: studentResult.studentId,
                guardianId: guardian.id,
                channel: "EMAIL",
                status: "FAILED",
                failureReason: "Guardian has no contact details.",
            },
        });

        return {
            ok: false,
            channel: null as ChannelSelection | null,
            sentCount: 0,
            failedCount: 1,
            failureReason: "Guardian has no contact details.",
        };
    }

    let finalSendResult: ProviderSendResult | null = null;
    let successChannel: "EMAIL" | "WHATSAPP" | "SMS" | null = null;

    for (const channelSelection of channelSelections) {
        const sendResult = await sendNotification(channelSelection, {
            parentName: guardian.name,
            studentName: studentResult.student.fullName,
            matricNumber: studentResult.student.matricNumber,
            semesterLabel: `${studentResult.batch.session} ${studentResult.batch.semester}`,
            portalLink,
        });

        await db.notificationLog.create({
            data: {
                dispatchId: studentResult.dispatchId,
                studentResultId: studentResult.id,
                studentId: studentResult.studentId,
                guardianId: guardian.id,
                channel: channelSelection.channel,
                status: sendResult.ok ? sendResult.status : "FAILED",
                providerMessageId: sendResult.providerMessageId,
                failureReason: sendResult.ok ? null : (sendResult.failureReason ?? "Provider rejected message."),
                deliveredAt: sendResult.status === "SENT" ? new Date() : null,
            },
        });

        if (sendResult.ok) {
            finalSendResult = sendResult;
            successChannel = channelSelection.channel;
            break; // Stop at the first successful channel
        }
    }

    return {
        ok: !!finalSendResult,
        channel: successChannel,
        sentCount: finalSendResult ? 1 : 0,
        failedCount: finalSendResult ? 0 : 1,
        failureReason: finalSendResult ? null : "All attempted channels failed.",
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

    try {
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

        const guardians = studentResult.student.guardians as any[];

        if (guardians.length === 0) {
            await db.notificationLog.create({
                data: {
                    dispatchId: payload.dispatchId,
                    studentResultId: studentResult.id,
                    studentId: studentResult.studentId,
                    channel: "EMAIL",
                    status: "FAILED",
                    failureReason: "No guardian contact records available.",
                },
            });

            await markDispatchProgress(payload.dispatchId, false);
            return { ok: false, message: "No guardian contact records available." };
        }

        const token = await getOrCreatePortalToken(studentResult.id);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const portalLink = `${appUrl}/results/view?token=${token}`;

        let sentCount = 0;
        let failedCount = 0;

        for (const guardian of guardians) {
            const result = await sendGuardianNotifications(guardian, {
                ...studentResult,
                dispatchId: payload.dispatchId,
            }, portalLink);

            sentCount += result.sentCount;
            failedCount += result.failedCount;
        }

        await markDispatchProgress(payload.dispatchId, sentCount > 0);

        return {
            ok: sentCount > 0,
            message: sentCount > 0 ? "Notification processed." : "Notification failed.",
            channel: sentCount > 0 ? "EMAIL" : undefined,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown dispatch worker error.";
        await markDispatchProgress(payload.dispatchId, false);
        return {
            ok: false,
            message: `Dispatch worker failed: ${message}`,
        };
    }
}
