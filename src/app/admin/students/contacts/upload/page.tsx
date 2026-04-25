"use client";

import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type UploadResult = {
    totalRows: number;
    matched: number;
    created: number;
    updated: number;
    unmatched: string[];
};

export default function ContactUploadPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, startSubmitting] = useTransition();

    const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setSelectedFile(file);
        setResult(null);
        setErrorMessage(null);
    };

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedFile || isSubmitting) {
            return;
        }

        startSubmitting(async () => {
            setResult(null);
            setErrorMessage(null);

            try {
                const formData = new FormData();
                formData.append("file", selectedFile);

                const response = await fetch("/api/students/contacts/upload", {
                    method: "POST",
                    body: formData,
                });

                const payload = await response.json().catch(() => null);
                if (!response.ok) {
                    setErrorMessage(payload?.error ?? "Failed to upload contacts CSV.");
                    return;
                }

                setResult(payload as UploadResult);
            } catch {
                setErrorMessage("Network error while uploading contacts CSV.");
            }
        });
    };

    return (
        <main className="dashboard-root min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="dashboard-grid-overlay" aria-hidden="true" />
            <Card className="mx-auto w-full max-w-4xl rounded-3xl p-6 shadow-[0_25px_60px_-38px_rgba(2,23,23,0.75)] sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                            Contact Management
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                            Upload Contacts
                        </h1>
                        <p className="mt-3 text-sm text-(--text-secondary)">
                            Import guardian contacts from CSV and automatically match by matric number.
                        </p>
                    </div>
                    <Button asChild variant="outline" className="rounded-full">
                        <Link href="/admin/students" className="inline-flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back To Contacts
                        </Link>
                    </Button>
                </div>

                <form onSubmit={onSubmit} className="mt-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground" htmlFor="contactsCsv">
                            Contacts CSV File
                        </label>
                        <Input
                            id="contactsCsv"
                            type="file"
                            accept=".csv,text/csv"
                            onChange={onFileChange}
                        />
                        <p className="text-xs text-(--text-secondary)">
                            Required columns: matric_number, parent_name, and at least one of parent_email or parent_phone.
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <Button asChild variant="outline">
                            <Link href="/admin/students">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={!selectedFile || isSubmitting}>
                            <Upload className="h-4 w-4" />
                            {isSubmitting ? "Uploading..." : "Upload Contacts"}
                        </Button>
                    </div>
                </form>

                {errorMessage ? (
                    <div className="mt-6 rounded-2xl border border-status-danger/40 bg-status-danger/10 p-4 text-sm text-status-danger">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4" />
                            <p>{errorMessage}</p>
                        </div>
                    </div>
                ) : null}

                {result ? (
                    <div className="mt-6 rounded-2xl border border-status-success/35 bg-status-success/10 p-5">
                        <div className="flex items-center gap-2 text-status-success">
                            <CheckCircle2 className="h-5 w-5" />
                            <h2 className="text-sm font-semibold uppercase tracking-widest">Upload Complete</h2>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm text-foreground sm:grid-cols-2">
                            <p>Total rows: <span className="font-semibold">{result.totalRows}</span></p>
                            <p>Matched students: <span className="font-semibold">{result.matched}</span></p>
                            <p>Created contacts: <span className="font-semibold">{result.created}</span></p>
                            <p>Updated contacts: <span className="font-semibold">{result.updated}</span></p>
                        </div>

                        {result.unmatched.length > 0 ? (
                            <div className="mt-4 rounded-xl border border-status-warning/35 bg-status-warning/10 p-3 text-sm text-status-warning">
                                <p className="font-medium">Unmatched matric numbers:</p>
                                <p className="mt-1 wrap-break-word">{result.unmatched.join(", ")}</p>
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </Card>
        </main>
    );
}
