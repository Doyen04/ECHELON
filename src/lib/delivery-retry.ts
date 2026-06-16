import { randomUUID } from "node:crypto";

import { sendEmail } from "@/lib/notifications/email-provider";
import { sendWhatsApp } from "@/lib/notifications/whatsapp-provider";
import { sendSms } from "@/lib/notifications/sms-provider";
import {
    countNotificationLogsByStatus,
    createPortalToken,
    findDispatchBatchSessionSemester,
    findStudentResultForRetry,
    findValidPortalToken,
    listFailedNotificationLogs,
    updateNotificationDispatchCounts,
    updateNotificationLog,
} from "@/lib/repositories/notification-repository";
import { buildResultNotificationEmailTemplate } from "@/lib/result-email-template";
import { buildStudentResultPdfAttachment } from "./result-email-pdf";

type RetryContact = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    relationship: string;
};

type FailedSendLog = {
    id: string;
    dispatchId: string;
    studentResultId: string;
    studentName: string;
    matricNumber: string;
    failureReason: string | null;
    attemptedAt: Date;
    guardian: RetryContact | null;
    studentContacts: RetryContact[];
};

export type FailedSendPreviewItem = {
    id: string;
    studentResultId: string;
    studentName: string;
    matricNumber: string;
    failureReason: string | null;
    attemptedAt: string;
    guardianName: string | null;
    guardianEmail: string | null;
    guardianPhone: string | null;
    retryBlockedReason: string | null;
    resolvedFrom: "original" | "current" | "none";
};

export type FailedSendPreview = {
    dispatchId: string;
    totalFailed: number;
    retryableCount: number;
    unresolvedCount: number;
    canRetry: boolean;
    items: FailedSendPreviewItem[];
};

export type RetryResult = {
    dispatchId: string;
    retriedCount: number;
    retriedLogs: string[];
};

function toContact(contact: any): RetryContact {
    return {
        id: contact.id,
        name: contact.name,
        email: contact.email ?? null,
        phone: contact.phone ?? null,
        relationship: contact.relationship ?? "Parent",
    };
}

function chooseRetryContact(log: FailedSendLog) {
    const originalContact = log.guardian?.email ? log.guardian : null;
    const currentContact = log.studentContacts.find((contact) => Boolean(contact.email)) ?? null;
    const selected = originalContact ?? currentContact;

    if (!selected) {
        return {
            selected: null as RetryContact | null,
            resolvedFrom: "none" as const,
            retryBlockedReason: log.studentContacts.length > 0
                ? "Parent contact exists, but no email address is available for retry."
                : "No parent contact found for this student.",
        };
    }

    return {
        selected,
        resolvedFrom: originalContact ? ("original" as const) : ("current" as const),
        retryBlockedReason: null,
    };
}

async function getOrCreatePortalToken(studentResultId: string) {
    const now = new Date();

    const existingToken = await findValidPortalToken(studentResultId, now);

    if (existingToken) {
        return existingToken.token as string;
    }

    const token = randomUUID().replaceAll("-", "");
    const expiryDays = Number(process.env.TOKEN_EXPIRY_DAYS ?? "30");
    const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

    await createPortalToken({
        studentResultId,
        token,
        expiresAt,
    });

    return token;
}

