"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    UploadCloud,
    FileType,
    CheckCircle,
    AlertTriangle,
    ArrowRight,
    Download,
    X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

type ParsedRow = {
    matricNumber: string;
    studentName: string;
    department: string;
    courseCode: string;
    grade: string;
    score: string;
};

type ValidationState = {
    headers: string[];
    rowCount: number;
    studentCount: number;
    previewRows: ParsedRow[];
    errors: string[];
};

const REQUIRED_HEADERS = [
    "matric_number",
    "student_name",
    "department",
    "course_code",
    "grade",
] as const;

function normalizeHeader(header: string): string {
    return header.trim().toLowerCase().replace(/\s+/g, "_");
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

function parseCsv(text: string): Array<Record<string, string>> {
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length < 2) {
        return [];
    }

    const headers = parseCsvLine(lines[0]).map(normalizeHeader);

    return lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        const row: Record<string, string> = {};

        headers.forEach((header, index) => {
            row[header] = values[index] ?? "";
        });

        return row;
    });
}

function validateAndBuildPreview(text: string): ValidationState {
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length < 2) {
        return {
            headers: [],
            rowCount: 0,
            studentCount: 0,
            previewRows: [],
            errors: ["CSV must include a header row and at least one data row."],
        };
    }

    const headers = parseCsvLine(lines[0]).map(normalizeHeader);
    const missingHeaders = REQUIRED_HEADERS.filter((required) => !headers.includes(required));
    const parsedRows = parseCsv(text);

    const errors: string[] = [];
    if (missingHeaders.length > 0) {
        errors.push(`Missing required columns: ${missingHeaders.join(", ")}`);
    }

    parsedRows.forEach((row, index) => {
        const rowNumber = index + 2;
        if (!(row.matric_number ?? "").trim()) {
            errors.push(`Row ${rowNumber}: matric_number is required.`);
        }
        if (!(row.student_name ?? "").trim()) {
            errors.push(`Row ${rowNumber}: student_name is required.`);
        }
        if (!(row.course_code ?? "").trim()) {
            errors.push(`Row ${rowNumber}: course_code is required.`);
        }
        if (!(row.grade ?? "").trim()) {
            errors.push(`Row ${rowNumber}: grade is required.`);
        }
    });

    const previewRows: ParsedRow[] = parsedRows.slice(0, 5).map((row) => ({
        matricNumber: (row.matric_number ?? "").trim(),
        studentName: (row.student_name ?? "").trim(),
        department: (row.department ?? "").trim(),
        courseCode: (row.course_code ?? "").trim(),
        grade: (row.grade ?? "").trim(),
        score: (row.score ?? "").trim(),
    }));

    const uniqueStudents = new Set(
        parsedRows
            .map((row) => (row.matric_number ?? "").trim())
            .filter((value) => value.length > 0),
    );

    return {
        headers,
        rowCount: parsedRows.length,
        studentCount: uniqueStudents.size,
        previewRows,
        errors,
    };
}

