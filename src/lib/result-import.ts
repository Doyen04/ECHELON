import { Buffer } from "node:buffer";

export type PreferredChannel = "WHATSAPP" | "EMAIL" | "SMS";

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
  preferredChannel: PreferredChannel;
  ndprConsent: boolean;
  courses: Array<{
    code: string;
    title: string;
    unit: number;
    grade: string;
    score: number | null;
  }>;
};

export type ParentContactImportRow = {
  matricNumber: string;
  parentName: string;
  parentEmail: string | null;
  parentPhone: string | null;
  relationship: string;
  preferredChannel: PreferredChannel;
  ndprConsent: boolean;
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseBoolean(value: string | undefined): boolean {
  const normalized = (value ?? "").trim().toLowerCase();
  return ["true", "1", "yes", "y"].includes(normalized);
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

function normalizePreferredChannel(value: string | undefined): PreferredChannel {
  const preferred = (value ?? "WHATSAPP").trim().toUpperCase();
  if (preferred === "EMAIL" || preferred === "SMS") {
    return preferred;
  }
  return "WHATSAPP";
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
  preferredChannel: PreferredChannel;
  ndprConsent: boolean;
};

function mapStudentCsvRow(raw: Record<string, string>, fallbackDepartment: string): FlatStudentCsvRow | null {
  const matricNumber = (raw.matric_number ?? raw.matric ?? raw.matric_no ?? "").trim();
  const studentName = (raw.student_name ?? raw.full_name ?? raw.name ?? "").trim();

  if (!matricNumber || !studentName) {
    return null;
  }

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
    unit: parseNumber(raw.unit, 0),
    grade: (raw.grade ?? "").trim() || "N/A",
    score: parseNullableNumber(raw.score),
    parentName: (raw.parent_name ?? raw.guardian_name ?? "").trim() || null,
    parentEmail: (raw.parent_email ?? raw.email ?? "").trim() || null,
    parentPhone: (raw.parent_phone ?? raw.phone ?? "").trim() || null,
    relationship: (raw.relationship ?? "Parent").trim() || "Parent",
    preferredChannel: normalizePreferredChannel(raw.preferred_channel),
    ndprConsent: parseBoolean(raw.ndpr_consent ?? "true"),
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
        preferredChannel: row.preferredChannel,
        ndprConsent: row.ndprConsent,
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

  return Array.from(grouped.values());
}

export function parseStudentRowsFromCsv(csvText: string, fallbackDepartment: string): StudentImportRow[] {
  const parsedRows = csvToRows(csvText)
    .map((row) => mapStudentCsvRow(row, fallbackDepartment))
    .filter((row): row is FlatStudentCsvRow => row !== null);

  return aggregateStudentRows(parsedRows);
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
  const departmentLine = lines.find((line) => /^DEPARTMENT\s*:/i.test(line));
  const collegeLine = lines.find((line) => /^COLLEGE\s+OF\s+/i.test(line));
  const levelLine = lines.find((line) => /^LEVEL\s*:/i.test(line));
  const courseCodes = extractCourseCodesFromTable(lines);

  const department = (departmentLine?.replace(/^DEPARTMENT\s*:/i, "").trim() ?? fallbackDepartment) || fallbackDepartment;
  const faculty = (collegeLine?.trim() ?? "General") || "General";
  const level = Number((levelLine?.replace(/^LEVEL\s*:/i, "").trim() ?? "100")) || 100;

  const students: StudentImportRow[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const headMatch = line.match(/^(\d+)\s+(\d{8,})\s+(.+)$/);
    if (!headMatch) {
      continue;
    }

    const matricNumber = headMatch[2].trim();
    const initialName = headMatch[3].trim();

    const segmentLines = [line];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const nextLine = lines[cursor];
      if (/^(\d+)\s+(\d{8,})\s+/.test(nextLine)) {
        break;
      }
      if (/^page\s+\d+/i.test(nextLine) || /^system\s+date/i.test(nextLine) || /^--\s*\d+\s+of\s+\d+\s*--$/i.test(nextLine)) {
        break;
      }

      segmentLines.push(nextLine);
    }

    index += Math.max(segmentLines.length - 1, 0);
    const merged = segmentLines.join(" ");

    const continuationName = segmentLines[1]?.match(/^([A-Za-z][A-Za-z .'-]{1,})\s+\d/)?.[1]?.trim();
    const studentName = continuationName ? `${initialName} ${continuationName}` : initialName;

    const scoreGradePairs = Array.from(merged.matchAll(/\b(\d{2,3})\s+([A-FP])\b/g)).map((match) => ({
      grade: match[2].toUpperCase(),
      score: Number(match[1]),
    }));

    const gradeScorePairs = Array.from(merged.matchAll(/\b([A-FP])\s+(\d{2,3})\b/g)).map((match) => ({
      grade: match[1].toUpperCase(),
      score: Number(match[2]),
    }));

    const orderedPairs =
      courseCodes.length > 0 && scoreGradePairs.length >= courseCodes.length
        ? scoreGradePairs
        : gradeScorePairs;

    const limitedPairs = courseCodes.length > 0 ? orderedPairs.slice(0, courseCodes.length) : orderedPairs;
    const courses = (courseCodes.length > 0 ? courseCodes : limitedPairs.map((_, i) => `CRS${String(i + 1).padStart(3, "0")}`)).map((code, idx) => {
      const pair = limitedPairs[idx];
      return {
        code,
        title: "Imported From PDF",
        unit: 0,
        grade: pair?.grade ?? "N/A",
        score: pair?.score ?? null,
      };
    });

    const gpaValues = (merged.match(/\b\d\.\d{1,2}\b/g) ?? []).map((value) => Number(value));
    const gpa = gpaValues.length >= 2 ? gpaValues[gpaValues.length - 2] : gpaValues[0] ?? 0;
    const cgpa = gpaValues.length > 0 ? gpaValues[gpaValues.length - 1] : null;

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
      preferredChannel: "WHATSAPP",
      ndprConsent: true,
      courses: courses.length > 0
        ? courses
        : [
            {
              code: "GEN101",
              title: "Imported From PDF",
              unit: 0,
              grade: "N/A",
              score: null,
            },
          ],
    });
  }

  return students;
}

export async function parseStudentRowsFromPdf(pdfBuffer: Buffer, fallbackDepartment: string): Promise<StudentImportRow[]> {
  const pdfParseModule = await import("pdf-parse");
  const ParserClass = pdfParseModule.PDFParse;
  const parser = new ParserClass({ data: Buffer.from(pdfBuffer) });
  const parsed = await parser.getText();
  await parser.destroy();

  const lines = parsed.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const tableStudents = parseStudentRowsFromTabularPdf(lines, fallbackDepartment);
  if (tableStudents.length > 0) {
    return tableStudents;
  }

  const students: StudentImportRow[] = [];
  let current: StudentImportRow | null = null;

  for (const line of lines) {
    const header = parseStudentHeaderLine(line, fallbackDepartment);
    if (header) {
      if (current && current.courses.length === 0) {
        current.courses.push({
          code: "GEN101",
          title: "Imported From PDF",
          unit: 0,
          grade: "N/A",
          score: null,
        });
      }

      current = {
        ...header,
        parentName: null,
        parentEmail: null,
        parentPhone: null,
        relationship: "Parent",
        preferredChannel: "WHATSAPP",
        ndprConsent: true,
        courses: [],
      };
      students.push(current);
      continue;
    }

    if (!current) {
      continue;
    }

    const course = parseCourseLine(line);
    if (course) {
      current.courses.push(course);
    }
  }

  for (const student of students) {
    if (student.courses.length === 0) {
      student.courses.push({
        code: "GEN101",
        title: "Imported From PDF",
        unit: 0,
        grade: "N/A",
        score: null,
      });
    }
  }

  return students;
}

export function parseParentContactsFromCsv(csvText: string): ParentContactImportRow[] {
  return csvToRows(csvText)
    .map((row) => {
      const matricNumber = (row.matric_number ?? row.matric ?? row.matric_no ?? "").trim().toUpperCase();
      const parentName = (row.parent_name ?? row.guardian_name ?? row.name ?? "").trim();
      const parentEmail = (row.parent_email ?? row.email ?? "").trim() || null;
      const parentPhone = (row.parent_phone ?? row.phone ?? "").trim() || null;

      if (!matricNumber || !parentName || (!parentEmail && !parentPhone)) {
        return null;
      }

      return {
        matricNumber,
        parentName,
        parentEmail,
        parentPhone,
        relationship: (row.relationship ?? "Parent").trim() || "Parent",
        preferredChannel: normalizePreferredChannel(row.preferred_channel),
        ndprConsent: parseBoolean(row.ndpr_consent ?? "true"),
      } satisfies ParentContactImportRow;
    })
    .filter((row): row is ParentContactImportRow => row !== null);
}
