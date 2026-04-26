import nodemailer from "nodemailer";

export type EmailSendInput = {
    to: string;
    subject: string;
    text: string;
};

export type EmailSendResult = {
    ok: boolean;
    providerMessageId: string | null;
    failureReason?: string;
};

let cachedTransporter: nodemailer.Transporter | null = null;

function parseSmtpPort(rawPort: string | undefined): number {
    const parsed = Number(rawPort ?? "587");
    return Number.isFinite(parsed) ? parsed : 587;
}

function parseSmtpSecure(rawValue: string | undefined, port: number): boolean {
    if (!rawValue) {
        return port === 465;
    }

    return ["true", "1", "yes", "y"].includes(rawValue.trim().toLowerCase());
}

function getTransporter(): nodemailer.Transporter {
    if (cachedTransporter) {
        return cachedTransporter;
    }

    const host = process.env.SMTP_HOST;
    const port = parseSmtpPort(process.env.SMTP_PORT);
    const secure = parseSmtpSecure(process.env.SMTP_SECURE, port);
    const user = process.env.SMTP_USERNAME;
    const pass = process.env.SMTP_PASSWORD;

    if (!host) {
        throw new Error("SMTP_HOST is not configured.");
    }

    const auth = user && pass ? { user, pass } : undefined;

    cachedTransporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth,
        tls: {
            rejectUnauthorized: false,
        },
    });

    return cachedTransporter;
}

export async function sendEmail(input: EmailSendInput): Promise<EmailSendResult> {
    const from = process.env.SMTP_FROM_EMAIL ?? "Results <noreply@example.edu>";

    try {
        const transporter = getTransporter();
        const info = await transporter.sendMail({
            from,
            to: input.to,
            subject: input.subject,
            text: input.text,
        });

        return {
            ok: true,
            providerMessageId: info.messageId ?? `smtp-${Date.now()}`,
        };
    } catch (error) {
        console.error("[EmailProvider] Failed to send email:", error);
        const message = error instanceof Error ? error.message : "Unknown SMTP provider error.";
        return {
            ok: false,
            providerMessageId: null,
            failureReason: `Email send failed: ${message}`,
        };
    }
}
