export type SmsSendInput = {
    to: string;
    text: string;
};

export type SmsSendResult = {
    ok: boolean;
    providerMessageId: string | null;
    failureReason?: string;
    usedProvider?: "BulkSMSNigeria" | "None";
};

function normalizeToIntl(phone: string): string {
    const clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0") && clean.length === 11) return "234" + clean.slice(1);
    if (clean.startsWith("234")) return clean;
    return clean;
}

async function sendViaBulkSMSNigeria(input: SmsSendInput): Promise<SmsSendResult> {
    const apiToken  = process.env.BULKSMS_API_TOKEN;
    const senderId  = process.env.BULKSMS_SENDER_ID || "Echelon";

    if (!apiToken) {
        return { ok: false, providerMessageId: null, failureReason: "BulkSMSNigeria API token not configured (set BULKSMS_API_TOKEN).", usedProvider: "BulkSMSNigeria" };
    }

    try {
        const res = await fetch("https://www.bulksmsnigeria.com/api/v2/sms", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept":        "application/json",
                "Authorization": `Bearer ${apiToken}`,
            },
            body: JSON.stringify({
                to:             normalizeToIntl(input.to),
                body:           input.text,
                from:           senderId,
                gateway:        0,   // 0 = non-DND route; use 1 for DND
                append_sender:  0,
            }),
        });

        const data = await res.json() as any;

        if (res.ok && (data?.data?.message_id || data?.status === "success" || data?.message_id)) {
            return {
                ok: true,
                providerMessageId: String(data?.data?.message_id ?? data?.message_id ?? `bsn-${Date.now()}`),
                usedProvider: "BulkSMSNigeria",
            };
        }

        console.error("[BulkSMSNigeria] API Error:", data);
        return {
            ok: false,
            providerMessageId: null,
            failureReason: data?.message ?? data?.error ?? `BulkSMSNigeria error ${res.status}`,
            usedProvider: "BulkSMSNigeria",
        };
    } catch (error) {
        console.error("[BulkSMSNigeria] Request Error:", error);
        return {
            ok: false,
            providerMessageId: null,
            failureReason: error instanceof Error ? error.message : "BulkSMSNigeria network error",
            usedProvider: "BulkSMSNigeria",
        };
    }
}

export async function sendSms(input: SmsSendInput): Promise<SmsSendResult> {
    return sendViaBulkSMSNigeria(input);
}
