import { Buffer } from "node:buffer";

export type StudentImportRow = {
    matricNumber: string;
    studentName: string;
    department: string;
    faculty: string;
    level: number;
    gpa: number;
    cgpa: number | null;
    parentName: string | null;
    parentEmail: string | null;
    parentPhone: string | null;
    relationship: string;
    courses: Array<{
        code: string;
        title: string;
        unit: number;
        grade: string;
        score: number | null;
    }>;
};

const GRADE_POINTS: Record<string, number> = {
    "A": 5,
    "A-": 4.5,
    "B+": 4,
    "B": 3.5,
    "B-": 3,
    "C+": 2.5,
    "C": 2,
    "C-": 1.5,
    "D": 1,
    "E": 0.5,
    "F": 0,
    "P": 0,
    "N/A": 0,
};

export type ParentContactImportRow = {
    matricNumber: string;
    parentName: string | null;
    parentEmail: string | null;
    parentPhone: string | null;
    relationship: string;
};

function normalizeHeader(header: string): string {
    return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseNumber(value: string | undefined, fallback = 0): number {
    const parsed = Number((value ?? "").trim());
    return Number.isFinite(parsed) ? parsed : fallback;
}

function parseNullableNumber(value: string | undefined): number | null {
    const raw = (value ?? "").trim();
    if (!raw) {
        return null;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
}

function gradeFromScore(score: number | null): string {
    if (score === null) {
        return "N/A";
    }

    if (score >= 70) {
        return "A";
    }
    if (score >= 60) {
        return "B";
    }
    if (score >= 50) {
        return "C";
    }
    if (score >= 45) {
        return "D";
    }
    if (score >= 40) {
        return "E";
    }
    return "F";
}

function normalizeGrade(grade: string | undefined, score: number | null): string {
    const normalized = (grade ?? "").trim().toUpperCase();
    if (!normalized || normalized === "-" || normalized === "NIL") {
        return gradeFromScore(score);
    }

    return GRADE_POINTS[normalized] !== undefined ? normalized : gradeFromScore(score);
}

export function calculateGpaFromCourses(courses: Array<{ unit: number; grade: string }>): number | null {
    const validCourses = courses.filter((course) => Number.isFinite(course.unit) && course.unit > 0);
    const totalUnits = validCourses.reduce((sum, course) => sum + course.unit, 0);

    if (totalUnits === 0) {
        return null;
    }

    const totalPoints = validCourses.reduce((sum, course) => {
        const gradePoint = GRADE_POINTS[course.grade.toUpperCase()] ?? 0;
        return sum + (gradePoint * course.unit);
    }, 0);

    return Number((totalPoints / totalUnits).toFixed(2));
}

function parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const nextChar = line[index + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    values.push(current.trim());
    return values;
}

function csvToRows(csvText: string): Array<Record<string, string>> {
    const lines = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length < 2) {
        return [];
    }

    const headers = parseCsvLine(lines[0]).map(normalizeHeader);
    const rows: Array<Record<string, string>> = [];

    for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
        const values = parseCsvLine(lines[rowIndex]);
        const row: Record<string, string> = {};

        headers.forEach((header, headerIndex) => {
            row[header] = values[headerIndex] ?? "";
        });

        rows.push(row);
    }

    return rows;
}

type FlatStudentCsvRow = {
    matricNumber: string;
    studentName: string;
    department: string;
    faculty: string;
    level: number;
    gpa: number;
    cgpa: number | null;
    courseCode: string;
    courseTitle: string;
    unit: number;
    grade: string;
    score: number | null;
    parentName: string | null;
    parentEmail: string | null;
    parentPhone: string | null;
    relationship: string;
};

