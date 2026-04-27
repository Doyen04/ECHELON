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

export async function buildStudentScopedPdfAttachment(rawFileUrl: string | null | undefined, matricNumber: string): Promise<Mail.Attachment | null> {
    if (!rawFileUrl) return null;

    const normalizedUrlPath = normalize(rawFileUrl).replaceAll("\\", "/");
    if (!normalizedUrlPath.toLowerCase().endsWith(".pdf")) return null;

    const relativePath = normalizedUrlPath.startsWith("/") ? normalizedUrlPath.slice(1) : normalizedUrlPath;
    const absolutePath = resolve(PUBLIC_DIRECTORY, relativePath);
    if (!absolutePath.startsWith(PUBLIC_DIRECTORY)) return null;

    const fileContent = await readFile(absolutePath).catch(() => null);
    if (!fileContent) return null;

    // Try to find which pages contain the matric number using pdf-parse.
    try {
        // Dynamically import to avoid server bundling issues
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pdfParseModule: any = await import("pdf-parse");
        const ParserClass = pdfParseModule.PDFParse ?? pdfParseModule.default?.PDFParse;
        let pagesText: string[] = [];

        if (ParserClass) {
            const parser = new ParserClass({ data: Buffer.from(fileContent) });
            // `getText()` may expose `pages` or `text` with form feeds.
            const parsed = await parser.getText();
            await parser.destroy();

            if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
                pagesText = parsed.pages.map((p: any) => String(p.text ?? "").toUpperCase());
            } else if (typeof parsed.text === "string") {
                // split by form-feed which some parsers use to separate pages
                pagesText = String(parsed.text).split(/\f+/).map((s: string) => s.toUpperCase());
            }
        }

        const target = matricNumber.toUpperCase();
        const pageIndexes: number[] = [];
        for (let i = 0; i < pagesText.length; i++) {
            const text = pagesText[i] ?? "";
            if (text.includes(target)) {
                pageIndexes.push(i);
            }
        }

        if (pageIndexes.length === 0) {
            return null;
        }

        // Use pdf-lib to copy the selected pages into a new PDF
        const pdfLib = await import("pdf-lib");
        const { PDFDocument } = pdfLib;
        const srcDoc = await PDFDocument.load(fileContent);
        const newDoc = await PDFDocument.create();
        const copied = await newDoc.copyPages(srcDoc, pageIndexes);
        for (const p of copied) newDoc.addPage(p);

        const bytes = await newDoc.save();
        const filename = `${safeBaseName(basename(absolutePath))}-${matricNumber}.pdf`;

        return {
            filename,
            content: Buffer.from(bytes),
            contentType: "application/pdf",
        } as Mail.Attachment;
    } catch (err) {
        return null;
    }
}