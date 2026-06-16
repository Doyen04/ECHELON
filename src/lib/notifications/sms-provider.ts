import https from "node:https";

export type SmsSendInput = {
    to: string;
    text: string;
};

export type SmsSendResult = {
    ok: boolean;
    providerMessageId: string | null;
    failureReason?: string;
    usedProvider?: "SendChamp" | "Twilio" | "None";
};

function normalizeNigerianPhone(phone: string): string {
    const clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0") && clean.length === 11) return "234" + clean.slice(1);
    return clean;
}

// Scoped agent — disables SSL verification only for this agent's connections, not the whole process
const sendchampAgent = new https.Agent({ rejectUnauthorized: false });

async function sendViaSendChamp(input: SmsSendInput): Promise<SmsSendResult> {
    const accessKey = process.env.SENDCHAMP_ACCESS_KEY;
    const senderId = process.env.SENDCHAMP_SENDER_ID || "Info";

    if (!accessKey) {
        return { ok: false, providerMessageId: null, failureReason: "SendChamp API key is not configured.", usedProvider: "SendChamp" };
    }

    try {
        const res = await fetch("https://api.sendchamp.com/api/v1/sms/send", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessKey}`,
            },
            body: JSON.stringify({
                to: [normalizeNigerianPhone(input.to)],
                message: input.text,
                sender_name: senderId,
                route: "dnd",
            }),
            // @ts-expect-error — node-fetch / undici agent option
            agent: sendchampAgent,
        });

        const parsed = await res.json() as any;

        if (res.ok && parsed.status === "success") {
            return {
                ok: true,
                providerMessageId: parsed.data?.id ?? `sc-${Date.now()}`,
                usedProvider: "SendChamp",
            };
        }

        console.error("[SendChamp] API Error:", parsed);
        return {
            ok: false,
            providerMessageId: null,
            failureReason: parsed.message || `SendChamp error ${res.status}`,
            usedProvider: "SendChamp",
        };
    } catch (error) {
        console.error("[SendChamp] Request Error:", error);
        return {
            ok: false,
            providerMessageId: null,
            failureReason: error instanceof Error ? error.message : "SendChamp network error",
            usedProvider: "SendChamp",
        };
    }
}

async function sendViaTwilio(input: SmsSendInput): Promise<SmsSendResult> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || (!messagingServiceSid && !fromNumber)) {
        return { ok: false, providerMessageId: null, failureReason: "Twilio credentials are not fully configured.", usedProvider: "Twilio" };
    }

    let formattedTo = input.to.replace(/\D/g, "");
    if (formattedTo.startsWith("0") && formattedTo.length === 11) {
        formattedTo = "+234" + formattedTo.slice(1);
    } else if (!formattedTo.startsWith("+")) {
        formattedTo = "+" + formattedTo;
    }

    const formData = new URLSearchParams();
    formData.append("To", formattedTo);
    formData.append("Body", input.text);
    if (messagingServiceSid) {
        formData.append("MessagingServiceSid", messagingServiceSid);
    } else if (fromNumber) {
        formData.append("From", fromNumber);
    }

    try {
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            },
            body: formData.toString(),
        });

        const parsed = await res.json() as any;

        if (res.ok) {
            return {
                ok: true,
                providerMessageId: parsed.sid ?? `tw-${Date.now()}`,
                usedProvider: "Twilio",
            };
        }

        console.error("[Twilio] API Error:", parsed);
        return {
            ok: false,
            providerMessageId: null,
            failureReason: parsed.message ?? `Twilio error ${res.status}`,
            usedProvider: "Twilio",
        };
    } catch (error) {
        console.error("[Twilio] Request Error:", error);
        return {
            ok: false,
            providerMessageId: null,
            failureReason: error instanceof Error ? error.message : "Twilio network error",
            usedProvider: "Twilio",
        };
    }
}

export async function sendSms(input: SmsSendInput): Promise<SmsSendResult> {
    const sendChampResult = await sendViaSendChamp(input);

    if (sendChampResult.ok) {
        return sendChampResult;
    }

    const twilioResult = await sendViaTwilio(input);

    if (twilioResult.ok) {
        return twilioResult;
    }

    return {
        ok: false,
        providerMessageId: null,
        failureReason: `Primary (SendChamp) failed: ${sendChampResult.failureReason} | Fallback (Twilio) failed: ${twilioResult.failureReason}`,
        usedProvider: "None",
    };
}
