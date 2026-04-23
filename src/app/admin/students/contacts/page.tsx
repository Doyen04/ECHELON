"use client";

import { useState } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";

type UploadResult = {
  totalRows: number;
  matched: number;
  created: number;
  updated: number;
  unmatched: string[];
};

export default function StudentContactsUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const onUpload = async () => {
    if (!file || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/students/contacts/upload", {
        method: "POST",
        body: formData,
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error ?? "Failed to upload contacts.");
        return;
      }

      setResult(body as UploadResult);
    } catch {
      setError("Network error while uploading contacts.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-root min-h-screen bg-background">
      <PageHeader
        title="Upload Parent Contacts"
        breadcrumbs={
          <div className="flex items-center gap-1">
            <Link href="/admin/students" className="hover:text-foreground transition-colors">
              Students
            </Link>
            <span>/</span>
            <span className="text-foreground">Upload Contacts</span>
          </div>
        }
      />

      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-xl border border-border-subtle bg-surface-main p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted">Contact Mapping File</h2>
          <p className="mt-3 text-sm text-text-muted">
            Upload a CSV with: matric_number, parent_name, parent_email, parent_phone, and relationship.
          </p>

          <div className="mt-6">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-hover"
            />
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={onUpload}
              disabled={!file || isSubmitting}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Uploading..." : "Upload Contacts"}
            </button>
          </div>

          {error ? <p className="mt-4 text-sm text-status-danger">{error}</p> : null}

          {result ? (
            <div className="mt-6 rounded-lg border border-border-subtle bg-surface-subtle/20 p-4 text-sm">
              <p>Total rows: {result.totalRows}</p>
              <p>Matched matric numbers: {result.matched}</p>
              <p>Created contacts: {result.created}</p>
              <p>Updated contacts: {result.updated}</p>
              <p>Unmatched matric numbers: {result.unmatched.length}</p>
              {result.unmatched.length > 0 ? (
                <p className="mt-2 text-text-muted">{result.unmatched.slice(0, 20).join(", ")}</p>
              ) : null}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
