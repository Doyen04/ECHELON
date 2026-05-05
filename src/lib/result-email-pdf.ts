import { readFile } from "node:fs/promises";
import path from "node:path";

import type Mail from "nodemailer/lib/mailer";

type ResultCourse = {
    code: string;
    title: string;
    unit: number;
    grade: string;
    score?: number | null;
};

type StudentResultPdfInput = {
    studentName: string;
    matricNumber: string;
    department: string;
    faculty: string;
    level: number;
    session: string;
    semester: string;
    gpa: number;
    cgpa: number | null;
    courses: ResultCourse[];
    institutionName?: string;
    collegeName?: string;
    programmeName?: string;
    submissionId?: string | null;
    logoUrl?: string | null;
    hodName?: string;
    deanName?: string;
    vcName?: string;
};

function sanitizeCourses(courses: ResultCourse[]): ResultCourse[] {
    return courses
        .map((course) => ({
            code: String(course.code ?? "GEN101").trim().toUpperCase() || "GEN101",
            title: String(course.title ?? "Imported Course").trim() || "Imported Course",
            unit: Number.isFinite(Number(course.unit)) ? Number(course.unit) : 0,
            grade: String(course.grade ?? "N/A").trim().toUpperCase() || "N/A",
            score: Number.isFinite(Number(course.score)) ? Number(course.score) : null,
        }))
        .filter((course) => course.code.length > 0);
}

function formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return "N/A";
    }
    return Number(value).toFixed(2);
}

function safeBaseName(name: string): string {
    const cleaned = name.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    return cleaned || "result";
}

function getInitials(name: string): string {
    return (
        name
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part[0] ?? "")
            .join("")
            .slice(0, 4)
            .toUpperCase() || "MTU"
    );
}

async function loadLogoBytes(logoUrl?: string | null): Promise<{ bytes: Uint8Array; type: "png" | "jpg" } | null> {
    if (!logoUrl) {
        return null;
    }

    try {
        const normalized = logoUrl.trim();
        let bytes: Uint8Array;

        if (/^https?:\/\//i.test(normalized)) {
            const response = await fetch(normalized);
            if (!response.ok) {
                return null;
            }
            bytes = new Uint8Array(await response.arrayBuffer());
        } else {
            const localPath = normalized.startsWith("/")
                ? path.join(process.cwd(), "public", normalized)
                : path.resolve(process.cwd(), normalized);
            bytes = await readFile(localPath);
        }

        const lower = normalized.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return { bytes, type: "jpg" };
        }

        return { bytes, type: "png" };
    } catch {
        return null;
    }
}

