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
    const fontR  = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontB  = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // A4 landscape
    const PW = 842, PH = 595, OM = 12;
    const page  = pdfDoc.addPage([PW, PH]);
    const BLACK = rgb(0, 0, 0);
    const WHITE = rgb(1, 1, 1);
    const WM    = rgb(0.79, 0.69, 0.62);

    // ── drawing helpers ──────────────────────────────────────────────────────
    const hLine = (x1: number, x2: number, y: number, w = 0.5) =>
        page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: w, color: BLACK });
    const vLine = (x: number, y1: number, y2: number, w = 0.5) =>
        page.drawLine({ start: { x, y: y1 }, end: { x, y: y2 }, thickness: w, color: BLACK });
    const bRect = (x: number, y: number, w: number, h: number, bw = 0.5) =>
        page.drawRectangle({ x, y, width: w, height: h, borderColor: BLACK, borderWidth: bw, color: WHITE });

    // drawT: x is the anchor point; align "c" centres around x, "r" right-aligns to x.
    // clip: max pixel width — text is truncated to fit (never overflows the cell).
    type TO = { bold?: boolean; align?: "l"|"c"|"r"; color?: ReturnType<typeof rgb>; opacity?: number; clip?: number };
    const drawT = (text: string, x: number, y: number, size: number, opts: TO = {}) => {
        const font = opts.bold ? fontB : fontR;
        let s = text;
        if (opts.clip != null) {
            while (s.length > 1 && font.widthOfTextAtSize(s, size) > opts.clip - 1) s = s.slice(0, -1);
        }
        const tw = font.widthOfTextAtSize(s, size);
        let xp = x;
        if (opts.align === "c") xp = x - tw / 2;
        else if (opts.align === "r") xp = x - tw;
        page.drawText(s, { x: xp, y, size, font, color: opts.color ?? BLACK, opacity: opts.opacity });
    };

    // ── outer page border ────────────────────────────────────────────────────
    bRect(OM, OM, PW - 2 * OM, PH - 2 * OM, 1.0);

    // ── watermarks ───────────────────────────────────────────────────────────
    for (const wy of [490, 335, 180]) {
        for (const wx of [OM + 14, 224, 434, 644]) {
            drawT("Not to be taken as", wx, wy,      22, { bold: true, color: WM, opacity: 0.15 });
            drawT("Official Result",    wx, wy - 30, 22, { bold: true, color: WM, opacity: 0.15 });
        }
    }

    // ── logo ─────────────────────────────────────────────────────────────────
    const LX = OM + 6, LY = 510, LW = 74, LH = 74;
    const logo = await loadLogoBytes(input.logoUrl);
    if (logo) {
        const img = logo.type === "jpg" ? await pdfDoc.embedJpg(logo.bytes) : await pdfDoc.embedPng(logo.bytes);
        page.drawImage(img, { x: LX, y: LY, width: LW, height: LH });
    } else {
        bRect(LX, LY, LW, LH, 0.75);
        drawT(getInitials(input.institutionName || "Mountain Top University"), LX + LW / 2, LY + 38, 16, { bold: true, align: "c" });
        drawT("MOUNTAIN TOP", LX + LW / 2, LY + 25, 5.5, { bold: true, align: "c" });
        drawT("UNIVERSITY",   LX + LW / 2, LY + 17, 5.5, { bold: true, align: "c" });
    }

    // ── header text ──────────────────────────────────────────────────────────
    const rawFaculty = input.collegeName || input.faculty || "";
    const isGenericFaculty = !rawFaculty || /^general$/i.test(rawFaculty.trim());
    const collegeName = isGenericFaculty
        ? "BASIC AND APPLIED SCIENCES"
        : rawFaculty.toUpperCase().replace(/^COLLEGE OF\s+/i, "");
    const programmeName = input.programmeName || `${input.department} (Approved)`;
    const HX = LX + LW + 14;

    drawT("MOUNTAIN TOP UNIVERSITY EXAMINATION RESULT", HX, 570, 11,  { bold: true });
    drawT(`COLLEGE OF ${collegeName}`,                  HX, 556, 8.5, { bold: true });
    drawT(`DEPARTMENT: ${input.department}`,            HX, 543, 8,   { bold: true });
    drawT(`PROGRAMME: ${programmeName}`,                HX, 530, 8,   { bold: true });
    drawT(`Submission ID: ${input.submissionId || "N/A"}`, HX, 517, 7.5);
    drawT(`SESSION: ${input.session}   SEMESTER: ${input.semester}   LEVEL: ${input.level}`, HX, 504, 8, { bold: true });

    // ── column geometry ───────────────────────────────────────────────────────
    const courses   = sanitizeCourses(input.courses);
    const displayed = courses.slice(0, 15);
    const nC        = Math.max(displayed.length, 1);

    // Fixed section widths (pts)
    const W_SNO     = 18;
    const W_MAT     = 73;
    const W_NAME    = 107;
    const W_ID      = W_SNO + W_MAT + W_NAME;  // 198

    const W_PRCOL   = 16;   // previous semester sub-col width
    const W_PR      = W_PRCOL * 5;             // 80

    const W_CUMCOL  = 20;   // cumulative sub-col width
    const W_CUM     = W_CUMCOL * 5;            // 100

    const W_REMCOL  = 40;   // remarks sub-col width
    const W_REM     = W_REMCOL * 2;            // 80

    // Course section: minimum 300pt so section label always fits; max 360pt
    const CRS_SEC   = Math.max(300, Math.min(360, nC * 60));
    const W_CRS     = Math.floor(CRS_SEC / nC);

    // X anchors (left edge of each section; table starts at OM=12)
    const xL   = OM;
    const xMat = xL   + W_SNO;
    const xNam = xMat + W_MAT;
    const xPR  = xL   + W_ID;
    const xCRS = xPR  + W_PR;
    const xCUM = xCRS + nC * W_CRS;
    const xREM = xCUM + W_CUM;
    const xR   = xREM + W_REM;

    // ── Y row boundaries (bottom-up; yTop is the highest, yFotB the lowest) ──
    // Row heights: secHdr=16, ch1=12, ch2=12, typeRow=10, unitsRow=10, dataRow=52, footerRow=55
    const yTop  = 465;  // table top border
    const ySHB  = 449;  // section-header row bottom  (16 pt tall)
    const yCH1B = 437;  // col-header row-1 bottom    (12 pt)
    const yCH2B = 425;  // col-header row-2 bottom    (12 pt)
    const yTypB = 415;  // course-type row bottom     (10 pt)
    const yUntB = 405;  // units row bottom           (10 pt)
    const yDatB = 353;  // data row bottom            (52 pt)
    const yFotB = 298;  // footer row bottom          (55 pt)

    // Text Y positions: baseline = rowBottom + padding
    const ySHT  = ySHB  + 5;   // section-header single-line baseline  (454)
    const ySH1  = ySHB  + 10;  // section-header two-line: upper line  (459)
    const ySH2  = ySHB  + 2;   // section-header two-line: lower line  (451)
    const yCH1  = yCH1B + 3;   // col-header row-1 baseline            (440)
    const yCH2  = yCH2B + 3;   // col-header row-2 baseline            (428)
    const yTyp  = yTypB + 2;   // type-row baseline                    (417)
    const yUnt  = yUntB + 2;   // units-row baseline                   (407)
    const yScr  = yDatB + 32;  // score (upper) in data row            (385)
    const yGrd  = yDatB + 14;  // grade (lower) in data row            (367)
    const yDat  = yDatB + 22;  // general value baseline in data row   (375)
    const yFot  = yFotB + 24;  // footer row text baseline             (322)

    // ── table borders ─────────────────────────────────────────────────────────
    hLine(xL, xR, yTop,  0.75);
    hLine(xL, xR, yFotB, 0.75);
    vLine(xL, yFotB, yTop, 0.75);
    vLine(xR, yFotB, yTop, 0.75);

    // Section vertical dividers (full table height)
    for (const vx of [xPR, xCRS, xCUM, xREM]) vLine(vx, yFotB, yTop, 0.75);

    // Identity sub-dividers
    vLine(xMat, yFotB, yTop, 0.4);
    vLine(xNam, yFotB, yTop, 0.4);

    // Horizontal header-row dividers
    for (const hy of [ySHB, yCH1B, yCH2B, yTypB, yUntB]) hLine(xL, xR, hy, 0.4);

    // Data row bottom (heavier)
    hLine(xL, xR, yDatB, 0.75);

    // ── section-header labels ─────────────────────────────────────────────────
    // Identity: "Names (Surname First)" — centred in 198 pt
    drawT("Names (Surname First)", xL + W_ID / 2, ySHT, 6.5, { bold: true, align: "c" });

    // Previous semester: two lines to fit in 80 pt
    drawT("Summary of Previous", xPR + W_PR / 2, ySH1, 5.5, { bold: true, align: "c", clip: W_PR });
    drawT("Semester",             xPR + W_PR / 2, ySH2, 5.5, { bold: true, align: "c" });

    // Course section: centred in CRS_SEC width
    drawT("Current Semester Courses", xCRS + nC * W_CRS / 2, ySHT, 5.5, { bold: true, align: "c", clip: CRS_SEC - 4 });

    // Current semester summary
    drawT("Current Semester", xCUM + W_CUM / 2, ySHT, 5.5, { bold: true, align: "c" });

    // Remarks
    drawT("Remarks", xREM + W_REM / 2, ySHT, 6.5, { bold: true, align: "c" });

    // ── identity column headers ───────────────────────────────────────────────
    drawT("SNo",   xL   + W_SNO / 2, yCH2 + 4, 5.5, { bold: true, align: "c" });
    drawT("Matric",xMat + W_MAT / 2, yCH1,     5.5, { bold: true, align: "c" });
    drawT("No",    xMat + W_MAT / 2, yCH2,     5.5, { bold: true, align: "c" });

    // ── previous semester sub-column headers ──────────────────────────────────
    const prevR1 = ["Units", "Units", "Units", "Grade", "GPA"];
    const prevR2 = ["Taken", "Used",  "Passed","Points",""];
    for (let i = 0; i < 5; i++) {
        const cx = xPR + i * W_PRCOL;
        vLine(cx, yFotB, ySHB, 0.4);
        const mx = cx + W_PRCOL / 2;
        drawT(prevR1[i], mx, yCH1, 4.0, { bold: true, align: "c", clip: W_PRCOL });
        if (prevR2[i]) drawT(prevR2[i], mx, yCH2, 4.0, { bold: true, align: "c", clip: W_PRCOL });
    }

    // ── course column headers ─────────────────────────────────────────────────
    for (let i = 0; i < displayed.length; i++) {
        const cx = xCRS + i * W_CRS;
        vLine(cx, yFotB, ySHB, 0.4);
        const mx = cx + W_CRS / 2;
        const code = displayed[i].code.replace(/\s+/g, "");
        const m = code.match(/^([A-Z]+)(\d+)$/);
        if (m) {
            drawT(m[1], mx, yCH1, 5.2, { bold: true, align: "c", clip: W_CRS });
            drawT(m[2], mx, yCH2, 5.2, { bold: true, align: "c", clip: W_CRS });
        } else {
            drawT(code, mx, yCH2 + 4, 4.5, { bold: true, align: "c", clip: W_CRS });
        }
        drawT("C",                        mx, yTyp, 5.5, { align: "c" });
        drawT(String(displayed[i].unit),  mx, yUnt, 5.5, { bold: true, align: "c" });
    }
    vLine(xCRS + nC * W_CRS, yFotB, ySHB, 0.4);  // right edge of course section

    // ── cumulative column headers ─────────────────────────────────────────────
    const cumR1 = ["Units",  "Units",  "Grade",  "GPA",  "CGPA"];
    const cumR2 = ["Taken",  "Passed", "Points", "",     ""];
    for (let i = 0; i < 5; i++) {
        const cx = xCUM + i * W_CUMCOL;
        vLine(cx, yFotB, ySHB, 0.4);
        const mx = cx + W_CUMCOL / 2;
        drawT(cumR1[i], mx, yCH1, 4.0, { bold: true, align: "c", clip: W_CUMCOL });
        if (cumR2[i]) drawT(cumR2[i], mx, yCH2, 4.0, { bold: true, align: "c", clip: W_CUMCOL });
    }

    // ── remarks column headers ────────────────────────────────────────────────
    const remR1 = ["Mode of",   "Academic"];
    const remR2 = ["Entry",     "Standing"];
    for (let i = 0; i < 2; i++) {
        const cx = xREM + i * W_REMCOL;
        vLine(cx, yFotB, ySHB, 0.4);
        const mx = cx + W_REMCOL / 2;
        drawT(remR1[i], mx, yCH1, 4.5, { bold: true, align: "c", clip: W_REMCOL });
        drawT(remR2[i], mx, yCH2, 4.5, { bold: true, align: "c", clip: W_REMCOL });
    }

    // ── student data row ──────────────────────────────────────────────────────
    const gradeScale: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0, P: 0 };
    const totalUnits       = displayed.reduce((s, c) => s + Number(c.unit ?? 0), 0);
    const totalPassed      = displayed.filter(c => (gradeScale[c.grade] ?? 0) >= 1).reduce((s, c) => s + Number(c.unit ?? 0), 0);
    const totalGradePoints = displayed.reduce((s, c) => s + Number(c.unit ?? 0) * (gradeScale[c.grade] ?? 0), 0);
    const computedGpa      = totalUnits > 0 ? totalGradePoints / totalUnits : input.gpa;

    // Identity
    drawT("1", xL + W_SNO / 2, yDat, 6.5, { bold: true, align: "c" });
    drawT(input.matricNumber, xMat + W_MAT / 2, yDat, 6, { bold: true, align: "c", clip: W_MAT - 2 });
    const nameParts = input.studentName.trim().split(/\s+/);
    const dispName  = nameParts.length > 1
        ? `${nameParts[0].toUpperCase()}, ${nameParts.slice(1).join(" ")}`
        : input.studentName;
    drawT(dispName, xNam + 3, yDat, 6.5, { bold: true, clip: W_NAME - 6 });

    // Previous semester — all zeros (no historical data ingested yet)
    for (let i = 0; i < 5; i++) {
        drawT("0", xPR + i * W_PRCOL + W_PRCOL / 2, yDat, 5.5, { align: "c" });
    }

    // Course scores (upper half of data row) and grades (lower half)
    for (let i = 0; i < displayed.length; i++) {
        const mx = xCRS + i * W_CRS + W_CRS / 2;
        drawT(displayed[i].score != null ? String(displayed[i].score) : "—", mx, yScr, 5.5, { bold: true, align: "c" });
        drawT(displayed[i].grade, mx, yGrd, 6, { bold: true, align: "c" });
    }

    // Cumulative values
    const cumVals = [
        String(totalUnits),
        String(totalPassed),
        String(totalGradePoints),
        formatNumber(computedGpa),
        input.cgpa != null ? formatNumber(input.cgpa) : "N/A",
    ];
    for (let i = 0; i < 5; i++) {
        drawT(cumVals[i], xCUM + i * W_CUMCOL + W_CUMCOL / 2, yDat, 5.5, { bold: true, align: "c" });
    }

    // Remarks values
    drawT("UTME", xREM + W_REMCOL / 2,            yDat, 5.5, { bold: true, align: "c" });
    drawT("GSD",  xREM + W_REMCOL + W_REMCOL / 2, yDat, 5.5, { bold: true, align: "c" });

    // ── footer summary row ────────────────────────────────────────────────────
    drawT(`Total Units Taken: ${totalUnits}`,             xL + 10,  yFot, 7, { bold: true });
    drawT(`Total Units Passed: ${totalPassed}`,           xL + 155, yFot, 7, { bold: true });
    drawT(`Total Grade Points: ${totalGradePoints}`,      xL + 310, yFot, 7, { bold: true });
    drawT(`GPA: ${formatNumber(computedGpa)}`,            xL + 480, yFot, 7, { bold: true });
    drawT(`CGPA: ${input.cgpa != null ? formatNumber(input.cgpa) : "N/A"}`, xL + 560, yFot, 7, { bold: true });

    // ── signatures ────────────────────────────────────────────────────────────
    drawT("Page 1 of 1",                                                      PW / 2,    42, 7.5, { bold: true, align: "c" });
    drawT(`Ag. HOD (${input.hodName || "Dr. Mba Odim"})`,                    xL + 10,   30, 6.5, { bold: true });
    drawT(`System Date: ${new Date().toLocaleString()}`,                       xL + 180,  30, 6.5);
    drawT(`Vice Chancellor (${input.vcName || "Prof. Elijah Ayolabi"})`,      xL + 430,  30, 6.5, { bold: true });
    drawT(`Ag. Dean (${input.deanName || "Dr. Ofudje Edwin Andrew"})`,        xL + 180,  18, 6.5, { bold: true });

    // ── save ──────────────────────────────────────────────────────────────────
    const bytes = await pdfDoc.save();
    const filename = `${safeBaseName(`${input.matricNumber}-${input.session}-${input.semester}`)}.pdf`;
    return { filename, content: Buffer.from(bytes), contentType: "application/pdf" };
}
