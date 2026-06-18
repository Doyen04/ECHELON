import { randomBytes } from "node:crypto";

import nodemailer from "nodemailer";
import { Resend } from "resend";

import { sendSms } from "@/lib/notifications/sms-provider";
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
            family: 4,
        } as any);
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

function normalizePhone(phone: string): string {
    const clean = phone.replace(/[\s\-().]/g, "");
    if (clean.startsWith("+")) return clean;
    if (clean.startsWith("0")) return "+234" + clean.slice(1);
    return "+" + clean;
}

async function sendWhatsAppNotification(
    to: string,
    payload: { parentName: string; studentName: string; matricNumber: string; semester: string; portalLink: string },
): Promise<SendResult> {
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    const token = process.env.ULTRAMSG_TOKEN;

    if (!instanceId || !token) throw new Error("UltraMsg not configured (missing ULTRAMSG_INSTANCE_ID or ULTRAMSG_TOKEN).");

    const text =
        `Hello ${payload.parentName}, the ${payload.semester} semester result for ` +
        `${payload.studentName} (${payload.matricNumber}) is now available.\n\n` +
        `View result: ${payload.portalLink}`;

    const body = new URLSearchParams();
    body.append("token", token);
    body.append("to", normalizePhone(to));
    body.append("body", text);

    const res = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    });

    const data = await res.json() as any;
    if (!res.ok || data.sent === false || data.error) throw new Error(data.error ?? `UltraMsg error ${res.status}`);
    return { ok: true, providerMessageId: String(data.id ?? `wa-${Date.now()}`), status: "SENT" };
}

async function sendSmsNotification(to: string, message: string): Promise<SendResult> {
    const result = await sendSms({ to, text: message });
    if (!result.ok) throw new Error(result.failureReason ?? "SMS send failed");
    return { ok: true, providerMessageId: result.providerMessageId ?? `sms-${Date.now()}`, status: "SENT" };
}

async function sendNotification(
    channelSelection: ChannelSelection,
    payload: { parentName: string; studentName: string; matricNumber: string; semester: string; portalLink: string },
): Promise<SendResult> {

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
        console.error(`[${channelSelection.channel}] send failed:`, err);
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

        // Send to every guardian on ALL available channels (email + whatsapp + sms)
        for (const guardian of guardians) {
            const channels = selectChannels(guardian);
            if (channels.length === 0) continue;

            let anySent = false;
            for (const channelSelection of channels) {
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

                if (sendResult.ok) anySent = true;
            }

            if (anySent) sentCount++;
        }

        await markDispatchProgress(payload.dispatchId, sentCount > 0);
        return {
            ok: sentCount > 0,
            message: sentCount > 0 ? "Notifications sent across all available channels." : "All channels failed.",
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown dispatch error.";
        await markDispatchProgress(payload.dispatchId, false);
        return { ok: false, message: `Dispatch worker failed: ${message}` };
    }
}
