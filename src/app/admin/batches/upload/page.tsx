"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileType,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Download,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    if (!(row.unit ?? row.course_unit ?? row.credit_unit ?? "").trim()) {
      errors.push(
        `Row ${rowNumber}: unit (or course_unit / credit_unit) is required.`,
      );
    }
  });

  const previewRows: ParsedRow[] = parsedRows.slice(0, 5).map((row) => ({
    matricNumber: (row.matric_number ?? "").trim(),
    studentName: (row.student_name ?? "").trim(),
    department: (row.department ?? "").trim(),
    courseCode: (row.course_code ?? "").trim(),
    courseUnit: (row.unit ?? row.course_unit ?? row.credit_unit ?? "").trim(),
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
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [validation, setValidation] = useState<ValidationState | null>(null);
  const [sessionValue, setSessionValue] = useState("2024/2025");
  const [semesterValue, setSemesterValue] = useState("FIRST");
  const [departmentValue, setDepartmentValue] = useState("Computer Science");
  const [autoDispatch, setAutoDispatch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<{
    batchId: string;
    dispatchId?: string;
    students: number;
    autoDispatched: boolean;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const steps = [
    { id: 1, title: "Information", icon: FileType },
    { id: 2, title: "File Upload", icon: UploadCloud },
    { id: 3, title: "Validation", icon: CheckCircle },
  ];

  const currentStep = useMemo(() => {
    if (submitSuccess) return 4;
    if (showPreview) return 3;
    if (file) return 2;
    return 1;
  }, [file, showPreview, submitSuccess]);

  const selectedFileType = useMemo(() => {
    if (!file) {
      return null;
    }

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
    setShowErrorDetails(false);
    setValidation(null);
    setSubmitError(null);
    setSubmitSuccess(null);
    setUploadProgress(0);
  };

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
    setShowErrorDetails(false);
    setSubmitError(null);
    setSubmitSuccess(null);

    if (isPdfFile) {
      setValidation(null);
      setShowPreview(false);
      setIsParsing(false);
      return;
    }

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

    if (selectedFileType === "csv" && hasValidationErrors) {
      setSubmitError("Fix validation errors before confirming upload.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    setUploadProgress(10);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 500);

    try {
      const payload = new FormData();
      payload.append("file", file);
      payload.append("session", sessionValue);
      payload.append("semester", semesterValue);
      payload.append("department", departmentValue);
      payload.append("autoDispatch", autoDispatch ? "true" : "false");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: payload,
      });

      clearInterval(progressInterval);

      const responseBody = await response.json().catch(() => null);
      if (!response.ok) {
        setUploadProgress(0);
        setSubmitError(
          responseBody?.error ?? "Upload failed. Please try again.",
        );
        toast.error("Upload failed", {
          description: responseBody?.error ?? "Please try again.",
        });
        return;
      }

      setSubmitSuccess({
        batchId: responseBody.batchId,
        dispatchId: responseBody.dispatch?.dispatchId,
        students: Number(responseBody.students ?? 0),
        autoDispatched: Boolean(responseBody.dispatch?.dispatchId),
      });
      setUploadProgress(100);

      if (responseBody.dispatch?.dispatchId) {
        toast.success("Upload and Dispatch Successful", {
          description: `Batch ${responseBody.batchId} uploaded and emails are sending.`,
        });
      } else {
        toast.success("Upload Successful", {
          description: `Batch ${responseBody.batchId} saved to pending review.`,
        });
      }
    } catch {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setSubmitError("Network error while uploading batch.");
      toast.error("Network Error", {
        description:
          "An error occurred while uploading. Check your connection.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "matric_number",
      "student_name",
      "department",
      "course_code",
      "unit",
      "grade",
      "parent_phone",
      "parent_email",
      "score",
    ];

    const example = [
      "ABC/001",
      "John Doe",
      "Computer Science",
      "CSC101",
      "3",
      "A",
      "",
      "",
      "",
    ];

    const csv = [headers.join(","), example.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "result-upload-template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='dashboard-root min-h-screen bg-background'>
      <PageHeader
        title='Upload Result Batch'
        breadcrumbs={
          <div className='flex items-center gap-1 text-sm font-medium'>
            <Link
              href='/admin/batches'
              className='text-muted-foreground hover:text-foreground transition-colors'
            >
              Result Batches
            </Link>
            <span className='text-muted-foreground/50 mx-1'>/</span>
            <span className='text-foreground font-bold'>New Upload</span>
          </div>
        }
      />

      <main className='mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
        <div className='grid gap-8 xl:grid-cols-[1fr_350px]'>
          <div className='space-y-8 dashboard-section'>
            <Card className='p-6 border-border'>
              <div className='flex items-center gap-3 mb-8 px-1'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-primary text-xs font-bold '>
                  1
                </div>
                <div>
                  <h2 className='text-sm font-bold uppercase tracking-widest text-foreground'>
                    Basic Information
                  </h2>
                  <p className='text-xs text-muted-foreground'>
                    Select the session and department for this batch
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
                    onChange={(event) => setSessionValue(event.target.value)}
                    className='w-full h-10 rounded-md border border-input bg-card px-3 text-sm font-medium focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none transition-all cursor-pointer'
                  >
                    <option>2024/2025</option>
                    <option>2023/2024</option>
                  </select>
                </div>
                <div className='space-y-2'>
                  <label className='text-xs font-bold uppercase tracking-tight text-muted-foreground px-1'>
                    Semester Period
                  </label>
                  <select
                    value={semesterValue}
                    onChange={(event) => setSemesterValue(event.target.value)}
                    className='w-full h-10 rounded-md border border-input bg-card px-3 text-sm font-medium focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none transition-all cursor-pointer'
                  >
                    <option value='FIRST'>First Semester</option>
                    <option value='SECOND'>Second Semester</option>
                    <option value='THIRD'>Third Semester</option>
                  </select>
                </div>
                <div className='space-y-2 md:col-span-2'>
                  <label className='text-xs font-bold uppercase tracking-tight text-muted-foreground px-1'>
                    Department / Program
                  </label>
                  <select
                    value={departmentValue}
                    onChange={(event) => setDepartmentValue(event.target.value)}
                    className='w-full h-10 rounded-md border border-input bg-card px-3 text-sm font-medium focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none transition-all cursor-pointer'
                  >
                    <option>Computer Science</option>
                    <option>Physics</option>
                    <option>Mathematics</option>
                  </select>
                </div>

                <Separator className='md:col-span-2 my-2 opacity-50' />

                <div className='space-y-4 md:col-span-2'>
                  <label className='text-xs font-bold uppercase tracking-tight text-muted-foreground px-1'>
                    Auto-Dispatch Settings
                  </label>
                  <label
                    className={cn(
                      "flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4 cursor-pointer transition-all hover:bg-muted/40",
                      autoDispatch &&
                        "border-sidebar-primary/30 bg-sidebar-primary/5",
                    )}
                  >
                    <div className='space-y-1 select-none flex-1'>
                      <span className='block text-sm font-bold text-foreground'>
                        Instant Parent Notification
                      </span>
                      <p className='text-muted-foreground text-xs leading-relaxed'>
                        Deliver results to parents via Email and WhatsApp
                        immediately after a successful upload.
                      </p>
                    </div>

                    <div className='relative inline-flex items-center shrink-0'>
                      <input
                        type='checkbox'
                        checked={autoDispatch}
                        onChange={(event) =>
                          setAutoDispatch(event.target.checked)
                        }
                        className='peer sr-only'
                      />
                      <div className='h-6 w-11 rounded-full bg-muted border border-border transition-colors peer-checked:bg-sidebar-primary peer-checked:border-sidebar-primary shadow-inner' />
                      <div className='absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5' />
                    </div>
                  </label>
                </div>
              </div>
            </Card>

            <Card className='p-6 border-border'>
              <div className='flex items-center gap-3 mb-8 px-1'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-primary text-xs font-bold '>
                  2
                </div>
                <div>
                  <h2 className='text-sm font-bold uppercase tracking-widest text-foreground'>
                    File Selection
                  </h2>
                  <p className='text-xs text-muted-foreground'>
                    Upload a CSV or PDF file containing the result data
                  </p>
                </div>
              </div>

              {!file ? (
                <div
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-2xl p-16 text-center transition-all duration-300 ease-in-out group/dropzone",
                    isDragOver
                      ? "border-2 border-solid border-sidebar-primary bg-sidebar-primary/5"
                      : "border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40",
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type='file'
                    accept='.csv,text/csv,.pdf,application/pdf'
                    onChange={handleFileChange}
                    className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20'
                  />
                  <div className='rounded-2xl bg-card p-5 mb-6  border border-border transition-transform duration-300'>
                    <UploadCloud className='h-10 w-10 text-sidebar-primary' />
                  </div>
                  <h3 className='text-lg font-bold text-foreground mb-1'>
                    {isDragOver ? "Drop file to upload" : "Select result file"}
                  </h3>
                  <p className='text-sm text-muted-foreground mb-8 max-w-xs'>
                    Drag and drop your result file here, or click to browse from
                    your device.
                  </p>

                  <div className='flex items-center gap-6 px-4 py-2 bg-card rounded-full border border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground '>
                    <span className='flex items-center gap-1.5'>
                      <FileType className='h-3 w-3' /> CSV or PDF
                    </span>
                    <span className='h-1 w-1 rounded-full bg-border' />
                    <span>Max size: 5MB</span>
                  </div>
                </div>
              ) : (
                <div className='flex items-center justify-between rounded-2xl border border-sidebar-primary/20 bg-sidebar-primary/5 p-5 transition-all animate-in fade-in slide-in-from-bottom-2'>
                  <div className='flex items-center gap-4'>
                    <div className='rounded-xl bg-sidebar-primary text-white p-3 '>
                      <FileType className='h-6 w-6' />
                    </div>
                    <div>
                      <p className='text-sm font-bold text-foreground font-mono truncate max-w-md'>
                        {file.name}
                      </p>
                      <div className='flex items-center gap-2 mt-1'>
                        <Badge
                          variant='secondary'
                          className='px-1.5 py-0 text-[10px] bg-sidebar-primary/10 text-sidebar-primary border-none'
                        >
                          {(file.size / 1024).toFixed(1)} KB
                        </Badge>
                        <span className='text-[10px] font-bold uppercase tracking-tight text-muted-foreground'>
                          {isParsing
                            ? "Processing data..."
                            : selectedFileType === "pdf"
                              ? "System will extract data upon upload"
                              : "Data analysis complete"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={resetUploadState}
                    className='rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                  >
                    <X className='h-5 w-5' />
                  </Button>
                </div>
              )}
            </Card>

            {selectedFileType === "pdf" && file ? (
              <div className='rounded-lg border border-border-subtle bg-surface-main p-4 text-sm text-text-muted'>
                PDF selected. Student rows and courses will be extracted
                server-side when you confirm upload.
              </div>
            ) : null}

            {showPreview && validation ? (
              <Card className='overflow-hidden border-border  animate-in fade-in slide-in-from-bottom-4 duration-500'>
                <div className='p-6 border-b border-border'>
                  <div className='flex items-center gap-3 mb-8 px-1'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-primary text-xs font-bold '>
                      3
                    </div>
                    <div>
                      <h2 className='text-sm font-bold uppercase tracking-widest text-foreground'>
                        Validation & Preview
                      </h2>
                      <p className='text-xs text-muted-foreground'>
                        Verify the extracted data before final submission
                      </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
                    <div className='rounded-xl border border-border bg-muted/20 p-4 space-y-1'>
                      <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                        Records Found
                      </p>
                      <p className='text-xl font-bold text-foreground'>
                        {validation.rowCount}
                      </p>
                    </div>
                    <div className='rounded-xl border border-border bg-muted/20 p-4 space-y-1'>
                      <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                        Unique Students
                      </p>
                      <p className='text-xl font-bold text-foreground'>
                        {validation.studentCount}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "rounded-xl border p-4 space-y-1 transition-colors",
                        validation.errors.length > 0
                          ? "border-destructive/20 bg-destructive/5"
                          : "border-emerald-500/20 bg-emerald-500/5",
                      )}
                    >
                      <p
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          validation.errors.length > 0
                            ? "text-destructive"
                            : "text-emerald-600",
                        )}
                      >
                        System Validation
                      </p>
                      <div className='flex items-center justify-between'>
                        <p
                          className={cn(
                            "text-xl font-bold",
                            validation.errors.length > 0
                              ? "text-destructive"
                              : "text-emerald-600",
                          )}
                        >
                          {validation.errors.length > 0
                            ? `${validation.errors.length} Issues`
                            : "Passed"}
                        </p>
                        {validation.errors.length > 0 && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setShowErrorDetails((v) => !v)}
                            className='h-8 px-2 text-[10px] font-bold uppercase tracking-tighter text-destructive hover:bg-destructive/10'
                          >
                            {showErrorDetails ? "Hide Details" : "View Details"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {showErrorDetails && validation.errors.length > 0 ? (
                    <div className='rounded-xl border border-destructive/20 bg-destructive/5 p-6 mb-8 animate-in fade-in duration-300'>
                      <div className='flex items-center gap-2 text-destructive mb-4'>
                        <AlertTriangle className='h-5 w-5' />
                        <h4 className='text-sm font-bold'>
                          Critical Validation Errors
                        </h4>
                      </div>
                      <div className='space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar'>
                        {validation.errors.slice(0, 50).map((error, idx) => (
                          <div
                            key={idx}
                            className='flex items-start gap-2 text-xs text-destructive/80 font-medium bg-white/50 p-2 rounded-lg border border-destructive/10'
                          >
                            <span className='shrink-0 mt-0.5'>•</span>
                            <p>{error}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className='space-y-4'>
                    <div className='flex items-center justify-between px-1'>
                      <h4 className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>
                        Snapshot Preview
                      </h4>
                      <Badge variant='outline' className='font-bold'>
                        Top 5 Rows
                      </Badge>
                    </div>
                    <div className='rounded-xl border border-border overflow-hidden'>
                      <DataTable
                        data={validation.previewRows}
                        className='border-0 -mx-px'
                        columns={[
                          {
                            header: "Matric Number",
                            accessorKey: "matricNumber",
                            className: "px-4 py-3 font-mono text-xs font-bold",
                          },
                          {
                            header: "Student Name",
                            accessorKey: "studentName",
                            className: "px-4 py-3 font-semibold",
                          },
                          {
                            header: "Course",
                            accessorKey: "courseCode",
                            className: "px-4 py-3 font-mono text-xs",
                          },
                          {
                            header: "Grade",
                            accessorKey: "grade",
                            className: "px-4 py-3",
                            cell: (row: any) => (
                              <Badge
                                variant='secondary'
                                className='font-bold min-w-8 justify-center'
                              >
                                {row.grade}
                              </Badge>
                            ),
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            {submitError ? (
              <div className='rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive font-semibold flex items-center gap-2 animate-in slide-in-from-top-2'>
                <AlertTriangle className='h-4 w-4' />
                {submitError}
              </div>
            ) : null}

            {submitSuccess ? (
              <Card className='border-emerald-500/20 bg-emerald-500/5 p-6 animate-in zoom-in-95 duration-300'>
                <div className='flex items-center gap-3 text-emerald-600 mb-4'>
                  <CheckCircle className='h-6 w-6' />
                  <h3 className='text-lg font-bold'>Upload Successful</h3>
                </div>
                <div className='space-y-4'>
                  <p className='text-sm text-emerald-700/80 leading-relaxed'>
                    Successfully processed results for{" "}
                    <span className='font-bold text-emerald-700'>
                      {submitSuccess.students} students
                    </span>
                    . Batch ID:{" "}
                    <span className='font-mono bg-emerald-100 px-1.5 py-0.5 rounded text-xs'>
                      {submitSuccess.batchId}
                    </span>
                  </p>

                  <div className='bg-white/50 rounded-xl p-4 border border-emerald-200/50'>
                    <p className='text-xs text-emerald-700'>
                      {submitSuccess.autoDispatched && submitSuccess.dispatchId
                        ? `Dispatch active (${submitSuccess.dispatchId}). Delivery status is being tracked.`
                        : "Batch saved to pending review. No notifications sent yet."}
                    </p>
                  </div>

                  <div className='flex flex-wrap gap-3 pt-2'>
                    <Button
                      asChild
                      variant='outline'
                      className='bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200'
                    >
                      <Link href='/admin/dashboard'>View Dashboard</Link>
                    </Button>
                    {submitSuccess.dispatchId && (
                      <Button
                        asChild
                        className='bg-emerald-600 hover:bg-emerald-700 text-white'
                      >
                        <Link
                          href={`/admin/delivery/${submitSuccess.dispatchId}`}
                        >
                          Track Delivery
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ) : null}

            <div className='flex items-center justify-between gap-4 pt-6 pb-20 border-t border-border'>
              <Button
                variant='ghost'
                asChild
                className='text-muted-foreground hover:text-foreground'
              >
                <Link href='/admin/batches'>Discard Changes</Link>
              </Button>

              <Button
                onClick={handleConfirmUpload}
                disabled={
                  !file ||
                  isSubmitting ||
                  isParsing ||
                  (selectedFileType === "csv" &&
                    (!showPreview || hasValidationErrors))
                }
                size='lg'
                className='min-w-40 gap-2 rounded-xl bg-sidebar-primary transition-all hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isSubmitting ? "Processing..." : "Complete Upload"}
                <ArrowRight className='h-4 w-4' />
              </Button>
            </div>
            {isSubmitting && uploadProgress > 0 && (
              <div className='my-4'>
                <div className='flex justify-between items-center mb-1'>
                  <span className='text-xs font-medium text-foreground'>
                    Uploading...
                  </span>
                  <span className='text-xs font-mono text-muted-foreground'>
                    {uploadProgress}%
                  </span>
                </div>
                <div className='w-full bg-muted rounded-full h-1.5 overflow-hidden'>
                  <div
                    className='bg-sidebar-primary h-1.5 rounded-full transition-all duration-300 ease-out'
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className='xl:sticky xl:top-24 h-fit space-y-6'>
            <Card className='p-6 border-border bg-muted/20'>
              <div className='flex items-center gap-2 mb-6'>
                <Download className='h-5 w-5 text-sidebar-primary' />
                <h3 className='text-sm font-bold uppercase tracking-widest text-foreground'>
                  Format Guide
                </h3>
              </div>

              <p className='text-xs text-muted-foreground leading-relaxed mb-6'>
                Please ensure your file follows the standard format to avoid
                extraction errors.
              </p>

              <div className='space-y-6 mb-8'>
                <div className='space-y-3'>
                  <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-sidebar-primary' />
                    Required Columns
                  </div>
                  <div className='flex flex-wrap gap-1.5'>
                    {[
                      "matric_number",
                      "student_name",
                      "department",
                      "course_code",
                      "grade",
                      "unit",
                    ].map((col) => (
                      <span
                        key={col}
                        className='text-[10px] font-mono bg-card px-2 py-1 rounded border border-border text-foreground/80'
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                <div className='space-y-3'>
                  <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-muted-foreground/30' />
                    Optional Data
                  </div>
                  <div className='flex flex-wrap gap-1.5'>
                    {["parent_phone", "parent_email", "score"].map((col) => (
                      <span
                        key={col}
                        className='text-[10px] font-mono bg-card/50 px-2 py-1 rounded border border-border text-muted-foreground'
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Separator className='mb-6 opacity-50' />

              <Button
                variant='outline'
                onClick={handleDownloadTemplate}
                className='w-full gap-2 rounded-xl border-sidebar-primary/20 text-sidebar-primary hover:bg-sidebar-primary/5'
              >
                <Download className='h-4 w-4' />
                Get CSV Template
              </Button>
            </Card>

            <div className='rounded-2xl bg-sidebar-primary p-6 text-white'>
              <h4 className='text-sm font-bold mb-2'>Need Assistance?</h4>
              <p className='text-xs text-sidebar-primary-foreground/80 leading-relaxed mb-4'>
                If you're having trouble with PDF extraction, try converting to
                CSV or contact the SIS administrator.
              </p>
              <Button
                variant='secondary'
                className='w-full text-xs h-9 bg-white/10 hover:bg-white/20 border-none text-white'
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
