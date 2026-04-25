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

// ---------------------------------------------------------------------------
// SendChamp (Primary)
// ---------------------------------------------------------------------------
async function sendViaSendChamp(input: SmsSendInput): Promise<SmsSendResult> {
    const accessKey = process.env.SENDCHAMP_ACCESS_KEY;
    const senderId = process.env.SENDCHAMP_SENDER_ID || "Info";

    if (!accessKey) {
        return { ok: false, providerMessageId: null, failureReason: "SendChamp API key is not configured.", usedProvider: "SendChamp" };
    }

    // Format for SendChamp: string array of numbers with country codes.
    // Basic normalization: 080... -> 23480...
    let formattedTo = input.to.replace(/\D/g, "");
    if (formattedTo.startsWith("0") && formattedTo.length === 11) {
        formattedTo = "234" + formattedTo.substring(1);
    }

    try {
        const response = await fetch("https://api.sendchamp.com/api/v1/sms/send", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessKey}`,
            },
            body: JSON.stringify({
                to: [formattedTo],
                message: input.text,
                sender_name: senderId,
                route: "non_dnd", // or 'dnd' based on requirements
            }),
        });

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
            return {
                ok: false,
                providerMessageId: null,
                failureReason: data.message || "SendChamp rejected the message.",
                usedProvider: "SendChamp",
            };
        }

        return {
            ok: true,
            providerMessageId: data.data?.id || `sc-${Date.now()}`,
            usedProvider: "SendChamp",
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown network error.";
        return {
            ok: false,
            providerMessageId: null,
            failureReason: `SendChamp network error: ${message}`,
            usedProvider: "SendChamp",
        };
    }
}

// ---------------------------------------------------------------------------
// Twilio (Fallback)
// ---------------------------------------------------------------------------
async function sendViaTwilio(input: SmsSendInput): Promise<SmsSendResult> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const fromNumber = process.env.TWILIO_FROM_NUMBER; // if messaging service isn't used

    if (!accountSid || !authToken || (!messagingServiceSid && !fromNumber)) {
        return { ok: false, providerMessageId: null, failureReason: "Twilio credentials are not fully configured.", usedProvider: "Twilio" };
    }

    // Twilio requires E.164 formatting (e.g. +234...)
    let formattedTo = input.to.replace(/\D/g, "");
    if (formattedTo.startsWith("0") && formattedTo.length === 11) {
        formattedTo = "+234" + formattedTo.substring(1);
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
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            },
            body: formData.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                ok: false,
                providerMessageId: null,
                failureReason: data.message || "Twilio rejected the message.",
                usedProvider: "Twilio",
            };
        }

        return {
            ok: true,
            providerMessageId: data.sid || `tw-${Date.now()}`,
            usedProvider: "Twilio",
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown network error.";
        return {
            ok: false,
            providerMessageId: null,
            failureReason: `Twilio network error: ${message}`,
            usedProvider: "Twilio",
        };
    }
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------
export async function sendSms(input: SmsSendInput): Promise<SmsSendResult> {
    const sendChampResult = await sendViaSendChamp(input);

    if (sendChampResult.ok) {
        return sendChampResult;
    }

    // Fallback to Twilio
    const twilioResult = await sendViaTwilio(input);
    
    if (twilioResult.ok) {
        return twilioResult;
    }

    // Both failed, return a combined error or the primary error
    return {
        ok: false,
        providerMessageId: null,
        failureReason: `Primary (SendChamp) failed: ${sendChampResult.failureReason} | Fallback (Twilio) failed: ${twilioResult.failureReason}`,
        usedProvider: "None", // Or keep the last one, doesn't matter since ok=false
    };
}
