import https from "https";

// Bypass SSL certificate issues globally for this provider
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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

async function sendViaSendChamp(input: SmsSendInput): Promise<SmsSendResult> {
    const accessKey = process.env.SENDCHAMP_ACCESS_KEY;
    
    const senderId = process.env.SENDCHAMP_SENDER_ID || "Info";

    if (!accessKey) {
        return { ok: false, providerMessageId: null, failureReason: "SendChamp API key is not configured.", usedProvider: "SendChamp" };
    }

    let formattedTo = input.to.replace(/\D/g, "");
    if (formattedTo.startsWith("0") && formattedTo.length === 11) {
        formattedTo = "234" + formattedTo.substring(1);
    }

    const payload = JSON.stringify({
        to: [formattedTo],
        message: input.text,
        sender_name: senderId,
        route: "non_dnd",
    });

    return new Promise((resolve) => {
        const options = {
            hostname: 'api.sendchamp.com',
            path: '/api/v1/sms/send',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessKey}`,
                'Content-Length': Buffer.byteLength(payload),
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode && res.statusCode < 300 && parsed.status === "success") {
                        resolve({
                            ok: true,
                            providerMessageId: parsed.data?.id || `sc-${Date.now()}`,
                            usedProvider: "SendChamp",
                        });
                    } else {
                        console.error("[SendChamp] API Error:", data);
                        resolve({
                            ok: false,
                            providerMessageId: null,
                            failureReason: parsed.message || "SendChamp rejected the message.",
                            usedProvider: "SendChamp",
                        });
                    }
                } catch (e) {
                    console.error("[SendChamp] Parse Error:", data);
                    resolve({ ok: false, providerMessageId: null, failureReason: "Invalid JSON response", usedProvider: "SendChamp" });
                }
            });
        });

        req.on('error', (error) => {
            console.error("[SendChamp] Request Error:", error);
            resolve({ ok: false, providerMessageId: null, failureReason: error.message, usedProvider: "SendChamp" });
        });

        req.write(payload);
        req.end();
    });
}

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

    console.log(`[Twilio] Attempting to send to ${formattedTo} via https...`);

    const payload = formData.toString();

    return new Promise((resolve) => {
        const options = {
            hostname: 'api.twilio.com',
            path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
                'Content-Length': Buffer.byteLength(payload),
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode && res.statusCode < 300) {
                        resolve({
                            ok: true,
                            providerMessageId: parsed.sid || `tw-${Date.now()}`,
                            usedProvider: "Twilio",
                        });
                    } else {
                        console.error("[Twilio] API Error:", data);
                        resolve({
                            ok: false,
                            providerMessageId: null,
                            failureReason: parsed.message || "Twilio rejected the message.",
                            usedProvider: "Twilio",
                        });
                    }
                } catch (e) {
                    console.error("[Twilio] Parse Error:", data);
                    resolve({ ok: false, providerMessageId: null, failureReason: "Invalid JSON response", usedProvider: "Twilio" });
                }
            });
        });

        req.on('error', (error) => {
            console.error("[Twilio] Request Error:", error);
            resolve({ ok: false, providerMessageId: null, failureReason: error.message, usedProvider: "Twilio" });
        });

        req.write(payload);
        req.end();
    });
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
