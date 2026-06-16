import fs from "node:fs";

const pdfParseModule = await import("pdf-parse");
const ParserClass = pdfParseModule.PDFParse;

const buf = fs.readFileSync("c:\\Users\\HP\\Desktop\\ECHELON\\prisma\\Mountain Top University - Examination Results.pdf");
const parser = new ParserClass({ data: Buffer.from(buf) });
const parsed = await parser.getText();
await parser.destroy();

const lines = parsed.text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

// Simulate isLikelyMatric
function isLikelyMatric(s) {
    if (/^\d{8,14}$/.test(s)) return true;
    return /^[A-Z0-9]{1,8}(\/[A-Z0-9]{1,8}){1,5}$/i.test(s);
}

// Test ROW_A
const ROW_A = /^(\d{1,4})\s+([A-Z0-9][A-Z0-9.\/\-]{3,})\s+([A-Za-z].+)$/i;
let matched = 0;
for (const line of lines) {
    const m = line.match(ROW_A);
    if (m && isLikelyMatric(m[2])) {
        matched++;
        console.log(`MATCH: serial=${m[1]} matric=${m[2]} name=${m[3]}`);
    }
}
console.log(`\nStudent rows matched: ${matched}`);

console.log("--- RAW LINES (FIRST 100) ---");
lines.slice(0, 100).forEach((l, i) => console.log(`${i}: ${l}`));

// Test course code extraction
const startIndex = lines.findIndex(l => /course\s*codes/i.test(l));
console.log(`\nCourse Codes Line Index: ${startIndex}`);
if (startIndex !== -1) {
    console.log(`Line ${startIndex}: ${lines[startIndex]}`);
    console.log(`Line ${startIndex+1}: ${lines[startIndex+1]}`);
    console.log(`Line ${startIndex+2}: ${lines[startIndex+2]}`);
}

const unitsLineIdx = lines.findIndex(l => /no\.\s*of\s*units/i.test(l));
console.log(`\nUnits Line Index: ${unitsLineIdx}`);
if (unitsLineIdx !== -1) {
    console.log(`Line ${unitsLineIdx}: ${lines[unitsLineIdx]}`);
    const unitTokens = lines[unitsLineIdx].split(/\s+/).filter(t => /^\d+$/.test(t)).map(Number);
    console.log("Unit Tokens:", unitTokens);
}
