import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join, normalize, resolve } from "node:path";

import type Mail from "nodemailer/lib/mailer";

const PDF_UPLOAD_DIRECTORY = resolve(process.cwd(), "public", "uploads", "results");
const PUBLIC_DIRECTORY = resolve(process.cwd(), "public");

function looksLikePdf(file: File): boolean {
    const lowerName = file.name.toLowerCase();
    const lowerType = file.type.toLowerCase();
    return lowerName.endsWith(".pdf") || lowerType.includes("pdf");
}

function safeBaseName(name: string): string {
    const withoutExtension = name.replace(/\.[^.]+$/, "");
    const cleaned = withoutExtension.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    return cleaned || "result";
}

export async function persistUploadedResultPdf(file: File): Promise<string | null> {
    if (!looksLikePdf(file)) {
        return null;
    }

    await mkdir(PDF_UPLOAD_DIRECTORY, { recursive: true });
    const filename = `${safeBaseName(file.name)}-${randomUUID()}.pdf`;
    const outputPath = join(PDF_UPLOAD_DIRECTORY, filename);

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(outputPath, fileBuffer);

    return `/uploads/results/${filename}`;
}

export async function buildUploadedPdfAttachment(rawFileUrl: string | null | undefined): Promise<Mail.Attachment | null> {
    if (!rawFileUrl) {
        return null;
    }

    const normalizedUrlPath = normalize(rawFileUrl).replaceAll("\\", "/");
    if (!normalizedUrlPath.toLowerCase().endsWith(".pdf")) {
        return null;
    }

    const relativePath = normalizedUrlPath.startsWith("/") ? normalizedUrlPath.slice(1) : normalizedUrlPath;
    const absolutePath = resolve(PUBLIC_DIRECTORY, relativePath);

    if (!absolutePath.startsWith(PUBLIC_DIRECTORY)) {
        return null;
    }

    const fileContent = await readFile(absolutePath).catch(() => null);
    if (!fileContent) {
        return null;
    }

    const defaultFileName = basename(absolutePath);
    const fileName = extname(defaultFileName).toLowerCase() === ".pdf" ? defaultFileName : `${defaultFileName}.pdf`;

    return {
        filename: fileName,
        content: fileContent,
        contentType: "application/pdf",
    };
}