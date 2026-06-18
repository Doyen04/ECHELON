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
    if (clean.startsWith("+")) return clean;
    if (clean.startsWith("0")) return "+234" + clean.slice(1);
    return "+" + clean;
}

export async function sendWhatsApp(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    const token = process.env.ULTRAMSG_TOKEN;

    if (!instanceId || !token) {
        return {
            ok: false,
            providerMessageId: null,
            failureReason: "UltraMsg not configured (missing ULTRAMSG_INSTANCE_ID or ULTRAMSG_TOKEN).",
        };
    }

    const [guardianName, semester, studentName, matric, portalLink] = input.templateParams ?? [];
    const text = guardianName
        ? `Hello ${guardianName}, the ${semester ?? ""} semester result for ${studentName ?? ""} (${matric ?? ""}) is now available.\n\nView result: ${portalLink ?? ""}`
        : "Your ward's result is now available. Please contact the registry for your portal link.";

    const body = new URLSearchParams();
    body.append("token", token);
    body.append("to", normalizePhone(input.to));
    body.append("body", text);

    try {
        const res = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString(),
        });

        const data = await res.json() as any;

        if (!res.ok || data.sent === false || data.error) {
            console.error("[WhatsAppProvider] UltraMsg Error:", JSON.stringify(data, null, 2));
            return {
                ok: false,
                providerMessageId: null,
                failureReason: data.error ?? `UltraMsg error ${res.status}`,
            };
        }

        return {
            ok: true,
            providerMessageId: String(data.id ?? `wa-${Date.now()}`),
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
