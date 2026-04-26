import { randomUUID } from "node:crypto";

import nodemailer from "nodemailer";

import { prisma } from "@/lib/db";

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

    const token = randomUUID().replaceAll("-", "");
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

async function sendRetryEmail(input: {
    guardianName: string;
    guardianEmail: string;
    studentName: string;
    matricNumber: string;
    semesterLabel: string;
    portalLink: string;
}) {
    const host = process.env.SMTP_HOST;
    const from = process.env.SMTP_FROM_EMAIL;
    const port = Number(process.env.SMTP_PORT ?? "587");
    const secure = (process.env.SMTP_SECURE ?? "false").toLowerCase() === "true";

    if (!host || !from || Number.isNaN(port)) {
        throw new Error("SMTP configuration is incomplete. Set SMTP_HOST, SMTP_PORT, and SMTP_FROM_EMAIL.");
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: process.env.SMTP_USER && process.env.SMTP_PASS
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            }
            : undefined,
    });

    const response = await transporter.sendMail({
        from,
        to: input.guardianEmail,
        subject: `[Result Notification] ${input.studentName} - ${input.semesterLabel}`,
        text: `Hello ${input.guardianName}, the results for ${input.studentName} (${input.matricNumber}) are ready. View full details: ${input.portalLink}`,
    });

    return response?.messageId ?? `smtp-${Date.now()}`;
}

export async function getFailedSendPreview(dispatchId: string): Promise<FailedSendPreview> {
    const db = prisma as any;

    const failedLogsRaw = await db.notificationLog.findMany({
        where: {
            dispatchId,
            status: "FAILED",
            channel: "EMAIL",
        },
        orderBy: { attemptedAt: "desc" },
        select: {
            id: true,
            dispatchId: true,
            studentResultId: true,
            failureReason: true,
            attemptedAt: true,
            student: {
                select: {
                    fullName: true,
                    matricNumber: true,
                    guardians: {
                        orderBy: { createdAt: "desc" },
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            relationship: true,
                        },
                    },
                },
            },
            guardian: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    relationship: true,
                },
            },
        },
    });

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

export async function retryFailedDispatchSends(dispatchId: string): Promise<RetryResult> {
    const db = prisma as any;
    const preview = await getFailedSendPreview(dispatchId);

    if (!preview.canRetry) {
        throw new Error("No failed sends have a resolvable parent email contact for retry.");
    }

    const dispatch = await db.notificationDispatch.findUnique({
        where: { id: dispatchId },
        select: {
            batch: {
                select: {
                    session: true,
                    semester: true,
                },
            },
        },
    });

    if (!dispatch) {
        throw new Error("Dispatch not found.");
    }

    const semesterLabel = `${dispatch.batch.session} ${dispatch.batch.semester}`;
    const retriedLogs: string[] = [];

    for (const item of preview.items) {
        if (!item.guardianEmail || !item.guardianName) {
            continue;
        }

        const portalToken = await getOrCreatePortalToken(item.studentResultId);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const portalLink = `${appUrl}/results/view?token=${portalToken}`;

        const providerMessageId = await sendRetryEmail({
            guardianName: item.guardianName,
            guardianEmail: item.guardianEmail,
            studentName: item.studentName,
            matricNumber: item.matricNumber,
            semesterLabel,
            portalLink,
        });

        await db.notificationLog.update({
            where: { id: item.id },
            data: {
                status: "SENT",
                providerMessageId,
                failureReason: null,
                deliveredAt: new Date(),
                attemptedAt: new Date(),
            },
        });

        retriedLogs.push(item.id);
    }

    // Recalculate the dispatch counters based on current log statuses
    const sentCount = await db.notificationLog.count({
        where: { dispatchId, status: "SENT" },
    });

    const failedCount = await db.notificationLog.count({
        where: { dispatchId, status: "FAILED" },
    });

    // Update the dispatch with new counters
    await db.notificationDispatch.update({
        where: { id: dispatchId },
        data: {
            sentCount,
            failedCount,
        },
    });

    return {
        dispatchId,
        retriedCount: retriedLogs.length,
        retriedLogs,
    };
}