export async function buildStudentResultPdfAttachment(
    input: StudentResultPdfInput,
): Promise<Mail.Attachment> {
    const pdfLib = await import("pdf-lib");
    const { PDFDocument, StandardFonts, rgb } = pdfLib;

    const pdfDoc = await PDFDocument.create();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 842;
    const pageHeight = 595;
    const outerMargin = 8;
    const tableTop = 460;
    const centerX = pageWidth / 2;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const drawText = (
        text: string,
        x: number,
        y: number,
        size = 8,
        bold = false,
        options?: { align?: "left" | "center" | "right"; color?: ReturnType<typeof rgb>; opacity?: number },
    ) => {
        const font = bold ? fontBold : fontRegular;
        const align = options?.align ?? "left";
        const color = options?.color ?? rgb(0, 0, 0);
        let xPos = x;

        if (align === "center") {
            xPos = x - font.widthOfTextAtSize(text, size) / 2;
        } else if (align === "right") {
            xPos = x - font.widthOfTextAtSize(text, size);
        }

        page.drawText(text, {
            x: xPos,
            y,
            size,
            font,
            color,
            opacity: options?.opacity,
        });
    };

    const drawLineH = (xStart: number, xEnd: number, y: number, thickness = 0.5) => {
        page.drawLine({
            start: { x: xStart, y },
            end: { x: xEnd, y },
            thickness,
            color: rgb(0, 0, 0),
        });
    };

    const drawLineV = (x: number, yStart: number, yEnd: number, thickness = 0.5) => {
        page.drawLine({
            start: { x, y: yStart },
            end: { x, y: yEnd },
            thickness,
            color: rgb(0, 0, 0),
        });
    };

    const drawBox = (x: number, y: number, width: number, height: number, thickness = 0.5) => {
        page.drawRectangle({
            x,
            y,
            width,
            height,
            borderColor: rgb(0, 0, 0),
            borderWidth: thickness,
            color: rgb(1, 1, 1),
        });
    };

    const institutionName = (input.institutionName || "Mountain Top University").toUpperCase();
    const collegeName = (input.collegeName || input.faculty || "BASIC AND APPLIED SCIENCES").toUpperCase();
    const programmeName = input.programmeName || `${input.department} (Approved)`;
    const watermarkColor = rgb(0.79, 0.69, 0.62);

    drawBox(outerMargin, outerMargin, pageWidth - outerMargin * 2, pageHeight - outerMargin * 2, 1);

    for (const x of [18, 230, 442, 654]) {
        for (const y of [492, 332, 172]) {
            drawText("Not to be taken as", x, y, 24, true, { color: watermarkColor, opacity: 0.18 });
            drawText("Official Result", x, y - 32, 24, true, { color: watermarkColor, opacity: 0.18 });
        }
    }

    const logo = await loadLogoBytes(input.logoUrl);
    if (logo) {
        const embedded = logo.type === "jpg" ? await pdfDoc.embedJpg(logo.bytes) : await pdfDoc.embedPng(logo.bytes);
        page.drawImage(embedded, {
            x: 28,
            y: 515,
            width: 72,
            height: 72,
        });
        drawBox(26, 513, 76, 76, 0.5);
    } else {
        drawBox(26, 513, 76, 76, 0.5);
        drawText(getInitials(institutionName), 64, 551, 18, true, { align: "center" });
        drawText("MOUNTAIN TOP", 64, 541, 5.5, true, { align: "center" });
        drawText("UNIVERSITY", 64, 534, 5.5, true, { align: "center" });
    }

    drawText("MOUNTAIN TOP UNIVERSITY EXAMINATION RESULT", 116, 563, 10, true);
    drawText(`COLLEGE OF ${collegeName}`, 116, 550, 8, true);
    drawText(`DEPARTMENT: ${input.department}`, 116, 537, 7.5, true);
    drawText(`PROGRAMME: ${programmeName}`, 116, 524, 7.5, true);
    drawText(`Submission ID: ${input.submissionId || "N/A"}`, 116, 511, 7.5, true);
    drawText(`SESSION: ${input.session}   SEMESTER: ${input.semester}   LEVEL: ${input.level}`, 116, 498, 7.5, true);

    const courses = sanitizeCourses(input.courses);
    const displayedCourses = Array.from({ length: 15 }, (_, index) => courses[index] ?? null);

    const left = outerMargin;
    const identityWidth = 200;
    const previousWidth = 90;
    const currentWidth = 360;
    const cumulativeWidth = 90;
    const remarksWidth = 86;

    const identityX = left;
    const previousX = identityX + identityWidth;
    const currentX = previousX + previousWidth;
    const cumulativeX = currentX + currentWidth;
    const remarksX = cumulativeX + cumulativeWidth;

    const headerTop = tableTop;
    const codeRowTop = 428;
    const statusRowTop = 405;
    const unitRowTop = 389;
    const dataRowTop = 366;
    const footerTop = 346;
    const bottom = 286;

    drawLineH(left, remarksX + remarksWidth, headerTop, 0.75);
    drawLineH(left, remarksX + remarksWidth, bottom, 0.75);
    drawLineV(identityX, bottom, headerTop, 0.75);
    drawLineV(identityX + identityWidth, bottom, headerTop, 0.75);
    drawLineV(previousX, bottom, headerTop, 0.75);
    drawLineV(currentX, bottom, headerTop, 0.75);
    drawLineV(cumulativeX, bottom, headerTop, 0.75);
    drawLineV(remarksX, bottom, headerTop, 0.75);
    drawLineV(remarksX + remarksWidth, bottom, headerTop, 0.75);

    drawText("Names (Surname First)", identityX + 100, 444, 6.5, true, { align: "center" });
    drawText("Summary of Previous Semester", previousX + previousWidth / 2, 444, 6.25, true, { align: "center" });
    drawText("Current Semester Courses", currentX + currentWidth / 2, 444, 6.25, true, { align: "center" });
    drawText("Current Semester", cumulativeX + cumulativeWidth / 2, 444, 6.25, true, { align: "center" });
    drawText("Remarks", remarksX + remarksWidth / 2, 444, 6.5, true, { align: "center" });

    drawText("SNo", identityX + 7, codeRowTop, 5.5, true);
    drawText("Matric No", identityX + 26, codeRowTop, 5.5, true);

    const previousLabels = ["Units Taken", "Units Used", "Units Passed", "Grade Point", "GPA"];
    previousLabels.forEach((label, index) => {
        const cellX = previousX + index * 18;
        drawLineV(cellX, bottom, headerTop, 0.4);
        drawText(label, cellX + 2, codeRowTop + 10, 4.6, true);
    });

    const courseSlotWidth = 24;
    displayedCourses.forEach((course, index) => {
        const cellX = currentX + index * courseSlotWidth;
        drawLineV(cellX, bottom, headerTop, 0.4);

        if (course) {
            const code = course.code.replace(/\s+/g, "");
            const codeParts = code.match(/^([A-Z]+)(\d+)$/);
            const codeText = codeParts ? `${codeParts[1]}\n${codeParts[2]}` : code;
            drawText(codeText, cellX + 3, codeRowTop, 5.4, true);
            drawText("C", cellX + 10, statusRowTop, 5.8);
            drawText(String(course.unit), cellX + 8, unitRowTop, 5.8);
        }
    });
    drawLineV(currentX + currentWidth, bottom, headerTop, 0.4);

    const totalUnits = displayedCourses.reduce((sum, course) => sum + Number(course?.unit ?? 0), 0);
    const totalPassed = displayedCourses.filter((course) => course && course.grade !== "F" && course.grade !== "N/A").length;
    const totalGradePoints = displayedCourses.reduce((sum, course) => {
        if (!course) {
            return sum;
        }

        const gradePoint = { A: 5, B: 3.5, C: 2, D: 1, E: 0.5, F: 0, P: 0, "N/A": 0 }[course.grade] ?? 0;
        return sum + gradePoint * course.unit;
    }, 0);

    const cumulativeLabels = [
        { label: "Units Taken", value: String(totalUnits) },
        { label: "Units Used For CGPA", value: String(totalUnits) },
        { label: "Units Passed", value: String(totalPassed) },
        { label: "CGPA", value: formatNumber(input.cgpa) },
        { label: "Units Outstanding", value: String(Math.max(totalUnits - totalPassed, 0)) },
    ];

    cumulativeLabels.forEach((item, index) => {
        const cellX = cumulativeX + index * 18;
        drawLineV(cellX, bottom, headerTop, 0.4);
        drawText(item.label, cellX + 1, codeRowTop + 8, 4.4, true);
        drawText(item.value, cellX + 6, dataRowTop, 5.4, true);
    });
    drawLineV(cumulativeX + cumulativeWidth, bottom, headerTop, 0.4);

    const remarkColumns = [
        { label: "Mode of Entry", value: "UTME" },
        { label: "Academic Standing", value: "GSD" },
    ];

    remarkColumns.forEach((item, index) => {
        const cellX = remarksX + index * 43;
        drawLineV(cellX, bottom, headerTop, 0.4);
        drawText(item.label, cellX + 2, codeRowTop + 10, 4.4, true);
        drawText(item.value, cellX + 12, dataRowTop, 5.4, true);
    });
    drawLineV(remarksX + remarksWidth, bottom, headerTop, 0.4);

    drawLineH(left, remarksX + remarksWidth, codeRowTop + 16, 0.4);
    drawLineH(left, remarksX + remarksWidth, statusRowTop + 14, 0.4);
    drawLineH(left, remarksX + remarksWidth, unitRowTop + 14, 0.4);
    drawLineH(left, remarksX + remarksWidth, dataRowTop + 14, 0.4);

    drawText("1", identityX + 6, dataRowTop, 6.4, true);
    drawText(input.matricNumber, identityX + 24, dataRowTop, 6.4, true);
    drawText(input.studentName, identityX + 84, dataRowTop, 6.4, true);

    ["0", "0", "0", formatNumber(totalGradePoints), formatNumber(input.gpa)].forEach((value, index) => {
        const cellX = previousX + index * 18;
        drawText(value, cellX + 5, dataRowTop, 5.4, true);
    });

    displayedCourses.forEach((course, index) => {
        const cellX = currentX + index * courseSlotWidth;
        if (!course) {
            return;
        }

        drawText(String(course.score ?? "--"), cellX + 5, dataRowTop + 6, 5.4, true);
        drawText(course.grade, cellX + 7, dataRowTop - 1, 5.8, true);
    });

    drawLineH(left, remarksX + remarksWidth, footerTop, 0.75);
    drawText(`Total Units Taken: ${totalUnits}`, left + 10, footerTop - 12, 7, true);
    drawText(`Total Passed: ${totalPassed}`, left + 160, footerTop - 12, 7, true);
    drawText(`Total Grade Points: ${formatNumber(totalGradePoints)}`, left + 260, footerTop - 12, 7, true);
    drawText(`GPA: ${formatNumber(input.gpa)}`, left + 415, footerTop - 12, 7, true);
    drawText(`CGPA: ${formatNumber(input.cgpa)}`, left + 500, footerTop - 12, 7, true);

    drawText("Page 1 of 1", centerX, 40, 7.5, true, { align: "center" });
    drawText(`Ag. HOD (${input.hodName || "Dr. Mba Odim"})`, left + 10, 30, 6.5, true);
    drawText(`System Date: ${new Date().toLocaleString()}`, left + 180, 30, 6.5, true);
    drawText(`Vice Chancellor (${input.vcName || "Prof. Elijah Ayolabi"})`, left + 430, 30, 6.5, true);
    drawText(`Ag. Dean (${input.deanName || "Dr. Ofudje Edwin Andrew"})`, left + 180, 18, 6.5, true);

    const bytes = await pdfDoc.save();
    const filename = `${safeBaseName(`${input.matricNumber}-${input.session}-${input.semester}`)}.pdf`;

    return {
        filename,
        content: Buffer.from(bytes),
        contentType: "application/pdf",
    };
}
