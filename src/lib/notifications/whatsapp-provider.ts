export type WhatsAppSendInput = {
    to: string;
    templateName?: string;
    languageCode?: string;
    templateParams?: string[];
};

export type WhatsAppSendResult = {
    ok: boolean;
    providerMessageId: string | null;
    failureReason?: string;
};

function normalizePhone(phone: string): string {
    const clean = phone.replace(/[\s\-().]/g, "");
    if (clean.startsWith("+")) return clean.slice(1);
    if (clean.startsWith("0")) return "234" + clean.slice(1);
    return clean;
}

export async function sendWhatsApp(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

    if (!accountSid || !authToken) {
        return {
            ok: false,
            providerMessageId: null,
            failureReason: "Twilio credentials not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN).",
        };
    }

    const [guardianName, semester, studentName, matric, portalLink] = input.templateParams ?? [];
    const text = guardianName
        ? `Hello ${guardianName}, the ${semester ?? ""} semester result for ${studentName ?? ""} (${matric ?? ""}) is now available.\n\nView result: ${portalLink ?? ""}`
        : "Your ward's result is now available. Please contact the registry for your portal link.";

    const toWhatsApp = `whatsapp:+${normalizePhone(input.to)}`;
    const fromWhatsApp = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

    const body = new URLSearchParams();
    body.append("To", toWhatsApp);
    body.append("From", fromWhatsApp);
    body.append("Body", text);

    try {
        const res = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
                },
                body: body.toString(),
            },
        );

        const data = await res.json() as any;

        if (!res.ok) {
            console.error("[WhatsAppProvider] API Error:", JSON.stringify(data, null, 2));
            return {
                ok: false,
                providerMessageId: null,
                failureReason: data.message ?? `Twilio WhatsApp error ${res.status}`,
            };
        }

        return {
            ok: true,
            providerMessageId: data.sid ?? `wa-${Date.now()}`,
        };
    } catch (error) {
        console.error("[WhatsAppProvider] Network/Unknown Error:", error);
        return {
            ok: false,
            providerMessageId: null,
            failureReason: error instanceof Error ? error.message : "Unknown network error.",
        };
    }
}