function mapStudentCsvRow(raw: Record<string, string>, fallbackDepartment: string): FlatStudentCsvRow | null {
    const matricNumber = (raw.matric_number ?? raw.matric ?? raw.matric_no ?? "").trim();
    const studentName = (raw.student_name ?? raw.full_name ?? raw.name ?? "").trim();

    if (!matricNumber || !studentName) {
        return null;
    }

    const score = parseNullableNumber(raw.score ?? raw.total_score);
    const grade = normalizeGrade(raw.grade, score);

    return {
        matricNumber,
        studentName,
        department: (raw.department ?? fallbackDepartment).trim() || fallbackDepartment,
        faculty: (raw.faculty ?? "General").trim() || "General",
        level: parseNumber(raw.level, 100),
        gpa: parseNumber(raw.gpa, 0),
        cgpa: parseNullableNumber(raw.cgpa),
        courseCode: (raw.course_code ?? "GEN101").trim() || "GEN101",
        courseTitle: (raw.course_title ?? "General Studies").trim() || "General Studies",
        unit: parseNumber(raw.unit ?? raw.course_unit ?? raw.credit_unit, 0),
        grade,
        score,
        parentName: (raw.parent_name ?? raw.guardian_name ?? "").trim() || null,
        parentEmail: (raw.parent_email ?? raw.email ?? "").trim() || null,
        parentPhone: (raw.parent_phone ?? raw.phone ?? "").trim() || null,
        relationship: (raw.relationship ?? "Parent").trim() || "Parent",
    };
}

function aggregateStudentRows(rows: FlatStudentCsvRow[]): StudentImportRow[] {
    const grouped = new Map<string, StudentImportRow>();

    for (const row of rows) {
        const existing = grouped.get(row.matricNumber);
        const course = {
            code: row.courseCode,
            title: row.courseTitle,
            unit: row.unit,
            grade: row.grade,
            score: row.score,
        };

        if (!existing) {
            grouped.set(row.matricNumber, {
                matricNumber: row.matricNumber,
                studentName: row.studentName,
                department: row.department,
                faculty: row.faculty,
                level: row.level,
                gpa: row.gpa,
                cgpa: row.cgpa,
                parentName: row.parentName,
                parentEmail: row.parentEmail,
                parentPhone: row.parentPhone,
                relationship: row.relationship,
                courses: [course],
            });
            continue;
        }

        existing.courses.push(course);
        if (row.gpa > 0) {
            existing.gpa = row.gpa;
        }
        if (row.cgpa !== null) {
            existing.cgpa = row.cgpa;
        }
    }

    const students = Array.from(grouped.values());
    for (const student of students) {
        const calculatedGpa = calculateGpaFromCourses(student.courses);
        if (calculatedGpa !== null) {
            student.gpa = calculatedGpa;
        }
    }

    return students;
}

export function parseStudentRowsFromCsv(csvText: string, fallbackDepartment: string): StudentImportRow[] {
    const parsedRows = csvToRows(csvText)
        .map((row) => mapStudentCsvRow(row, fallbackDepartment))
        .filter((row): row is FlatStudentCsvRow => row !== null);

    return aggregateStudentRows(parsedRows);
}

/** Returns true when a string looks like a Nigerian university matric number. */
function isLikelyMatric(s: string): boolean {
    if (/^\d{8,14}$/.test(s)) return true;
    return /^[A-Z0-9]{1,8}(\/[A-Z0-9]{1,8}){1,5}$/i.test(s);
}