export default function BatchUploadPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showErrorDetails, setShowErrorDetails] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [validation, setValidation] = useState<ValidationState | null>(null);
    const [sessionValue, setSessionValue] = useState("2024/2025");
    const [semesterValue, setSemesterValue] = useState("FIRST");
    const [departmentValue, setDepartmentValue] = useState("Computer Science");
    const [autoDispatch, setAutoDispatch] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<{
        batchId: string;
        dispatchId?: string;
        students: number;
        autoDispatched: boolean;
    } | null>(null);

    const hasValidationErrors = useMemo(() => {
        return Boolean(validation && validation.errors.length > 0);
    }, [validation]);

    useEffect(() => {
        if (!submitSuccess?.autoDispatched) {
            return;
        }

        const destination = submitSuccess.dispatchId
            ? `/admin/delivery/${submitSuccess.dispatchId}`
            : `/admin/batches/${submitSuccess.batchId}`;

        const timeoutId = window.setTimeout(() => {
            router.push(destination);
        }, 1200);

        return () => window.clearTimeout(timeoutId);
    }, [router, submitSuccess]);

    const resetUploadState = () => {
        setFile(null);
        setShowPreview(false);
        setShowErrorDetails(false);
        setValidation(null);
        setSubmitError(null);
        setSubmitSuccess(null);
    };

    const processSelectedFile = async (selectedFile: File) => {
        const isCsvFile =
            selectedFile.name.toLowerCase().endsWith(".csv") ||
            selectedFile.type.includes("csv") ||
            selectedFile.type === "text/plain";

        if (!isCsvFile) {
            resetUploadState();
            setSubmitError("Please upload a valid CSV file.");
            return;
        }

        setFile(selectedFile);
        setIsParsing(true);
        setShowPreview(false);
        setShowErrorDetails(false);
        setSubmitError(null);
        setSubmitSuccess(null);

        try {
            const csvText = await selectedFile.text();
            const validationResult = validateAndBuildPreview(csvText);
            setValidation(validationResult);
            setShowPreview(true);
        } catch {
            setValidation(null);
            setShowPreview(false);
            setSubmitError("Unable to read the CSV file. Please try again.");
        } finally {
            setIsParsing(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await processSelectedFile(e.target.files[0]);
        }
    };

    const handleConfirmUpload = async () => {
        if (!file || isSubmitting) {
            return;
        }

        if (hasValidationErrors) {
            setSubmitError("Fix validation errors before confirming upload.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(null);

        try {
            const payload = new FormData();
            payload.append("file", file);
            payload.append("session", sessionValue);
            payload.append("semester", semesterValue);
            payload.append("department", departmentValue);
            payload.append("autoDispatch", autoDispatch ? "true" : "false");

            const response = await fetch("/api/batches/upload", {
                method: "POST",
                body: payload,
            });

            const responseBody = await response.json().catch(() => null);
            if (!response.ok) {
                setSubmitError(responseBody?.error ?? "Upload failed. Please try again.");
                return;
            }

            setSubmitSuccess({
                batchId: responseBody.batchId,
                dispatchId: responseBody.dispatch?.dispatchId,
                students: Number(responseBody.students ?? 0),
                autoDispatched: Boolean(responseBody.dispatch?.dispatchId),
            });
        } catch {
            setSubmitError("Network error while uploading batch.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="dashboard-root min-h-screen bg-background">
            <PageHeader
                title="Upload Result Batch"
                breadcrumbs={
                    <div className="flex items-center gap-1">
                        <Link href="/admin/batches" className="hover:text-foreground transition-colors">Batches</Link>
                        <span>/</span>
                        <span className="text-foreground">Upload</span>
                    </div>
                }
            />

            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_360px]">
                    <div className="space-y-8 dashboard-section">
                        <div className="rounded-xl border border-border-subtle bg-surface-main p-6 shadow-sm">
                            <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-6">Step 1: Batch Metadata</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-foreground">Session</label>
                                    <select
                                        value={sessionValue}
                                        onChange={(event) => setSessionValue(event.target.value)}
                                        className="w-full h-10 rounded-md border border-border-subtle bg-transparent px-3 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                                    >
                                        <option>2024/2025</option>
                                        <option>2023/2024</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-foreground">Semester</label>
                                    <select
                                        value={semesterValue}
                                        onChange={(event) => setSemesterValue(event.target.value)}
                                        className="w-full h-10 rounded-md border border-border-subtle bg-transparent px-3 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                                    >
                                        <option value="FIRST">First Semester</option>
                                        <option value="SECOND">Second Semester</option>
                                        <option value="THIRD">Third Semester</option>
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="block text-sm font-medium text-foreground">Department</label>
                                    <select
                                        value={departmentValue}
                                        onChange={(event) => setDepartmentValue(event.target.value)}
                                        className="w-full h-10 rounded-md border border-border-subtle bg-transparent px-3 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                                    >
                                        <option>Computer Science</option>
                                        <option>Physics</option>
                                        <option>Mathematics</option>
                                    </select>
                                </div>
                                <div className="space-y-3 md:col-span-2 pt-2">
                                    <label className="block text-sm font-medium text-foreground">Source Type</label>
                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="source" className="text-brand focus:ring-brand" defaultChecked />
                                            <span className="text-sm text-foreground">CSV Upload</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer opacity-50">
                                            <input type="radio" name="source" disabled className="text-brand focus:ring-brand" />
                                            <span className="text-sm text-foreground flex items-center gap-2">SIS API Sync <span className="text-[10px] bg-surface-subtle px-1.5 py-0.5 rounded">Coming Soon</span></span>
                                        </label>
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="flex items-start gap-3 rounded-lg border border-border-subtle bg-surface-subtle/30 p-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={autoDispatch}
                                            onChange={(event) => setAutoDispatch(event.target.checked)}
                                            className="mt-1 h-4 w-4 rounded border-border-subtle text-brand focus:ring-brand"
                                        />
                                        <span className="text-sm text-foreground">
                                            <span className="block font-medium">Send results to parents immediately after upload</span>
                                            <span className="text-text-muted text-xs">
                                                When off, batch stays pending and can be dispatched later.
                                            </span>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border-subtle bg-surface-main p-6 shadow-sm">
                            <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-6">Step 2: File Upload</h2>

                            {!file ? (
                                <div
                                    className={`relative flex flex-col items-center justify-center rounded-xl p-12 text-center transition-all duration-200
                    ${isDragOver ? "border-solid border-2 border-brand/30 bg-brand/5" : "border-dashed border-2 border-border-subtle bg-surface-subtle/30 hover:bg-surface-subtle/60"}
                  `}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <div className="rounded-full bg-surface-main p-4 shadow-sm mb-4">
                                        <UploadCloud className="h-8 w-8 text-brand" />
                                    </div>
                                    <h3 className="text-lg font-serif text-foreground mb-1">Drag and drop your CSV here</h3>
                                    <p className="text-sm text-text-muted mb-2">or click anywhere to browse from your computer</p>
                                    <div className="text-xs text-text-muted flex items-center gap-2 mt-4 opacity-70">
                                        <span>Accepted: .csv</span>
                                        <span>-</span>
                                        <span>Max: 5MB</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between rounded-lg border border-brand/30 bg-brand/5 p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="rounded bg-brand/10 p-2 text-brand">
                                            <FileType className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground font-mono">{file.name}</p>
                                            <p className="text-xs text-text-muted mt-0.5">
                                                {(file.size / 1024).toFixed(1)} KB - {isParsing ? "Parsing CSV..." : "Ready"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={resetUploadState}
                                        className="p-2 text-text-muted hover:text-red-500 transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {showPreview && validation ? (
                            <div className="rounded-xl border border-border-subtle bg-surface-main shadow-sm overflow-hidden page-transition-enter">
                                <div className="p-6 border-b border-border-subtle">
                                    <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4">Step 3: Preview and Validation</h2>
                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-2 text-sm text-status-success font-medium">
                                            <CheckCircle className="h-4 w-4" /> {validation.studentCount} students parsed
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-status-success font-medium">
                                            <CheckCircle className="h-4 w-4" /> {validation.rowCount} course records
                                        </div>
                                        <div className={`flex items-center gap-2 text-sm font-medium ${validation.errors.length > 0 ? "text-status-danger" : "text-status-success"}`}>
                                            {validation.errors.length > 0 ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                            {validation.errors.length > 0
                                                ? `${validation.errors.length} validation issues found`
                                                : "No validation errors found"}
                                            {validation.errors.length > 0 ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowErrorDetails((value) => !value)}
                                                    className="underline ml-1"
                                                >
                                                    {showErrorDetails ? "Hide errors" : "View errors"}
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>

                                    {showErrorDetails && validation.errors.length > 0 ? (
                                        <div className="rounded-lg border border-status-danger/40 bg-status-danger/10 p-4 text-sm text-status-danger space-y-1 mb-6">
                                            {validation.errors.slice(0, 20).map((error) => (
                                                <p key={error}>- {error}</p>
                                            ))}
                                            {validation.errors.length > 20 ? (
                                                <p>- ...and {validation.errors.length - 20} more errors</p>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="bg-surface-subtle/20 p-6">
                                    <h4 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">Data Preview (first 5 rows)</h4>
                                    <div className="rounded-lg border border-border-subtle bg-surface-main overflow-x-auto">
                                        <table className="min-w-full divide-y divide-border-subtle">
                                            <thead className="bg-surface-subtle/30">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Matric Number</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Student Name</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Department</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Course</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Grade</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-subtle">
                                                {validation.previewRows.length > 0 ? (
                                                    validation.previewRows.map((row, index) => (
                                                        <tr key={`${row.matricNumber}-${row.courseCode}-${index}`}>
                                                            <td className="px-3 py-2 text-sm font-mono text-text-muted">{row.matricNumber || "-"}</td>
                                                            <td className="px-3 py-2 text-sm text-foreground">{row.studentName || "-"}</td>
                                                            <td className="px-3 py-2 text-sm text-foreground">{row.department || "-"}</td>
                                                            <td className="px-3 py-2 text-sm text-foreground">{row.courseCode || "-"}</td>
                                                            <td className="px-3 py-2 text-sm text-foreground">{row.grade || "-"}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td className="px-3 py-4 text-sm text-text-muted" colSpan={5}>
                                                            No preview rows found.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {submitError ? (
                            <div className="rounded-lg border border-status-danger/40 bg-status-danger/10 p-4 text-sm text-status-danger">
                                {submitError}
                            </div>
                        ) : null}

                        {submitSuccess ? (
                            <div className="rounded-lg border border-status-success/40 bg-status-success/10 p-4 text-sm text-status-success">
                                Upload complete for {submitSuccess.students} students. Batch ID: {submitSuccess.batchId}
                                {submitSuccess.autoDispatched && submitSuccess.dispatchId
                                    ? ` | Dispatch ID: ${submitSuccess.dispatchId}`
                                    : " | Dispatch not started (batch is pending review)."}
                            </div>
                        ) : null}

                        <div className="flex items-center justify-end gap-4 pt-4 pb-12">
                            <Link href="/admin/batches" className="px-5 py-2.5 text-sm font-medium text-text-muted hover:text-foreground transition-colors">
                                Cancel
                            </Link>
                            <button
                                onClick={handleConfirmUpload}
                                disabled={!showPreview || !file || isSubmitting || hasValidationErrors || isParsing}
                                className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Uploading..." : "Confirm Upload"} <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="xl:sticky xl:top-24 h-fit">
                        <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-strong) p-6 shadow-sm">
                            <h3 className="font-serif text-lg text-foreground mb-4">Format Guide</h3>
                            <p className="text-sm text-text-muted mb-6">
                                Ensure your CSV matches the required structure to avoid parsing errors. The system uses column headers to map data.
                            </p>

                            <div className="space-y-4 mb-8">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-widest text-foreground mb-2">Required Columns</div>
                                    <ul className="text-sm text-text-muted space-y-2 font-mono bg-surface-main p-4 rounded border border-border-subtle">
                                        <li>matric_number</li>
                                        <li>student_name</li>
                                        <li>department</li>
                                        <li>course_code</li>
                                        <li>grade</li>
                                    </ul>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-widest text-foreground mb-2 mt-6">Optional Columns</div>
                                    <ul className="text-sm text-text-muted space-y-2 font-mono bg-surface-main p-4 rounded border border-border-subtle">
                                        <li>parent_phone</li>
                                        <li>parent_email</li>
                                        <li>score</li>
                                    </ul>
                                </div>
                            </div>

                            <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface-main px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-subtle transition-colors">
                                <Download className="h-4 w-4" />
                                Download Template
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
