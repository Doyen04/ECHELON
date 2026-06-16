import { randomBytes } from "node:crypto";

import nodemailer from "nodemailer";
import { Resend } from "resend";

import type { NotifyJobPayload } from "@/lib/queue";
import {
    createNotificationLog,
    createPortalToken,
    findNotificationDispatchById,
    findStudentResultForDispatch,
    findValidPortalToken,
    incrementDispatchProgress,
    updateDispatchStatus,
} from "@/lib/repositories/notification-repository";

type SendResult = {
    ok: boolean;
    providerMessageId: string;
    status: "SENT" | "FAILED";
    failureReason?: string;
};

type DispatchWorkerResult = {
    ok: boolean;
    message: string;
    channel?: "WHATSAPP" | "EMAIL" | "SMS";
};

type ChannelSelection = {
    channel: "WHATSAPP" | "EMAIL" | "SMS";
    destination: string;
};

function selectChannels(guardian: any): ChannelSelection[] {
    const channels: ChannelSelection[] = [];
    if (guardian.email) channels.push({ channel: "EMAIL", destination: guardian.email });
    if (guardian.phone) {
        channels.push({ channel: "WHATSAPP", destination: guardian.phone });
        channels.push({ channel: "SMS", destination: guardian.phone });
    }
    return channels;
}

// Normalize Nigerian phone numbers to international format (no leading +)
function normalizePhone(phone: string): string {
    const clean = phone.replace(/[\s\-().]/g, "");
    if (clean.startsWith("+")) return clean.slice(1);
    if (clean.startsWith("0")) return "234" + clean.slice(1);
    return clean;
}

async function getOrCreatePortalToken(studentResultId: string): Promise<string> {
    const now = new Date();
    const existing = await findValidPortalToken(studentResultId, now);
    if (existing) return existing.token as string;

    const token = randomBytes(32).toString("hex");
    const expiryDays = Number(process.env.TOKEN_EXPIRY_DAYS ?? "30");
    const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);
    await createPortalToken({ studentResultId, token, expiresAt });
    return token;
}

async function sendEmailNotification(to: string, subject: string, text: string): Promise<SendResult> {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT ?? 465),
            secure: process.env.SMTP_SECURE !== "false",
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER,
            to,
            subject,
            text,
        });
        return { ok: true, providerMessageId: info.messageId, status: "SENT" };
    }
    if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL ?? "noreply@example.edu",
            to,
            subject,
            text,
        });
        return { ok: true, providerMessageId: `resend-${Date.now()}`, status: "SENT" };
    }
    throw new Error("No email provider configured (set SMTP_HOST or RESEND_API_KEY)");
}

async function sendWhatsAppNotification(
    to: string,
    payload: { parentName: string; studentName: string; matricNumber: string; semester: string; portalLink: string },
): Promise<SendResult> {
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME ?? "mtu_result_notification";
    const templateLang = process.env.WHATSAPP_TEMPLATE_LANG ?? "en_US";

    if (!phoneId || !token) throw new Error("WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not set");

    const res = await fetch(`https://graph.facebook.com/v25.0/${phoneId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: normalizePhone(to),
            type: "template",
            template: {
                name: templateName,
                language: { code: templateLang },
                components: [{
                    type: "body",
                    parameters: [
                        { type: "text", text: payload.parentName },
                        { type: "text", text: payload.semester },
                        { type: "text", text: payload.studentName },
                        { type: "text", text: payload.matricNumber },
                        { type: "text", text: payload.portalLink },
                    ],
                }],
            },
        }),
    });
    const data = await res.json() as any;
    if (!res.ok) throw new Error(data.error?.message ?? `WhatsApp API error ${res.status}`);
    return { ok: true, providerMessageId: data.messages?.[0]?.id ?? `wa-${Date.now()}`, status: "SENT" };
}

async function sendSmsNotification(to: string, message: string): Promise<SendResult> {
    const baseUrl = process.env.SENDCHAMP_BASE_URL ?? "https://api.sendchamp.com/api/v1";
    const accessKey = process.env.SENDCHAMP_ACCESS_KEY;
    const senderId = process.env.SENDCHAMP_SENDER_ID ?? "MTU";
    if (!accessKey) throw new Error("SENDCHAMP_ACCESS_KEY not set");

    const res = await fetch(`${baseUrl}/sms/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessKey}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ to: [normalizePhone(to)], message, sender_name: senderId, route: "dnd" }),
    });
    const data = await res.json() as any;
    if (!res.ok) throw new Error(data.message ?? `Sendchamp API error ${res.status}`);
    return { ok: true, providerMessageId: data.data?.uid ?? `sms-${Date.now()}`, status: "SENT" };
}

