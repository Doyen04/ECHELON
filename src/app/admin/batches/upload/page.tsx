"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UploadCloud, FileType, CheckCircle, AlertTriangle, ArrowRight, Download, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export default function BatchUploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
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

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
            setSubmitError(null);
            setSubmitSuccess(null);
            // Simulate parsing delay
            setTimeout(() => setShowPreview(true), 1200);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setSubmitError(null);
            setSubmitSuccess(null);
            setTimeout(() => setShowPreview(true), 1200);
        }
    };

    const handleConfirmUpload = async () => {
        if (!file || isSubmitting) {
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
        <div className="flex flex-col h-full overflow-y-auto w-full bg-background">
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

            <div className="p-6 md:p-8 max-w-400 w-full mx-auto">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Upload Form 65% */}
                    <div className="flex-1 lg:max-w-[65%] space-y-8 dashboard-section">

                        {/* Step 1: Metadata */}
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

                        {/* Step 2: File Upload */}
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
                                    <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <div className="rounded-full bg-surface-main p-4 shadow-sm mb-4">
                                        <UploadCloud className="h-8 w-8 text-brand" />
                                    </div>
                                    <h3 className="text-lg font-serif text-foreground mb-1">Drag & drop your CSV here</h3>
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
                                            <p className="text-xs text-text-muted mt-0.5">{(file.size / 1024).toFixed(1)} KB - Uploading and parsing...</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setFile(null);
                                            setShowPreview(false);
                                            setSubmitError(null);
                                            setSubmitSuccess(null);
                                        }}
                                        className="p-2 text-text-muted hover:text-red-500 transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Step 3: Preview */}
                        {showPreview && (
                            <div className="rounded-xl border border-border-subtle bg-surface-main shadow-sm overflow-hidden page-transition-enter">
                                <div className="p-6 border-b border-border-subtle">
                                    <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4">Step 3: Preview & Validation</h2>
                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-2 text-sm text-status-success font-medium">
                                            <CheckCircle className="h-4 w-4" /> 247 students parsed
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-status-success font-medium">
                                            <CheckCircle className="h-4 w-4" /> 1,482 course records
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-status-danger font-medium">
                                            <AlertTriangle className="h-4 w-4" /> 3 rows with format errors <button className="underline ml-1">View errors</button>
                                        </div>
                                    </div>

                                    {/* Duplicate warning */}
                                    <div className="rounded-lg border border-status-warning/40 bg-status-warning/10 p-4 flex gap-3 text-status-warning mb-6">
                                        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                                        <p className="text-sm">
                                            <span className="font-semibold block mb-1">A batch for this session already exists.</span>
                                            Uploading will create a new version. The existing batch will not be deleted, but this new one will become the active pending batch.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-surface-subtle/20 p-6">
                                    <h4 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">Data Preview (first 5 rows)</h4>
                                    <div className="rounded-lg border border-border-subtle bg-surface-main overflow-x-auto">
                                        <table className="min-w-full divide-y divide-border-subtle">
                                            <thead className="bg-surface-subtle/30">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Matric Number</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Student Name</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">GPA</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-subtle">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <tr key={i}>
                                                        <td className="px-3 py-2 text-sm font-mono text-text-muted">CSC/2021/00{i}</td>
                                                        <td className="px-3 py-2 text-sm text-foreground">Student Name {i}</td>
                                                        <td className="px-3 py-2 text-sm text-foreground">{(4.0 - Math.random()).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

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

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-4 pt-4 pb-12">
                            <Link href="/admin/batches" className="px-5 py-2.5 text-sm font-medium text-text-muted hover:text-foreground transition-colors">
                                Cancel
                            </Link>
                            <button
                                onClick={handleConfirmUpload}
                                disabled={!showPreview || !file || isSubmitting}
                                className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Uploading..." : "Confirm Upload"} <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Right format guide 35% */}
                    <div className="lg:w-fit lg:min-w-85">
                        <div className="sticky top-24 rounded-xl border border-border-subtle bg-surface-main p-6 shadow-sm">
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

                            <button className="flex w-full items-center justify-center gap-2 rounded border border-border-subtle bg-surface-main px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-subtle transition-colors">
                                <Download className="h-4 w-4" />
                                Download Template
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
