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
};

function safeBaseName(name: string): string {
    const cleaned = name.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    return cleaned || "result";
}

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

export async function buildStudentResultPdfAttachment(
    input: StudentResultPdfInput,
): Promise<Mail.Attachment> {
    const pdfLib = await import("pdf-lib");
    const { PDFDocument, StandardFonts, rgb } = pdfLib;

    const pdfDoc = await PDFDocument.create();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Provide a landscape layout to better mimic the broadsheet layout
    const pageWidth = 842;
    const pageHeight = 595;
    const margin = 40;
    const center = pageWidth / 2;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const drawText = (text: string, x: number, yy: number, size = 10, bold = false) => {
        page.drawText(text, {
            x,
            y: yy,
            size,
            font: bold ? fontBold : fontRegular,
            color: rgb(0, 0, 0),
        });
    };

    const drawCenteredText = (text: string, yy: number, size = 10, bold = false) => {
        const textWidth = (bold ? fontBold : fontRegular).widthOfTextAtSize(text, size);
        page.drawText(text, {
            x: center - textWidth / 2,
            y: yy,
            size,
            font: bold ? fontBold : fontRegular,
            color: rgb(0, 0, 0),
        });
    };

    const drawHeader = () => {
        // Mountain Top University Examination Result header style
        drawCenteredText("MOUNTAIN TOP UNIVERSITY EXAMINATION RESULT", y, 14, true);
        y -= 20;

        drawCenteredText(`COLLEGE OF ${input.faculty.toUpperCase()}`, y, 11, true);
        y -= 20;

        // Meta Info Block
        drawText(`DEPARTMENT: ${input.department}`, margin, y, 10, true);
        y -= 14;
        
        drawText(`PROGRAMME: ${input.department} (Approved)`, margin, y, 10, true);
        y -= 14;
        
        drawText(`SESSION: ${input.session}`, margin, y, 10, true);
        drawText(`SEMESTER: ${input.semester}`, margin + 150, y, 10, true);
        drawText(`LEVEL: ${input.level}`, margin + 300, y, 10, true);
        y -= 30;

        // Horizontal Line 1
        page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1 });
        y -= 25;

        // Student Identity Block mimicking the broadsheet format
        drawText("SNo", margin, y, 9, true);
        drawText("Matric No", margin + 30, y, 9, true);
        drawText("Names (Surname First)", margin + 140, y, 9, true);

        // Course Codes column headers (horizontal layout)
        let cx = margin + 350;
        const maxDisplayCourses = 10;
        const coursesToDisplay = input.courses.slice(0, maxDisplayCourses);

        drawText("Courses", cx, y + 10, 9, true);
        coursesToDisplay.forEach((course) => {
            // Draw course code vertically or split? Let's just print them
            drawText(course.code, cx, y, 8, true);
            cx += 45;
        });

        y -= 15;
        
        // Course Status & Units
        drawText("Course Status", margin + 270, y, 8, true);
        cx = margin + 350;
        coursesToDisplay.forEach((course) => {
            drawText("C", cx + 5, y, 8); // Assuming Compulsory in absence of actual
            cx += 45;
        });
        
        y -= 15;
        drawText("No. of Units", margin + 270, y, 8, true);
        cx = margin + 350;
        coursesToDisplay.forEach((course) => {
            drawText(String(course.unit), cx + 5, y, 8);
            cx += 45;
        });

        y -= 15;
        // Horizontal Line 2
        page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1 });
        y -= 15;
    };

    drawHeader();
    
    // Row iteration (Only 1 student per PDF, but we mimic the layout)
    const courses = sanitizeCourses(input.courses);
    const safeCourses = courses.length > 0
        ? courses
        : [{ code: "GEN101", title: "Imported Course", unit: 0, grade: "N/A", score: null }];

    drawText("1", margin, y, 9);
    drawText(input.matricNumber, margin + 30, y, 9);
    drawText(input.studentName, margin + 140, y, 9);

    let cx = margin + 350;
    const maxDisplayCourses = 10;
    
    // Print scores and grades directly below course codes
    safeCourses.slice(0, maxDisplayCourses).forEach((course) => {
        const scoreStr = course.score !== null ? String(course.score) : "--";
        drawText(course.grade, cx + 5, y + 8, 8, true);
        drawText(scoreStr, cx + 5, y - 4, 8);
        cx += 45;
    });

    y -= 30;

    // Draw Cumulative Totals block below the row
    page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.5 });
    y -= 15;

    const totalUnits = safeCourses.reduce((sum, course) => sum + Number(course.unit ?? 0), 0);
    drawText(`Total Units Taken: ${totalUnits}`, margin, y, 9);
    drawText(`Grade Point Average: ${formatNumber(input.gpa)}`, margin + 150, y, 9);
    drawText(`Cumulative GPA: ${formatNumber(input.cgpa)}`, margin + 350, y, 9);
    y -= 25;

    drawText("Page 1 of 1", center - 30, 40, 8);
    drawText("Ag. HOD / Dean", margin, 40, 9);
    drawText("Vice Chancellor", pageWidth - margin - 80, 40, 9);

    const bytes = await pdfDoc.save();
    const filename = `${safeBaseName(`${input.matricNumber}-${input.session}-${input.semester}`)}.pdf`;

    return {
        filename,
        content: Buffer.from(bytes),
        contentType: "application/pdf",
    };
}
