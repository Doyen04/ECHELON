"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileType,
  CheckCircle,
  AlertTriangle,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ParsedRow = {
  matricNumber: string;
  studentName: string;
  department: string;
  courseCode: string;
  courseUnit: string;
  grade: string;
  score: string;
  level: string; // Added level for validation
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

function validateAndBuildPreview(text: string, selectedLevel: string): ValidationState {
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
  const missingHeaders = REQUIRED_HEADERS.filter(
    (required) => !headers.includes(required),
  );
  const hasCourseUnitHeader =
    headers.includes("unit") ||
    headers.includes("course_unit") ||
    headers.includes("credit_unit");
  const parsedRows = parseCsv(text);

  const errors: string[] = [];
  if (missingHeaders.length > 0) {
    errors.push(`Missing required columns: ${missingHeaders.join(", ")}`);
  }
  if (!hasCourseUnitHeader) {
    errors.push(
      "Missing required course unit column: include one of unit, course_unit, or credit_unit.",
    );
  }

  const levelsInFile = new Set<string>();

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

    const rowLevel = (row.level ?? "").trim();
    if (rowLevel) {
      levelsInFile.add(rowLevel);
      if (rowLevel !== selectedLevel) {
        errors.push(`Row ${rowNumber}: Student level (${rowLevel}) does not match selected level (${selectedLevel}).`);
      }
    }
  });

  if (levelsInFile.size > 1) {
    errors.push(`Multiple levels detected in file: ${Array.from(levelsInFile).join(", ")}. A batch must contain students from only one level.`);
  }

  const previewRows: ParsedRow[] = parsedRows.slice(0, 5).map((row) => ({
    matricNumber: (row.matric_number ?? "").trim(),
    studentName: (row.student_name ?? "").trim(),
    department: (row.department ?? "").trim(),
    courseCode: (row.course_code ?? "").trim(),
    courseUnit: (row.unit ?? row.course_unit ?? row.credit_unit ?? "").trim(),
    grade: (row.grade ?? "").trim(),
    score: (row.score ?? "").trim(),
    level: (row.level ?? "").trim(),
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

export default function HodBatchUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [validation, setValidation] = useState<ValidationState | null>(null);

  const [programs, setPrograms] = useState<any[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);

  const [sessionValue, setSessionValue] = useState("2024/2025");
  const [semesterValue, setSemesterValue] = useState("FIRST");
  const [programId, setProgramId] = useState("");
  const [levelValue, setLevelValue] = useState("100");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<{
    batchId: string;
    students: number;
  } | null>(null);

  const [existingBatch, setExistingBatch] = useState<any>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  useEffect(() => {
    fetch("/api/hod/programs")
      .then((res) => res.json())
      .then((data) => {
        setPrograms(data.programs || []);
        if (data.programs?.length > 0) {
          setProgramId(data.programs[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to load programs", err);
        toast.error("Failed to load programs");
      })
      .finally(() => {
        setIsLoadingPrograms(false);
      });
  }, []);

  // Duplicate check effect
  useEffect(() => {
    if (!programId || !sessionValue || !semesterValue || !levelValue) return;

    const checkDuplicate = async () => {
      setIsCheckingDuplicate(true);
      try {
        const params = new URLSearchParams({
          programId,
          session: sessionValue,
          semester: semesterValue,
          level: levelValue,
        });
        const res = await fetch(`/api/hod/batches/check?${params.toString()}`);
        const data = await res.json();
        if (data.exists) {
          setExistingBatch(data.batch);
        } else {
          setExistingBatch(null);
        }
      } catch (err) {
        console.error("Duplicate check failed", err);
      } finally {
        setIsCheckingDuplicate(false);
      }
    };

    const timer = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(timer);
  }, [programId, sessionValue, semesterValue, levelValue]);

  const selectedFileType = useMemo(() => {
    if (!file) return null;
    const lowered = file.name.toLowerCase();
    if (lowered.endsWith(".pdf") || file.type.toLowerCase().includes("pdf")) {
      return "pdf" as const;
    }
    return "csv" as const;
  }, [file]);

  const hasValidationErrors = useMemo(() => {
    return Boolean(validation && validation.errors.length > 0);
  }, [validation]);

  const resetUploadState = () => {
    setFile(null);
    setShowPreview(false);
    setValidation(null);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  // Re-validate CSV when level changes
  useEffect(() => {
    if (file && selectedFileType === "csv" && !isParsing) {
      const revalidate = async () => {
        try {
          const csvText = await file.text();
          const validationResult = validateAndBuildPreview(csvText, levelValue);
          setValidation(validationResult);
        } catch (err) {
          console.error("Re-validation failed", err);
        }
      };
      revalidate();
    }
  }, [levelValue, file, selectedFileType]);

  const processSelectedFile = async (selectedFile: File) => {
    const isPdfFile =
      selectedFile.name.toLowerCase().endsWith(".pdf") ||
      selectedFile.type.toLowerCase().includes("pdf");
    const isCsvFile =
      selectedFile.name.toLowerCase().endsWith(".csv") ||
      selectedFile.type.includes("csv") ||
      selectedFile.type === "text/plain";

    if (!isCsvFile && !isPdfFile) {
      resetUploadState();
      setSubmitError("Please upload a valid CSV or PDF file.");
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);
    setShowPreview(false);
    setSubmitError(null);

    if (isPdfFile) {
      setValidation(null);
      setIsParsing(false);
      return;
    }

    try {
      const csvText = await selectedFile.text();
      const validationResult = validateAndBuildPreview(csvText, levelValue);
      setValidation(validationResult);
      setShowPreview(true);
    } catch {
      setValidation(null);
      setSubmitError("Unable to read the CSV file. Please try again.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!file || isSubmitting) return;
    if (selectedFileType === "csv" && hasValidationErrors) {
      setSubmitError("Fix validation errors before confirming upload.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = new FormData();
      payload.append("file", file);
      payload.append("session", sessionValue);
      payload.append("semester", semesterValue);
      payload.append("programId", programId);
      payload.append("level", levelValue);

      const response = await fetch("/api/hod/upload", {
        method: "POST",
        body: payload,
      });

      const responseBody = await response.json().catch(() => null);
      if (!response.ok) {
        setSubmitError(
          responseBody?.error ?? "Upload failed. Please try again.",
        );
        return;
      }

      setSubmitSuccess({
        batchId: responseBody.batchId,
        students: Number(responseBody.uploadedRows ?? 0),
      });
      toast.success("Upload Successful", {
        description: `Batch ${responseBody.batchId} saved to pending review.`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      setSubmitError("Network error while uploading batch.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen'>
      <PageHeader
        title='Upload Program Results'
        breadcrumbs={
          <div className='flex items-center gap-1 text-sm font-medium'>
            <Link
              href='/hod/batches'
              className='text-muted-foreground hover:text-foreground transition-colors'
            >
              My Batches
            </Link>
            <span className='text-muted-foreground/50 mx-1'>/</span>
            <span className='text-foreground font-bold'>Upload</span>
          </div>
        }
      />

      <main className='mx-auto w-full max-w-5xl py-6'>
        <div className='grid gap-8'>
          <Card className='p-6 border-border bg-card/50 backdrop-blur-sm'>
            <div className='flex items-center gap-3 mb-8'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-primary text-xs font-bold '>
                1
              </div>
              <div>
                <h2 className='text-sm font-bold uppercase tracking-widest text-foreground'>
                  Batch Details
                </h2>
                <p className='text-xs text-muted-foreground'>
                  Select the program and academic period
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <label className='text-xs font-bold uppercase tracking-tight text-muted-foreground px-1'>
                  Academic Session
                </label>
                <select
                  value={sessionValue}
                  onChange={(e) => setSessionValue(e.target.value)}
                  className='w-full h-10 rounded-md border border-input bg-card/30 px-3 text-sm focus:ring-2 focus:ring-sidebar-primary/30 outline-none transition-all'
                >
                  <option>2024/2025</option>
                  <option>2023/2024</option>
                </select>
              </div>
              <div className='space-y-2'>
                <label className='text-xs font-bold uppercase tracking-tight text-muted-foreground px-1'>
                  Semester
                </label>
                <select
                  value={semesterValue}
                  onChange={(e) => setSemesterValue(e.target.value)}
                  className='w-full h-10 rounded-md border border-input bg-card/30 px-3 text-sm focus:ring-2 focus:ring-sidebar-primary/30 outline-none transition-all'
                >
                  <option value='FIRST'>First Semester</option>
                  <option value='SECOND'>Second Semester</option>
                  <option value='THIRD'>Third Semester</option>
                </select>
              </div>
              <div className='space-y-2'>
                <label className='text-xs font-bold uppercase tracking-tight text-muted-foreground px-1'>
                  Degree Program
                </label>
                {isLoadingPrograms ? (
                  <div className='h-10 flex items-center px-3 border border-input rounded-md bg-card/30'>
                    <Loader2 className='h-4 w-4 animate-spin mr-2' />
                    <span className='text-xs text-muted-foreground'>
                      Loading programs...
                    </span>
                  </div>
                ) : (
                  <select
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                    className='w-full h-10 rounded-md border border-input bg-card/30 px-3 text-sm focus:ring-2 focus:ring-sidebar-primary/30 outline-none transition-all'
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className='space-y-2'>
                <label className='text-xs font-bold uppercase tracking-tight text-muted-foreground px-1'>
                  Student Level
                </label>
                <select
                  value={levelValue}
                  onChange={(e) => setLevelValue(e.target.value)}
                  className='w-full h-10 rounded-md border border-input bg-card/30 px-3 text-sm focus:ring-2 focus:ring-sidebar-primary/30 outline-none transition-all'
                >
                  <option value='100'>100 Level</option>
                  <option value='200'>200 Level</option>
                  <option value='300'>300 Level</option>
                  <option value='400'>400 Level</option>
                  <option value='500'>500 Level</option>
                </select>
              </div>
            </div>

            {existingBatch && (
              <div className='mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 animate-in fade-in slide-in-from-top-2'>
                <div className='flex items-start gap-3'>
                  <AlertTriangle className='h-5 w-5 text-amber-600 mt-0.5' />
                  <div className='flex-1'>
                    <h4 className='text-sm font-bold text-amber-900'>
                      Previous Upload Detected
                    </h4>
                    <p className='text-xs text-amber-800/80 mt-1'>
                      A batch for this program, level, and semester already exists. 
                      Uploading again will overwrite the existing data if approved.
                    </p>
                    <div className='mt-3 flex items-center gap-3'>
                      <Button
                        asChild
                        variant='outline'
                        size='sm'
                        className='h-8 text-[10px] uppercase font-bold border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 rounded-full'
                      >
                        <Link href={`/hod/batches/${existingBatch.id}`}>
                          Review Past Upload
                        </Link>
                      </Button>
                      <span className='text-[10px] text-amber-600/60 font-medium'>
                        Uploaded on {new Date(existingBatch.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className='p-6 border-border bg-card/50 backdrop-blur-sm'>
            <div className='flex items-center gap-3 mb-8'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-primary text-xs font-bold '>
                2
              </div>
              <div>
                <h2 className='text-sm font-bold uppercase tracking-widest text-foreground'>
                  File Upload
                </h2>
                <p className='text-xs text-muted-foreground'>
                  Upload your CSV or PDF result sheet
                </p>
              </div>
            </div>

            {!file ? (
              <div
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-2xl p-12 text-center transition-all duration-300",
                  isDragOver
                    ? "border-2 border-solid border-sidebar-primary bg-sidebar-primary/5"
                    : "border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40",
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files[0])
                    processSelectedFile(e.dataTransfer.files[0]);
                }}
              >
                <input
                  type='file'
                  accept='.csv,text/csv,.pdf,application/pdf'
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    processSelectedFile(e.target.files[0])
                  }
                  className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
                />
                <div className='rounded-2xl bg-card p-4 mb-4 border border-border '>
                  <UploadCloud className='h-8 w-8 text-sidebar-primary' />
                </div>
                <h3 className='text-base font-bold text-foreground mb-1'>
                  Click to upload or drag and drop
                </h3>
                <p className='text-xs text-muted-foreground mb-6 max-w-xs mx-auto'>
                  Supported formats: CSV (standard template) or Official PDF
                  result sheets.
                </p>
                <div className='flex items-center gap-4 px-4 py-1.5 bg-card/50 rounded-full border border-border text-[9px] font-bold uppercase tracking-widest text-muted-foreground'>
                  <span>CSV / PDF</span>
                  <span className='h-1 w-1 rounded-full bg-border' />
                  <span>Max 5MB</span>
                </div>
              </div>
            ) : (
              <div className='flex items-center justify-between rounded-xl border border-sidebar-primary/20 bg-sidebar-primary/5 p-4'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-lg bg-sidebar-primary text-white p-2.5'>
                    <FileType className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-sm font-bold text-foreground font-mono truncate max-w-xs'>
                      {file.name}
                    </p>
                    <p className='text-[10px] text-muted-foreground font-bold uppercase mt-0.5'>
                      {(file.size / 1024).toFixed(1)} KB •{" "}
                      {isParsing
                        ? "Processing..."
                        : selectedFileType?.toUpperCase()}
                    </p>
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={resetUploadState}
                  className='rounded-full hover:bg-destructive/10 hover:text-destructive'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            )}
          </Card>

          {showPreview && validation && (
            <Card className='p-6 border-border bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-primary text-xs font-bold '>
                  3
                </div>
                <div>
                  <h2 className='text-sm font-bold uppercase tracking-widest text-foreground'>
                    Data Preview
                  </h2>
                  <p className='text-xs text-muted-foreground'>
                    Extracted data from CSV
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-3 gap-4 mb-6'>
                <div className='rounded-lg border border-border bg-muted/20 p-3'>
                  <p className='text-[9px] font-bold uppercase tracking-wider text-muted-foreground'>
                    Rows
                  </p>
                  <p className='text-lg font-bold'>{validation.rowCount}</p>
                </div>
                <div className='rounded-lg border border-border bg-muted/20 p-3'>
                  <p className='text-[9px] font-bold uppercase tracking-wider text-muted-foreground'>
                    Students
                  </p>
                  <p className='text-lg font-bold'>{validation.studentCount}</p>
                </div>
                <div
                  className={cn(
                    "rounded-lg border p-3 md:col-span-1 col-span-2",
                    validation.errors.length > 0
                      ? "border-destructive/20 bg-destructive/5"
                      : "border-emerald-500/20 bg-emerald-500/5",
                  )}
                >
                  <p
                    className={cn(
                      "text-[9px] font-bold uppercase tracking-wider",
                      validation.errors.length > 0
                        ? "text-destructive"
                        : "text-emerald-600",
                    )}
                  >
                    Status
                  </p>
                  <p
                    className={cn(
                      "text-lg font-bold",
                      validation.errors.length > 0
                        ? "text-destructive"
                        : "text-emerald-600",
                    )}
                  >
                    {validation.errors.length > 0
                      ? `${validation.errors.length} Issues`
                      : "Valid"}
                  </p>
                </div>
              </div>

              {validation.errors.length > 0 && (
                <div className='rounded-lg border border-destructive/20 bg-destructive/5 p-4 mb-6'>
                  <h4 className='text-xs font-bold text-destructive mb-2 uppercase'>
                    Validation Issues
                  </h4>
                  <div className='space-y-1 max-h-40 overflow-y-auto'>
                    {validation.errors.map((err, i) => (
                      <p key={i} className='text-[10px] text-destructive/80'>
                        • {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className='rounded-lg border border-border overflow-hidden bg-background/30'>
                <DataTable
                  data={validation.previewRows}
                  columns={[
                    {
                      header: "Matric",
                      accessorKey: "matricNumber",
                      className: "px-3 py-2 text-xs font-mono",
                    },
                    {
                      header: "Name",
                      accessorKey: "studentName",
                      className: "px-3 py-2 text-xs font-semibold",
                    },
                    {
                      header: "Course",
                      accessorKey: "courseCode",
                      className: "px-3 py-2 text-xs",
                    },
                    {
                      header: "Grade",
                      accessorKey: "grade",
                      className: "px-3 py-2 text-xs",
                      cell: (r: any) => (
                        <Badge variant='secondary' className='font-bold py-0'>
                          {r.grade}
                        </Badge>
                      ),
                    },
                  ]}
                />
              </div>
            </Card>
          )}

          {submitError && (
            <div className='rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive font-bold flex items-center gap-2'>
              <AlertTriangle className='h-4 w-4' />
              {submitError}
            </div>
          )}

          {submitSuccess ? (
            <Card className='border-emerald-500/20 bg-emerald-500/5 p-8 text-center animate-in zoom-in-95'>
              <div className='flex flex-col items-center gap-4'>
                <div className='h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600'>
                  <CheckCircle className='h-8 w-8' />
                </div>
                <div>
                  <h3 className='text-xl font-bold text-foreground'>
                    Upload Successful
                  </h3>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Successfully uploaded{" "}
                    <span className='font-bold text-emerald-600'>
                      {submitSuccess.students} student results
                    </span>
                    .
                  </p>
                </div>
                <div className='flex gap-3 mt-4'>
                  <Button asChild variant='outline' className='rounded-full'>
                    <Link href='/hod/batches'>View My Batches</Link>
                  </Button>
                  <Button
                    asChild
                    className='rounded-full bg-emerald-600 hover:bg-emerald-700'
                  >
                    <Link href={`/hod/batches/${submitSuccess.batchId}`}>
                      View Batch Details
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className='flex justify-end gap-4 pb-12'>
              <Button
                variant='ghost'
                onClick={resetUploadState}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmUpload}
                disabled={
                  !file || isSubmitting || isParsing || hasValidationErrors
                }
                className='min-w-[150px] bg-sidebar-primary hover:bg-sidebar-primary/90 rounded-full'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin mr-2' />
                    Uploading...
                  </>
                ) : (
                  <>
                    Confirm & Upload
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