async function sendNotification(
    channelSelection: ChannelSelection,
    payload: { parentName: string; studentName: string; matricNumber: string; semester: string; portalLink: string },
): Promise<SendResult> {
    const notificationMode = process.env.NOTIFICATION_ENV ?? "mock";
    if (notificationMode === "mock") {
        return { ok: true, providerMessageId: `mock-${Date.now()}`, status: "SENT" };
    }

    const text = `Hello ${payload.parentName}, the ${payload.semester} results for ${payload.studentName} (${payload.matricNumber}) are ready.\n\nView full details: ${payload.portalLink}`;

    try {
        if (channelSelection.channel === "EMAIL") {
            return await sendEmailNotification(
                channelSelection.destination,
                `Result Notification: ${payload.studentName} — ${payload.semester}`,
                text,
            );
        }
        if (channelSelection.channel === "WHATSAPP") {
            return await sendWhatsAppNotification(channelSelection.destination, payload);
        }
        if (channelSelection.channel === "SMS") {
            return await sendSmsNotification(channelSelection.destination, text);
        }
        throw new Error(`Unknown channel: ${channelSelection.channel}`);
    } catch (err) {
        return {
            ok: false,
            providerMessageId: `failed-${Date.now()}`,
            status: "FAILED",
            failureReason: err instanceof Error ? err.message : "Unknown provider error",
        };
    }
}

async function markDispatchProgress(dispatchId: string, ok: boolean) {
    await incrementDispatchProgress(dispatchId, ok);
    const dispatch = await findNotificationDispatchById(dispatchId);
    if (!dispatch) return;

    const processed = (dispatch.sentCount as number) + (dispatch.failedCount as number);
    if (processed < (dispatch.totalCount as number)) return;

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
                dispatchId: payload.dispatchId,
                studentResultId: studentResult.id,
                studentId: studentResult.studentId,
                channel: "EMAIL",
                status: "FAILED",
                failureReason: "No guardian contact records available.",
            });
            await markDispatchProgress(payload.dispatchId, false);
            return { ok: false, message: "No guardian contact records available." };
        }

        const token = await getOrCreatePortalToken(studentResult.id);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const portalLink = `${appUrl}/results/view?token=${token}`;

        const semester = `${studentResult.batch.session} ${studentResult.batch.semester}`;
        let sentCount = 0;
        let lastChannel: ChannelSelection["channel"] | undefined;

        // Send to every guardian with available contact info
        for (const guardian of guardians) {
            const channels = selectChannels(guardian);
            if (channels.length === 0) continue;

            // Use the first available channel per guardian
            const channelSelection = channels[0];
            const sendResult = await sendNotification(channelSelection, {
                parentName: guardian.name,
                studentName: studentResult.student.fullName,
                matricNumber: studentResult.student.matricNumber,
                semester,
                portalLink,
            });

            await createNotificationLog({
                dispatchId: payload.dispatchId,
                studentResultId: studentResult.id,
                studentId: studentResult.studentId,
                guardianId: guardian.id,
                channel: channelSelection.channel,
                status: sendResult.ok ? sendResult.status : "FAILED",
                providerMessageId: sendResult.providerMessageId,
                failureReason: sendResult.ok ? null : (sendResult.failureReason ?? "Provider error"),
            });

            if (sendResult.ok) {
                sentCount++;
                lastChannel = channelSelection.channel;
            }
        }

        await markDispatchProgress(payload.dispatchId, sentCount > 0);
        return {
            ok: sentCount > 0,
            message: sentCount > 0 ? "Notification processed." : "All channels failed.",
            channel: lastChannel,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown dispatch error.";
        await markDispatchProgress(payload.dispatchId, false);
        return { ok: false, message: `Dispatch worker failed: ${message}` };
    }
}
