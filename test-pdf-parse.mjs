import fs from "node:fs";

const pdfParseModule = await import("pdf-parse");
const ParserClass = pdfParseModule.PDFParse;

const buf = fs.readFileSync("C:\\Users\\HP\\Documents\\400lvl\\results\\document (1).pdf");
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

// Test course code extraction
const startIndex = lines.findIndex(l => /course\s*codes/i.test(l));
const endIndex = lines.findIndex((l, i) => i > startIndex && /course\s*status/i.test(l));
const scoped = lines.slice(startIndex + 1, endIndex > startIndex ? endIndex : lines.length);
const tokens = scoped.join(" ").split(/\s+/).filter(Boolean);
const codes = [];
for (let i = 0; i < tokens.length - 1; i++) {
    if (/^[A-Z]{2,4}$/i.test(tokens[i]) && /^\d{3}[A-Z]?$/i.test(tokens[i+1])) {
        codes.push(tokens[i] + tokens[i+1]);
        i++;
    }
}
console.log(`\nCourse codes found (${codes.length}):`, codes.join(", "));
