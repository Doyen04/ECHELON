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

export async function sendWhatsApp(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
        return {
            ok: false,
            providerMessageId: null,
            failureReason: "WhatsApp Cloud API is not configured (missing phone number ID or token).",
        };
    }

    const templateName = input.templateName || process.env.WHATSAPP_TEMPLATE_NAME || "result_notification";
    const languageCode = input.languageCode || process.env.WHATSAPP_TEMPLATE_LANG || "en";

    // Format phone number: remove non-digits, ensure it starts with country code (assuming +234 or similar, but for API it should just be digits like 234...)
    let formattedTo = input.to.replace(/\D/g, "");
    // Very basic normalization (e.g., if it starts with 0 and we are in Nigeria, replace with 234)
    if (formattedTo.startsWith("0") && formattedTo.length === 11) {
        formattedTo = "234" + formattedTo.substring(1);
    }

    const payload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedTo,
        type: "template",
        template: {
            name: templateName,
            language: { code: languageCode },
        },
    };

    if (input.templateParams && input.templateParams.length > 0) {
        payload.template.components = [
            {
                type: "body",
                parameters: input.templateParams.map((param) => ({
                    type: "text",
                    text: param,
                })),
            },
        ];
    }

    try {
        const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                ok: false,
                providerMessageId: null,
                failureReason: data.error?.message || "Meta Cloud API rejected the message.",
            };
        }

        return {
            ok: true,
            providerMessageId: data.messages?.[0]?.id || `wa-${Date.now()}`,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown network error.";
        return {
            ok: false,
            providerMessageId: null,
            failureReason: `WhatsApp send failed: ${message}`,
        };
    }
}
