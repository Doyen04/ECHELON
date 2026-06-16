type ResultEmailTemplateInput = {
    parentName: string;
    studentName: string;
    matricNumber: string;
    semesterLabel: string;
    portalLink: string;
};

type ResultEmailTemplateOutput = {
    subject: string;
    text: string;
    html: string;
};

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

export function buildResultNotificationEmailTemplate(
    input: ResultEmailTemplateInput,
): ResultEmailTemplateOutput {
    const subject = `[Result Notification] ${input.studentName} - ${input.semesterLabel}`;
    const text = [
        `Hello ${input.parentName},`,
        "",
        `The results for ${input.studentName} (${input.matricNumber}) are ready.`,
        `View full details: ${input.portalLink}`,
    ].join("\n");

    const html = [
        `<p>Hello ${escapeHtml(input.parentName)},</p>`,
        `<p>The results for <strong>${escapeHtml(input.studentName)}</strong> (${escapeHtml(input.matricNumber)}) are ready.</p>`,
        `<p><a href=\"${escapeHtml(input.portalLink)}\">View full details</a></p>`,
    ].join("");

    return {
        subject,
        text,
        html,
    };
}