function parseStudentHeaderLine(line: string, fallbackDepartment: string) {
    const matricMatch = line.match(/(?:matric(?:ulation)?\s*(?:no|number)?\s*[:\-]?\s*|^)([A-Z0-9./-]{5,})/i);
    const nameMatch = line.match(/(?:name|student)\s*[:\-]\s*([A-Za-z][A-Za-z .'-]{2,})/i);
    if (!matricMatch || !nameMatch) {
        return null;
    }

    const departmentMatch = line.match(/(?:dept|department)\s*[:\-]\s*([A-Za-z .&'-]{2,})/i);
    const facultyMatch = line.match(/(?:faculty|school)\s*[:\-]\s*([A-Za-z .&'-]{2,})/i);
    const levelMatch = line.match(/(?:level|lvl)\s*[:\-]?\s*(\d{2,3})/i);
    const gpaMatch = line.match(/\bGPA\s*[:\-]?\s*(\d(?:\.\d{1,2})?)\b/i);
    const cgpaMatch = line.match(/\bCGPA\s*[:\-]?\s*(\d(?:\.\d{1,2})?)\b/i);

    return {
        matricNumber: matricMatch[1].trim().toUpperCase(),
        studentName: nameMatch[1].trim(),
        department: (departmentMatch?.[1] ?? fallbackDepartment).trim() || fallbackDepartment,
        faculty: (facultyMatch?.[1] ?? "General").trim() || "General",
        level: Number(levelMatch?.[1] ?? "100"),
        gpa: Number(gpaMatch?.[1] ?? "0"),
        cgpa: cgpaMatch?.[1] ? Number(cgpaMatch[1]) : null,
    };
}

function parseCourseLine(line: string) {
    const compactLine = line.replace(/\s+/g, " ").trim();
    const fullPattern = compactLine.match(/^([A-Z]{2,4}\s?\d{3}[A-Z]?)\s+(.+?)\s+(\d{1,2})\s+(\d{1,3})\s+([A-F][+-]?)$/i);
    if (fullPattern) {
        return {
            code: fullPattern[1].replace(/\s+/g, ""),
            title: fullPattern[2],
            unit: Number(fullPattern[3]),
            score: Number(fullPattern[4]),
            grade: fullPattern[5].toUpperCase(),
        };
    }

    const shortPattern = compactLine.match(/^([A-Z]{2,4}\s?\d{3}[A-Z]?)\s+(.+?)\s+(\d{1,2})\s+([A-F][+-]?)$/i);
    if (!shortPattern) {
        return null;
    }

    return {
        code: shortPattern[1].replace(/\s+/g, ""),
        title: shortPattern[2],
        unit: Number(shortPattern[3]),
        score: null,
        grade: shortPattern[4].toUpperCase(),
    };
}

function extractPdfCourseRows(text: string) {
    const compactText = text.replace(/\s+/g, " ").trim();
    const fullPattern = /([A-Z]{2,4}\s?\d{3}[A-Z]?)\s+(.+?)\s+(\d{1,2})\s+(\d{1,3})\s+([A-F][+-]?)(?=\s+[A-Z]{2,4}\s?\d{3}[A-Z]?|\s*$)/gi;
    const shortPattern = /([A-Z]{2,4}\s?\d{3}[A-Z]?)\s+(.+?)\s+(\d{1,2})\s+([A-F][+-]?)(?=\s+[A-Z]{2,4}\s?\d{3}[A-Z]?|\s*$)/gi;

    const rows: Array<{ code: string; title: string; unit: number; grade: string; score: number | null }> = [];
    const seenCodes = new Set<string>();

    for (const match of compactText.matchAll(fullPattern)) {
        const code = match[1].replace(/\s+/g, "").toUpperCase();
        if (seenCodes.has(code)) continue;

        rows.push({
            code,
            title: match[2].trim(),
            unit: Number(match[3]),
            score: Number(match[4]),
            grade: match[5].toUpperCase(),
        });
        seenCodes.add(code);
    }

    if (rows.length > 0) {
        return rows;
    }

    for (const match of compactText.matchAll(shortPattern)) {
        const code = match[1].replace(/\s+/g, "").toUpperCase();
        if (seenCodes.has(code)) continue;

        rows.push({
            code,
            title: match[2].trim(),
            unit: Number(match[3]),
            score: null,
            grade: match[4].toUpperCase(),
        });
        seenCodes.add(code);
    }

    return rows;
}

function extractCourseCodesFromTable(lines: string[]): string[] {
    const startIndex = lines.findIndex((line) => /course\s*codes/i.test(line));
    if (startIndex < 0) {
        return [];
    }

    const endIndex = lines.findIndex((line, index) => index > startIndex && /course\s*status/i.test(line));
    const scoped = lines.slice(startIndex + 1, endIndex > startIndex ? endIndex : lines.length);
    const tokens = scoped
        .join(" ")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean);

    const codes: string[] = [];
    for (let index = 0; index < tokens.length - 1; index += 1) {
        const prefix = tokens[index];
        const suffix = tokens[index + 1];

        if (/^[A-Z]{2,4}$/i.test(prefix) && /^\d{3}[A-Z]?$/i.test(suffix)) {
            codes.push(`${prefix.toUpperCase()}${suffix.toUpperCase()}`);
            index += 1;
        }
    }

    return codes;
}

function parseStudentRowsFromTabularPdf(lines: string[], fallbackDepartment: string): StudentImportRow[] {
    const departmentLine = lines.find((l) => /^(?:DEPARTMENT|DEPT)\s*:/i.test(l));
    const collegeLine = lines.find((l) => /^(?:COLLEGE|FACULTY|SCHOOL)\s+OF\s+/i.test(l) || /^(?:FACULTY|SCHOOL)\s*:/i.test(l));
    const levelLine = lines.find((l) => /^LEVEL\s*:/i.test(l));
    const courseCodes = extractCourseCodesFromTable(lines);

    const department = (departmentLine?.replace(/^(?:DEPARTMENT|DEPT)\s*:/i, "").trim() ?? fallbackDepartment) || fallbackDepartment;
    const faculty = (collegeLine?.trim() ?? "General") || "General";
    const level = Number((levelLine?.replace(/^LEVEL\s*:/i, "").trim() ?? "100")) || 100;

    const students: StudentImportRow[] = [];

    // Pattern A: <serial#>  <matric>  <name…>  (serial is 1-4 digits)
    const ROW_A = /^(\d{1,4})\s+([A-Z0-9][A-Z0-9.\/\-]{3,})\s+([A-Za-z].+)$/i;
    // Pattern B: <matric>  <name>  (no leading serial)
    const ROW_B = /^([A-Z0-9][A-Z0-9.\/\-]{4,})\s+([A-Za-z][A-Za-z .',\-]{5,})$/i;

    const isNextStudent = (l: string) =>
        ROW_A.test(l) || (ROW_B.test(l) && isLikelyMatric(l.split(/\s+/)[0]));

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];

        let matricNumber: string | null = null;
        let initialName = "";

        const matchA = line.match(ROW_A);
        if (matchA && isLikelyMatric(matchA[2])) {
            matricNumber = matchA[2].trim().toUpperCase();
            initialName = matchA[3].trim();
        } else {
            const matchB = line.match(ROW_B);
            if (matchB && isLikelyMatric(matchB[1])) {
                matricNumber = matchB[1].trim().toUpperCase();
                initialName = matchB[2].trim();
            }
        }

        if (!matricNumber) continue;

        const segmentLines = [line];
        for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
            const nextLine = lines[cursor];
            if (isNextStudent(nextLine)) break;
            if (
                /^page\s+\d+/i.test(nextLine) ||
                /^system\s+date/i.test(nextLine) ||
                /^--\s*\d+\s+of\s+\d+\s*--$/i.test(nextLine)
            ) break;
            segmentLines.push(nextLine);
        }

        index += Math.max(segmentLines.length - 1, 0);
        const merged = segmentLines.join(" ");

        const continuationName = segmentLines[1]?.match(/^([A-Za-z][A-Za-z .'-]{1,})\s+\d/)?.[1]?.trim();
        const studentName = continuationName ? `${initialName} ${continuationName}` : initialName;

        const gpaValues = (merged.match(/\b\d\.\d{1,2}\b/g) ?? []).map(Number);
        const gpa = gpaValues.length >= 2 ? gpaValues[gpaValues.length - 2] : (gpaValues[0] ?? 0);
        const cgpa = gpaValues.length > 0 ? gpaValues[gpaValues.length - 1] : null;

        const parsedPdfCourses = extractPdfCourseRows(merged);
        const scoreGradePairs = Array.from(merged.matchAll(/\b(\d{2,3})\s+([A-FP])\b/g)).map((m) => ({
            grade: m[2].toUpperCase(),
            score: Number(m[1]),
        }));
        const gradeScorePairs = Array.from(merged.matchAll(/\b([A-FP])\s+(\d{2,3})\b/g)).map((m) => ({
            grade: m[1].toUpperCase(),
            score: Number(m[2]),
        }));

        if (parsedPdfCourses.length > 0) {
            students.push({
                matricNumber,
                studentName,
                department,
                faculty,
                level,
                gpa: Number.isFinite(gpa) ? gpa : 0,
                cgpa,
                parentName: null,
                parentEmail: null,
                parentPhone: null,
                relationship: "Parent",
                courses: parsedPdfCourses,
            });
            continue;
        }

        const orderedPairs =
            courseCodes.length > 0 && scoreGradePairs.length >= courseCodes.length
                ? scoreGradePairs
                : gradeScorePairs;

        const limitedPairs = courseCodes.length > 0 ? orderedPairs.slice(0, courseCodes.length) : orderedPairs;
        const courses = (
            courseCodes.length > 0
                ? courseCodes
                : limitedPairs.map((_, i) => `CRS${String(i + 1).padStart(3, "0")}`)
        ).map((code, idx) => {
            const pair = limitedPairs[idx];
            return { code, title: "Imported From PDF", unit: 0, grade: pair?.grade ?? "N/A", score: pair?.score ?? null };
        });

        students.push({
            matricNumber,
            studentName,
            department,
            faculty,
            level,
            gpa,
            cgpa,
            parentName: null,
            parentEmail: null,
            parentPhone: null,
            relationship: "Parent",
            courses: courses.length > 0
                ? courses
                : [{ code: "GEN101", title: "Imported From PDF", unit: 0, grade: "N/A", score: null }],
        });
    }

    return students;
}

/**
 * Handles PDFs where each student's data is presented as key-value pairs on
 * separate lines (e.g. "Matric No: 2019/CS/001", "Name: John Doe", …).
 * Also handles a bare matric token on one line followed by the name on the next.
 */
function parseStudentRowsFromKeyValuePdf(lines: string[], fallbackDepartment: string): StudentImportRow[] {
    const students: StudentImportRow[] = [];

    let matric: string | null = null;
    let name: string | null = null;
    let dept = fallbackDepartment;
    let fac = "General";
    let lvl = 100;
    let gpa = 0;
    let cgpa: number | null = null;
    let courses: Array<{ code: string; title: string; unit: number; grade: string; score: number | null }> = [];

    const commit = () => {
        if (!matric || !name) return;
        const computedGpa = calculateGpaFromCourses(courses);
        students.push({
            matricNumber: matric,
            studentName: name,
            department: dept,
            faculty: fac,
            level: lvl,
            gpa: computedGpa ?? gpa,
            cgpa,
            parentName: null,
            parentEmail: null,
            parentPhone: null,
            relationship: "Parent",
            courses: courses.length > 0
                ? courses
                : [{ code: "GEN101", title: "Imported From PDF", unit: 0, grade: "N/A", score: null }],
        });
        matric = null; name = null;
        dept = fallbackDepartment; fac = "General"; lvl = 100; gpa = 0; cgpa = null; courses = [];
    };

    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];

        // "Matric No: ..." / "Matric Number: ..."
        const matricKV = line.match(/^matric(?:ulation)?\s*(?:no|num(?:ber)?)?\s*[:\-]\s*(.+)$/i);
        if (matricKV) { commit(); matric = matricKV[1].trim().toUpperCase(); continue; }

        // "Name: ..." / "Student Name: ..." / "Full Name: ..."
        const nameKV = line.match(/^(?:(?:student|full)\s+)?name\s*[:\-]\s*(.+)$/i);
        if (nameKV) { name = nameKV[1].trim(); continue; }

        // "Department: ..." / "Dept: ..."
        const deptKV = line.match(/^(?:department|dept)\s*[:\-]\s*(.+)$/i);
        if (deptKV) { dept = deptKV[1].trim() || fallbackDepartment; continue; }

        // "Faculty: ..." / "School: ..." / "College: ..."
        const facKV = line.match(/^(?:faculty|school|college)(?:\s+of\s+.+)?\s*[:\-]\s*(.+)$/i);
        if (facKV) { fac = facKV[1].trim() || "General"; continue; }

        // "Level: 300"
        const levelKV = line.match(/^(?:level|yr|year)\s*[:\-]?\s*(\d{2,3})/i);
        if (levelKV) { lvl = Number(levelKV[1]) || 100; continue; }

        // CGPA (must come before GPA check to avoid partial match)
        const cgpaKV = line.match(/\bC\.?GPA\s*[:\-]?\s*(\d(?:\.\d{1,2})?)\b/i);
        if (cgpaKV) { cgpa = Number(cgpaKV[1]); }

        if (!line.toUpperCase().includes("CGPA") && !line.toUpperCase().includes("C.GPA")) {
            const gpaKV = line.match(/\bGPA\s*[:\-]?\s*(\d(?:\.\d{1,2})?)\b/i);
            if (gpaKV) { gpa = Number(gpaKV[1]); }
        }

        // Bare matric token on its own line → peek at next line for the name
        const bare = line.match(/^([A-Z0-9][A-Z0-9.\/\-]{4,}[A-Z0-9])$/i);
        if (bare && isLikelyMatric(bare[1])) {
            commit();
            matric = bare[1].toUpperCase();
            const nextLine = lines[i + 1] ?? "";
            if (/^[A-Za-z][A-Za-z .',\-]{5,}$/.test(nextLine)) { name = nextLine.trim(); i += 1; }
            continue;
        }

        // Matric + name on the same line with no keyword
        const combo = line.match(/^([A-Z0-9][A-Z0-9.\/\-]{4,})\s+([A-Za-z][A-Za-z .',\-]{5,})$/i);
        if (combo && isLikelyMatric(combo[1])) {
            commit();
            matric = combo[1].toUpperCase();
            name = combo[2].trim();
            continue;
        }

        // If we have a pending matric but no name yet, see if this line IS the name
        if (matric && !name && /^[A-Za-z][A-Za-z .',\-]{5,}$/.test(line)) {
            name = line.trim();
            continue;
        }

        // Course line (only once a student record is open)
        if (matric) {
            const course = parseCourseLine(line);
            if (course) { courses.push(course); }
        }
    }

    commit();
    return students;
}

export async function parseStudentRowsFromPdf(pdfBuffer: Buffer, fallbackDepartment: string): Promise<StudentImportRow[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseModule: any = await import("pdf-parse");
    // Handle both direct named export and webpack default-wrapping
    const ParserClass = pdfParseModule.PDFParse ?? pdfParseModule.default?.PDFParse;
    if (!ParserClass) {
        throw new Error("pdf-parse module did not expose PDFParse class");
    }
    const parser = new ParserClass({ data: Buffer.from(pdfBuffer) });
    const parsed = await parser.getText();
    await parser.destroy();

    const lines = String(parsed.text)
        .split(/\r?\n/)
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);

    // Strategy 1: class result sheet / tabular layout
    const tableStudents = parseStudentRowsFromTabularPdf(lines, fallbackDepartment);
    if (tableStudents.length > 0) return tableStudents;

    // Strategy 2: key-value per-student pages ("Matric No: ...", "Name: ...", …)
    const kvStudents = parseStudentRowsFromKeyValuePdf(lines, fallbackDepartment);
    if (kvStudents.length > 0) return kvStudents;

    // Strategy 3: original single-line header parser (last resort)
    const students: StudentImportRow[] = [];
    let current: StudentImportRow | null = null;

    for (const line of lines) {
        const header = parseStudentHeaderLine(line, fallbackDepartment);
        if (header) {
            if (current && current.courses.length === 0) {
                current.courses.push({ code: "GEN101", title: "Imported From PDF", unit: 0, grade: "N/A", score: null });
            }
            current = { ...header, parentName: null, parentEmail: null, parentPhone: null, relationship: "Parent", courses: [] };
            students.push(current);
            continue;
        }

        if (!current) continue;

        const course = parseCourseLine(line);
        if (course) current.courses.push(course);
    }

    for (const student of students) {
        if (student.courses.length === 0) {
            student.courses.push({ code: "GEN101", title: "Imported From PDF", unit: 0, grade: "N/A", score: null });
        }
    }

    return students;
}

export function parseParentContactsFromCsv(csvText: string): ParentContactImportRow[] {
    return csvToRows(csvText)
        .map((row) => {
            const matricNumber = (row.matric_number ?? row.matric ?? row.matric_no ?? "").trim().toUpperCase();
            const parentName = (row.parent_name ?? row.guardian_name ?? row.name ?? "").trim() || null;
            const parentEmail = (row.parent_email ?? row.email ?? "").trim() || null;
            const parentPhone = (row.parent_phone ?? row.phone ?? "").trim() || null;

            if (!matricNumber) {
                return null;
            }

            return {
                matricNumber,
                parentName,
                parentEmail,
                parentPhone,
                relationship: (row.relationship ?? "Parent").trim() || "Parent",
            } satisfies ParentContactImportRow;
        })
        .filter((row): row is ParentContactImportRow => row !== null);
}
