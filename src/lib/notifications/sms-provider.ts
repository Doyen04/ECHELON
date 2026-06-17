import https from "node:https";

export type SmsSendInput = {
    to: string;
    text: string;
};

export type SmsSendResult = {
    ok: boolean;
    providerMessageId: string | null;
    failureReason?: string;
    usedProvider?: "Termii" | "SendChamp" | "Twilio" | "None";
};

function normalizeNigerianPhone(phone: string): string {
    const clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0") && clean.length === 11) return "234" + clean.slice(1);
    return clean;
}

// Scoped agent — disables SSL verification only for Sendchamp connections.
// Must use https.request (not native fetch) because Node.js native fetch
// (undici) silently ignores the agent option.
const sendchampAgent = new https.Agent({ rejectUnauthorized: false });

async function sendViaSendChamp(input: SmsSendInput): Promise<SmsSendResult> {
    const accessKey = process.env.SENDCHAMP_ACCESS_KEY;
    const senderId = process.env.SENDCHAMP_SENDER_ID || "Info";

    if (!accessKey) {
        return { ok: false, providerMessageId: null, failureReason: "SendChamp API key is not configured.", usedProvider: "SendChamp" };
    }

    const body = JSON.stringify({
        to: [normalizeNigerianPhone(input.to)],
        message: input.text,
        sender_name: senderId,
        route: "dnd",
    });

    try {
        const result = await new Promise<{ statusCode: number; parsed: any }>((resolve, reject) => {
            const req = https.request(
                {
                    hostname: "api.sendchamp.com",
                    path: "/api/v1/sms/send",
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessKey}`,
                        "Content-Length": Buffer.byteLength(body),
                    },
                    agent: sendchampAgent,
                },
                (res) => {
                    let raw = "";
                    res.on("data", (chunk: Buffer) => { raw += chunk.toString(); });
                    res.on("end", () => {
                        try {
                            resolve({ statusCode: res.statusCode ?? 0, parsed: JSON.parse(raw) });
                        } catch {
                            reject(new Error(`Non-JSON response from SendChamp (${res.statusCode}): ${raw.slice(0, 200)}`));
                        }
                    });
                },
            );
            req.on("error", reject);
            req.write(body);
            req.end();
        });

        if (result.statusCode >= 200 && result.statusCode < 300 && result.parsed?.status === "success") {
            return {
                ok: true,
                providerMessageId: result.parsed.data?.id ?? `sc-${Date.now()}`,
                usedProvider: "SendChamp",
            };
        }

        console.error("[SendChamp] API Error:", result.parsed);
        return {
            ok: false,
            providerMessageId: null,
            failureReason: result.parsed?.message || `SendChamp error ${result.statusCode}`,
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

async function sendViaTermii(input: SmsSendInput): Promise<SmsSendResult> {
    const apiKey = process.env.TERMII_API_KEY;
    const senderId = process.env.TERMII_SENDER_ID ?? "N-Alert";

    if (!apiKey) {
        return { ok: false, providerMessageId: null, failureReason: "TERMII_API_KEY not configured.", usedProvider: "Termii" };
    }

    try {
        const res = await fetch("https://api.ng.termii.com/api/sms/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey,
                to: normalizeNigerianPhone(input.to),
                from: senderId,
                sms: input.text,
                type: "plain",
                channel: "generic",
            }),
        });

        const parsed = await res.json() as any;

        if (parsed.code === "ok") {
            return {
                ok: true,
                providerMessageId: String(parsed.message_id ?? `termii-${Date.now()}`),
                usedProvider: "Termii",
            };
        }

        console.error("[Termii] API Error:", parsed);
        return {
            ok: false,
            providerMessageId: null,
            failureReason: parsed.message || `Termii error`,
            usedProvider: "Termii",
        };
    } catch (error) {
        console.error("[Termii] Request Error:", error);
        return {
            ok: false,
            providerMessageId: null,
            failureReason: error instanceof Error ? error.message : "Termii network error",
            usedProvider: "Termii",
        };
    }
}

export async function sendSms(input: SmsSendInput): Promise<SmsSendResult> {
    // Termii → SendChamp → Twilio
    const termiiResult = await sendViaTermii(input);
    if (termiiResult.ok) return termiiResult;

    const sendChampResult = await sendViaSendChamp(input);
    if (sendChampResult.ok) return sendChampResult;

    const twilioResult = await sendViaTwilio(input);
    if (twilioResult.ok) return twilioResult;

    return {
        ok: false,
        providerMessageId: null,
        failureReason: `Termii: ${termiiResult.failureReason} | SendChamp: ${sendChampResult.failureReason} | Twilio: ${twilioResult.failureReason}`,
        usedProvider: "None",
    };
}
