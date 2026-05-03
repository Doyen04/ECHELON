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

export async function buildStudentResultPdfAttachment(
    input: StudentResultPdfInput,
): Promise<Mail.Attachment> {
    const pdfLib = await import("pdf-lib");
    const { PDFDocument, StandardFonts, rgb } = pdfLib;

    const pdfDoc = await PDFDocument.create();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Landscape A4
    const pageWidth = 842;
    const pageHeight = 595;
    const margin = 30;
    const centerX = pageWidth / 2;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const drawText = (text: string, x: number, yy: number, size = 9, bold = false, aligned = "left") => {
        const font = bold ? fontBold : fontRegular;
        let xPos = x;

        if (aligned === "center") {
            const textWidth = font.widthOfTextAtSize(text, size);
            xPos = x - textWidth / 2;
        } else if (aligned === "right") {
            const textWidth = font.widthOfTextAtSize(text, size);
            xPos = x - textWidth;
        }

        page.drawText(text, {
            x: xPos,
            y: yy,
            size,
            font,
            color: rgb(0, 0, 0),
        });
    };

    const drawLineH = (xStart: number, xEnd: number, yy: number, thickness = 0.5) => {
        page.drawLine({
            start: { x: xStart, y: yy },
            end: { x: xEnd, y: yy },
            thickness,
            color: rgb(0, 0, 0),
        });
    };

    const drawLineV = (xx: number, yStart: number, yEnd: number, thickness = 0.5) => {
        page.drawLine({
            start: { x: xx, y: yStart },
            end: { x: xx, y: yEnd },
            thickness,
            color: rgb(0, 0, 0),
        });
    };

    // Main Header
    drawText("MOUNTAIN TOP UNIVERSITY EXAMINATION RESULT", centerX, y, 12, true, "center");
    y -= 18;

    drawText(`COLLEGE OF ${(input.collegeName || input.faculty || "BASIC AND APPLIED SCIENCES").toUpperCase()}`, centerX, y, 11, true, "center");
    y -= 16;

    // Meta Information
    drawText(`DEPARTMENT: ${input.department}`, margin, y, 9, true);
    y -= 12;

    drawText(
        `PROGRAMME: ${input.programmeName || `${input.department} (Approved)`}`,
        margin,
        y,
        9,
        true,
    );
    drawText(`Submission ID:`, pageWidth - margin - 120, y, 9, true);
    y -= 12;

    drawText(`SESSION: ${input.session}`, margin, y, 9, true);
    drawText(`SEMESTER: ${input.semester}`, margin + 150, y, 9, true);
    drawText(`LEVEL: ${input.level}`, margin + 300, y, 9, true);
    y -= 14;

    // Header section separator
    drawLineH(margin, pageWidth - margin, y, 1);
    y -= 10;

    // Table Headers Row 1: Main Categories
    drawText("Names (Surname First)", margin + 80, y, 8, true);
    drawText("Summary of Previous Semester", margin + 250, y, 8, true);
    drawText("Current Semester", margin + 450, y, 8, true);
    drawText("Remarks", pageWidth - margin - 80, y, 8, true);
    y -= 11;

    // Sub-header description (minimal)
    drawText("SNo", margin, y, 8, true);
    drawText("Matric No", margin + 30, y, 8, true);

    // Course codes at top
    const courses = sanitizeCourses(input.courses);
    const maxCourseTodisplay = 15;
    const coursesToShow = courses.slice(0, maxCourseTodisplay);

    let courseX = margin + 250;
    coursesToShow.forEach((course, idx) => {
        const codeParts = course.code.match(/^([A-Z]+)(\d+.*)$/);
        if (codeParts) {
            drawText(codeParts[1], courseX, y + 4, 7, true);
            drawText(codeParts[2], courseX, y - 2, 7, true);
        } else {
            drawText(course.code, courseX, y, 7, true);
        }
        courseX += 35;
    });

    y -= 14;
    drawLineH(margin, pageWidth - margin, y, 0.5);
    y -= 8;

    // Row: Course Status
    drawText("Course Status", margin + 200, y, 7, true);
    courseX = margin + 250;
    coursesToShow.forEach(() => {
        drawText("C", courseX + 3, y, 7);
        courseX += 35;
    });
    y -= 10;

    // Row: Number of Units
    drawText("No. of Units", margin + 200, y, 7, true);
    courseX = margin + 250;
    coursesToShow.forEach((course) => {
        drawText(String(course.unit), courseX + 3, y, 7);
        courseX += 35;
    });
    y -= 12;

    drawLineH(margin, pageWidth - margin, y, 1);
    y -= 10;

    // Student Data Row
    drawText("1", margin, y, 9);
    drawText(input.matricNumber, margin + 30, y, 9);
    drawText(input.studentName.substring(0, 30), margin + 80, y, 8);

    // Previous Semester Metric Placeholders (empty in this case)
    drawText("0", margin + 255, y, 8);
    drawText("0", margin + 285, y, 8);
    drawText("0", margin + 315, y, 8);
    drawText("0.00", margin + 345, y, 8);
    drawText("0", margin + 375, y, 8);

    // Current Semester Scores
    courseX = margin + 250;
    coursesToShow.forEach((course) => {
        const scoreStr = course.score !== null ? String(course.score) : "--";
        drawText(scoreStr, courseX - 2, y + 5, 7);
        drawText(course.grade, courseX + 3, y - 3, 8, true);
        courseX += 35;
    });

    // Remarks column (Academic Standing)
    drawText("GSD", pageWidth - margin - 50, y, 8);
    drawText("1", pageWidth - margin - 80, y, 8);

    y -= 15;

    // Summary totals section
    drawLineH(margin, pageWidth - margin, y, 0.5);
    y -= 10;

    const totalUnits = coursesToShow.reduce((sum, course) => sum + Number(course.unit ?? 0), 0);
    const totalPassed = coursesToShow.filter((c) => c.grade !== "F" && c.grade !== "N/A").length;
    const totalGradePoints = coursesToShow.reduce((sum, c) => {
        const gradePoint = { A: 5, B: 3.5, C: 2, D: 1, E: 0.5, F: 0, P: 0, "N/A": 0 }[c.grade] ?? 0;
        return sum + gradePoint * c.unit;
    }, 0);

    drawText("Total Units Taken", margin, y, 8, true);
    drawText(String(totalUnits), margin + 150, y, 8);
    y -= 10;

    drawText("Total Units Passed", margin, y, 8, true);
    drawText(String(totalPassed), margin + 150, y, 8);
    y -= 10;

    drawText("Total Grade Points", margin, y, 8, true);
    drawText(formatNumber(totalGradePoints), margin + 150, y, 8);
    y -= 10;

    drawText("Grade Point Average", margin, y, 8, true);
    drawText(formatNumber(input.gpa), margin + 150, y, 8);
    y -= 10;

    // Cumulative Column
    drawText("Cumulative Units Taken", margin + 300, y + 30, 8, true);
    drawText("24", margin + 450, y + 30, 8);
    drawText("Cumulative Units Used For CGPA", margin + 300, y + 20, 8, true);
    drawText("24", margin + 450, y + 20, 8);
    drawText("Cumulative Units Passed", margin + 300, y + 10, 8, true);
    drawText("24", margin + 450, y + 10, 8);
    drawText("Cumulative GPA", margin + 300, y, 8, true);
    drawText(formatNumber(input.cgpa), margin + 450, y, 8);

    y -= 50;

    // Footer
    drawLineH(margin, pageWidth - margin, y, 0.5);
    y -= 8;

    drawText("Page 1 of 1", centerX, y, 8, false, "center");
    y -= 12;

    drawText(`Ag. HOD (${input.hodName || "Dr. Mba Odim"})`, margin, y, 7);
    drawText(`System Date: ${new Date().toLocaleString()}`, margin + 200, y, 7);
    drawText(`Vice Chancellor(${input.vcName || "Prof. Elijah Ayolabi"})`, margin + 450, y, 7);
    y -= 10;

    drawText(`Ag. Dean (${input.deanName || "Dr. Ofudje Edwin Andrew"})`, margin + 200, y, 7);

    const bytes = await pdfDoc.save();
    const filename = `${safeBaseName(`${input.matricNumber}-${input.session}-${input.semester}`)}.pdf`;

    return {
        filename,
        content: Buffer.from(bytes),
        contentType: "application/pdf",
    };
}