async function sendRetryEmail(input: {
    guardianName: string;
    guardianEmail: string;
    studentResult: any;
    portalLink: string;
}) {
    const emailTemplate = buildResultNotificationEmailTemplate({
        parentName: input.guardianName,
        studentName: input.studentResult.student.fullName,
        matricNumber: input.studentResult.student.matricNumber,
        semesterLabel: `${input.studentResult.batch.session} ${input.studentResult.batch.semester}`,
        portalLink: input.portalLink,
    });

    const attachments = [] as any[];
    try {
        const courseRows = Array.isArray(input.studentResult?.courses)
            ? input.studentResult.courses
            : [];
        const attachment = await buildStudentResultPdfAttachment({
            studentName: input.studentResult.student.fullName,
            matricNumber: input.studentResult.student.matricNumber,
            department: input.studentResult.student.department ?? "General",
            faculty: input.studentResult.student.faculty ?? "General",
            level: Number(input.studentResult.student.level ?? 100),
            session: String(input.studentResult.batch.session ?? "Unknown"),
            semester: String(input.studentResult.batch.semester ?? "Unknown"),
            gpa: Number(input.studentResult.gpa ?? 0),
            cgpa: input.studentResult.cgpa ?? null,
            courses: courseRows,
            institutionName: input.studentResult.batch.institution?.name ?? input.studentResult.student.institution?.name ?? "Mountain Top University",
            logoUrl: input.studentResult.batch.institution?.logoUrl ?? input.studentResult.student.institution?.logoUrl ?? null,
            submissionId: input.studentResult.batch.id ?? null,
        });
        attachments.push(attachment);
    } catch {
        // Continue retry without attachment when generation fails.
    }

    const response = await sendEmail({
        to: input.guardianEmail,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (!response.ok) {
        throw new Error(response.failureReason ?? "Email provider rejected message.");
    }

    return response.providerMessageId ?? `smtp-${Date.now()}`;
}

export async function getFailedSendPreview(dispatchId: string): Promise<FailedSendPreview> {
    const failedLogsRaw = await listFailedNotificationLogs(dispatchId);

    const failedLogs: FailedSendLog[] = failedLogsRaw.map((log: any) => ({
        id: log.id,
        dispatchId: log.dispatchId,
        studentResultId: log.studentResultId,
        studentName: log.student.fullName,
        matricNumber: log.student.matricNumber,
        failureReason: log.failureReason,
        attemptedAt: log.attemptedAt,
        guardian: log.guardian ? toContact(log.guardian) : null,
        studentContacts: Array.isArray(log.student.guardians) ? log.student.guardians.map(toContact) : [],
    }));

    const items = failedLogs.map((log) => {
        const resolution = chooseRetryContact(log);
        return {
            id: log.id,
            studentResultId: log.studentResultId,
            studentName: log.studentName,
            matricNumber: log.matricNumber,
            failureReason: log.failureReason,
            attemptedAt: log.attemptedAt.toISOString(),
            guardianName: resolution.selected?.name ?? log.guardian?.name ?? null,
            guardianEmail: resolution.selected?.email ?? log.guardian?.email ?? null,
            guardianPhone: resolution.selected?.phone ?? log.guardian?.phone ?? null,
            retryBlockedReason: resolution.retryBlockedReason,
            resolvedFrom: resolution.resolvedFrom,
        } satisfies FailedSendPreviewItem;
    });

    const retryableCount = items.filter((item) => !item.retryBlockedReason).length;
    const unresolvedCount = items.length - retryableCount;

    return {
        dispatchId,
        totalFailed: items.length,
        retryableCount,
        unresolvedCount,
        canRetry: retryableCount > 0,
        items,
    };
}

export async function retryFailedDispatchSends(dispatchId: string, logId?: string): Promise<RetryResult> {
    const preview = await getFailedSendPreview(dispatchId);

    const itemsToRetry = logId
        ? preview.items.filter(item => item.id === logId)
        : preview.items.filter(item => !item.retryBlockedReason);

    if (itemsToRetry.length === 0) {
        throw new Error(logId ? "This specific log cannot be retried." : "No failed sends have a resolvable contact for retry.");
    }

    const dispatch = await findDispatchBatchSessionSemester(dispatchId);

    if (!dispatch) {
        throw new Error("Dispatch not found.");
    }

    const semesterLabel = `${dispatch.batch.session} ${dispatch.batch.semester}`;
    const retriedLogs: string[] = [];

    for (const item of itemsToRetry) {
        if (!item.guardianName || (!item.guardianEmail && !item.guardianPhone)) {
            continue;
        }
        const portalToken = await getOrCreatePortalToken(item.studentResultId);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const portalLink = `${appUrl}/results/view?token=${portalToken}`;

        let successChannel: "EMAIL" | "WHATSAPP" | "SMS" | null = null;
        let providerMessageId: string | null = null;
        let failureReason: string | null = null;

        if (item.guardianEmail) {
            try {
                const studentResult = await findStudentResultForRetry(item.studentResultId);

                if (!studentResult) {
                    throw new Error("Student result not found for retry attachment generation.");
                }

                providerMessageId = await sendRetryEmail({
                    guardianName: item.guardianName,
                    guardianEmail: item.guardianEmail,
                    studentResult,
                    portalLink,
                });
                successChannel = "EMAIL";
            } catch (error) {
                failureReason = error instanceof Error ? error.message : "Email retry failed.";
            }
        }

        if (!successChannel && item.guardianPhone) {
            const whatsappRes = await sendWhatsApp({
                to: item.guardianPhone,
                templateParams: [item.guardianName, semesterLabel, item.studentName, item.matricNumber, portalLink],
            });
            if (whatsappRes.ok) {
                successChannel = "WHATSAPP";
                providerMessageId = whatsappRes.providerMessageId;
            } else {
                failureReason = whatsappRes.failureReason ?? failureReason;
            }
        }

        if (!successChannel && item.guardianPhone) {
            const smsRes = await sendSms({
                to: item.guardianPhone,
                text: `Hello ${item.guardianName}, the ${semesterLabel} results for ${item.studentName} (${item.matricNumber}) are ready. View here: ${portalLink}`,
            });
            if (smsRes.ok) {
                successChannel = "SMS";
                providerMessageId = smsRes.providerMessageId;
            } else {
                failureReason = smsRes.failureReason ?? failureReason;
            }
        }

        if (successChannel && providerMessageId) {
            await updateNotificationLog(item.id, {
                status: "SENT",
                channel: successChannel,
                providerMessageId,
                failureReason: null,
                deliveredAt: new Date(),
                attemptedAt: new Date(),
            });
            retriedLogs.push(item.id);
        } else {
            await updateNotificationLog(item.id, {
                attemptedAt: new Date(),
                failureReason: failureReason ?? "Retry failed across all available channels.",
            });
        }
    }

    // Recalculate the dispatch counters based on current log statuses
    const sentCount = await countNotificationLogsByStatus(dispatchId, "SENT");

    const failedCount = await countNotificationLogsByStatus(dispatchId, "FAILED");

    // Update the dispatch with new counters
    await updateNotificationDispatchCounts(dispatchId, sentCount, failedCount);

    return {
        dispatchId,
        retriedCount: retriedLogs.length,
        retriedLogs,
    };
}