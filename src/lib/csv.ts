function escapeCsvCell(value: unknown): string {
    if (value === null || value === undefined) {
        return "";
    }

    const normalized = String(value).replace(/\r?\n/g, " ").trim();
    if (/[,"\n]/.test(normalized)) {
        return `"${normalized.replace(/"/g, '""')}"`;
    }

    return normalized;
}

export function buildCsv(headers: string[], rows: Array<Array<unknown>>): string {
    const headerLine = headers.map(escapeCsvCell).join(",");
    const dataLines = rows.map((row) => row.map(escapeCsvCell).join(","));
    return [headerLine, ...dataLines].join("\n");
}
