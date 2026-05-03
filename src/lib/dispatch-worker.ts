import { randomBytes } from "node:crypto";

import { sendEmail } from "@/lib/notifications/email-provider";
import { sendWhatsApp } from "@/lib/notifications/whatsapp-provider";
import { sendSms } from "@/lib/notifications/sms-provider";
import {
    createNotificationLog,
    createPortalToken,
    findNotificationDispatchById,
    findStudentResultForDispatch,
    findValidPortalToken,
    incrementDispatchProgress,
    updateDispatchStatus,
} from "@/lib/repositories/notification-repository";
import { buildResultNotificationEmailTemplate } from "@/lib/result-email-template";
import { buildStudentResultPdfAttachment } from "@/lib/result-email-pdf";
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
    const now = new Date();

    const existingToken = await findValidPortalToken(studentResultId, now);

    if (existingToken) {
        return existingToken.token as string;
    }

    const token = randomBytes(32).toString("hex");
    const expiryDays = Number(process.env.TOKEN_EXPIRY_DAYS ?? "30");
    const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

    await createPortalToken({
        studentResultId,
        token,
        expiresAt,
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
        studentResult: any;
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

            const attachments = [] as any[];
            try {
                const courseRows = Array.isArray(payload.studentResult?.courses)
                    ? payload.studentResult.courses
                    : [];
                const attachment = await buildStudentResultPdfAttachment({
                    studentName: payload.studentName,
                    matricNumber: payload.matricNumber,
                    department: payload.studentResult?.student?.department ?? "General",
                    faculty: payload.studentResult?.student?.faculty ?? "General",
                    level: Number(payload.studentResult?.student?.level ?? 100),
                    session: String(payload.studentResult?.batch?.session ?? "Unknown"),
                    semester: String(payload.studentResult?.batch?.semester ?? "Unknown"),
                    gpa: Number(payload.studentResult?.gpa ?? 0),
                    cgpa: payload.studentResult?.cgpa ?? null,
                    courses: courseRows,
                    institutionName: payload.studentResult?.batch?.institution?.name ?? payload.studentResult?.student?.institution?.name ?? "Mountain Top University",
                    logoUrl: payload.studentResult?.batch?.institution?.logoUrl ?? payload.studentResult?.student?.institution?.logoUrl ?? null,
                    submissionId: payload.studentResult?.batch?.id ?? null,
                });
                attachments.push(attachment);
            } catch {
                // Best-effort attachment generation should not block notifications.
            }

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
    const channelSelections = selectChannels(guardian);

    if (channelSelections.length === 0) {
        await createNotificationLog({
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
            studentResult,
        });

        await createNotificationLog({
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
    await incrementDispatchProgress(dispatchId, ok);

    const dispatch = await findNotificationDispatchById(dispatchId);

    if (!dispatch) {
        return;
    }

    const processed = (dispatch.sentCount as number) + (dispatch.failedCount as number);
    if (processed < (dispatch.totalCount as number)) {
        return;
    }

    await updateDispatchStatus(dispatchId, dispatch.failedCount > 0 ? "PARTIAL_FAILURE" : "COMPLETE");
}

export async function processNotifyJob(payload: NotifyJobPayload): Promise<DispatchWorkerResult> {
    try {
        const studentResult = await findStudentResultForDispatch(payload.studentResultId);

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
            await createNotificationLog({
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
