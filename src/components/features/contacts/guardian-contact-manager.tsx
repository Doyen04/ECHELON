"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Edit3, Trash2, Search, Save, Upload, X, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { DataTable } from "@/components/ui/data-table";
import type { DataTableColumn } from "@/components/ui/data-table";

type GuardianRow = {
    id: string;
    studentId: string;
    studentName: string;
    matricNumber: string;
    department: string;
    faculty: string;
    level: number;
    name: string;
    relationship: string;
    email: string | null;
    phone: string | null;
};

type GuardianContactManagerProps = {
    guardians: GuardianRow[];
};

type EditableGuardian = {
    name: string;
    relationship: string;
    email: string;
    phone: string;
};

type UploadResult = {
    totalRows: number;
    matched: number;
    created: number;
    updated: number;
    unmatched: string[];
};

const emptyEditState: EditableGuardian = {
    name: "",
    relationship: "Parent",
    email: "",
    phone: "",
};

export function GuardianContactManager({ guardians }: GuardianContactManagerProps) {
    const [query, setQuery] = useState("");
    const [selectedGuardian, setSelectedGuardian] = useState<GuardianRow | null>(null);
    const [editState, setEditState] = useState<EditableGuardian>(emptyEditState);
    const [deleteTarget, setDeleteTarget] = useState<GuardianRow | null>(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, startSaving] = useTransition();
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);

    const filteredGuardians = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return guardians;

        return guardians.filter((guardian) =>
            [guardian.name, guardian.relationship, guardian.email ?? "", guardian.phone ?? "", guardian.matricNumber, guardian.studentName, guardian.department]
                .join(" ")
                .toLowerCase()
                .includes(normalized),
        );
    }, [guardians, query]);

    const openEditor = (guardian: GuardianRow) => {
        setSelectedGuardian(guardian);
        setEditState({
            name: guardian.name,
            relationship: guardian.relationship,
            email: guardian.email ?? "",
            phone: guardian.phone ?? "",
        });
        setMessage(null);
        setIsError(false);
    };

    const closeEditor = () => {
        setSelectedGuardian(null);
        setMessage(null);
        setIsError(false);
    };

    const openUploadModal = () => {
        setUploadFile(null);
        setUploadResult(null);
        setUploadError(null);
        setIsUploadOpen(true);
    };

    const closeUploadModal = () => {
        if (isUploading) return;
        setIsUploadOpen(false);
        setUploadFile(null);
        setUploadResult(null);
        setUploadError(null);
    };

    const handleUploadContacts = async () => {
        if (!uploadFile || isUploading) return;

        setIsUploading(true);
        setUploadError(null);
        setUploadResult(null);

        try {
            const formData = new FormData();
            formData.append("file", uploadFile);

            const response = await fetch("/api/students/contacts/upload", {
                method: "POST",
                body: formData,
            });

            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                setUploadError(payload?.error ?? "Failed to upload contacts CSV.");
                return;
            }

            setUploadResult(payload as UploadResult);
            setIsUploadOpen(false);
            setUploadFile(null);
            window.location.reload();
        } catch {
            setUploadError("Network error while uploading contacts CSV.");
        } finally {
            setIsUploading(false);
        }
    };

    const saveGuardian = () => {
        if (!selectedGuardian || isSaving) return;

        startSaving(async () => {
            setMessage(null);
            setIsError(false);

            try {
                const response = await fetch(`/api/guardians/${selectedGuardian.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...editState,
                        email: (editState.email ?? "").trim() || null,
                        phone: (editState.phone ?? "").trim() || null,
                    }),
                });

                const body = await response.json().catch(() => null);
                if (!response.ok) {
                    setIsError(true);
                    setMessage(body?.error ?? "Failed to update guardian.");
                    return;
                }

                setMessage("Guardian contact updated.");
                window.location.reload();
            } catch {
                setIsError(true);
                setMessage("Network error while saving guardian contact.");
            }
        });
    };

    const deleteGuardian = () => {
        if (!deleteTarget || isSaving) return;

        startSaving(async () => {
            setMessage(null);
            setIsError(false);

            try {
                const response = await fetch(`/api/guardians/${deleteTarget.id}`, { method: "DELETE" });
                const body = await response.json().catch(() => null);
                if (!response.ok) {
                    setIsError(true);
                    setMessage(body?.error ?? "Failed to delete guardian.");
                    return;
                }

                setMessage("Guardian contact deleted.");
                window.location.reload();
            } catch {
                setIsError(true);
                setMessage("Network error while deleting guardian contact.");
            }
        });
    };

    const columns: DataTableColumn<GuardianRow>[] = [
        {
            header: "Parent",
            cell: (row) => (
                <div>
                    <div className="font-medium text-foreground">{row.name || "No parent contact"}</div>
                    <div className="text-xs text-text-muted">{row.relationship}</div>
                </div>
            ),
        },
        {
            header: "Student",
            cell: (row) => (
                <div>
                    <div className="font-medium text-foreground">{row.studentName}</div>
                    <div className="text-xs text-text-muted">{row.matricNumber}</div>
                    <div className="text-xs text-text-muted">{row.department} · {row.faculty} · Level {row.level}</div>
                </div>
            ),
        },
        {
            header: "Contact",
            cell: (row) => (
                <div className="text-text-muted">
                    <div>{row.email ?? "No email"}</div>
                    <div>{row.phone ?? "No phone"}</div>
                </div>
            ),
            hideOnMobile: true,
        },
        {
            header: "Consent",
            cell: () => <span className="text-text-muted">Contact active</span>,
            hideOnMobile: true,
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full max-w-xl">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search parent name, matric number, email, phone..."
                        className="w-full rounded-full border border-input bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                    />
                </div>
                <div className="text-sm text-text-muted">
                    Showing <span className="font-medium text-foreground">{filteredGuardians.length}</span> contact(s)
                </div>
                <button
                    type="button"
                    onClick={openUploadModal}
                    className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
                >
                    <Upload className="h-4 w-4" />
                    Upload Contacts
                </button>
            </div>

            {message ? (
                <div className={`rounded-xl border px-4 py-3 text-sm ${isError ? "border-status-danger/30 bg-status-danger/10 text-status-danger" : "border-status-success/30 bg-status-success/10 text-status-success"}`}>
                    {message}
                </div>
            ) : null}

            <DataTable
                columns={columns}
                data={filteredGuardians}
                rowKey={(row) => row.id}
                emptyMessage="No contacts found."
                className="shadow-sm"
                rowAction={(row) => (
                    <div className="inline-flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => openEditor(row)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => setDeleteTarget(row)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-status-danger/30 bg-status-danger/10 px-3 py-1.5 text-xs font-medium text-status-danger transition-colors hover:bg-status-danger/15"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                        </button>
                    </div>
                )}
            />

            {/* ── Edit Modal ── */}
            <Modal
                isOpen={Boolean(selectedGuardian)}
                onClose={closeEditor}
                title="Edit Parent Contact"
                icon={<Edit3 className="h-5 w-5" />}
            >
                <div className="space-y-4">
                    <label className="block space-y-2 text-sm">
                        <span className="font-medium text-foreground">Parent name</span>
                        <input
                            value={editState.name}
                            onChange={(event) => setEditState((v) => ({ ...v, name: event.target.value }))}
                            className="w-full rounded-lg border border-border-subtle bg-surface-main px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        />
                    </label>

                    <label className="block space-y-2 text-sm">
                        <span className="font-medium text-foreground">Relationship</span>
                        <input
                            value={editState.relationship}
                            onChange={(event) => setEditState((v) => ({ ...v, relationship: event.target.value }))}
                            className="w-full rounded-lg border border-border-subtle bg-surface-main px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block space-y-2 text-sm">
                            <span className="font-medium text-foreground">Email</span>
                            <input
                                value={editState.email}
                                onChange={(event) => setEditState((v) => ({ ...v, email: event.target.value }))}
                                className="w-full rounded-lg border border-border-subtle bg-surface-main px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                            />
                        </label>
                        <label className="block space-y-2 text-sm">
                            <span className="font-medium text-foreground">Phone</span>
                            <input
                                value={editState.phone}
                                onChange={(event) => setEditState((v) => ({ ...v, phone: event.target.value }))}
                                className="w-full rounded-lg border border-border-subtle bg-surface-main px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                            />
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={closeEditor}
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={saveGuardian}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                        >
                            <Save className="h-4 w-4" />
                            {isSaving ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Delete Confirmation ── */}
            <ConfirmModal
                isOpen={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                onConfirm={deleteGuardian}
                title="Delete Parent Contact"
                description={
                    <span>
                        This will permanently remove <strong>{deleteTarget?.name}</strong> from {deleteTarget?.studentName}&apos;s contact list.
                    </span>
                }
                confirmText={isSaving ? "Deleting..." : "Delete Contact"}
                requiredWord="SEND"
                isDestructive
            />

            {/* ── Upload Modal ── */}
            <Modal
                isOpen={isUploadOpen}
                onClose={closeUploadModal}
                title="Upload Contacts"
                icon={<Upload className="h-5 w-5" />}
            >
                <div className="space-y-5">
                    <div className="space-y-2 text-sm text-text-muted">
                        <p>Upload a CSV to add or update parent contacts by matric number.</p>
                        <p>Only matric_number is required. If parent_name, parent_email, or parent_phone are missing, the student is still added with blank contact fields.</p>
                    </div>

                    <label className="block space-y-2 text-sm">
                        <span className="font-medium text-foreground">CSV file</span>
                        <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                            className="w-full rounded-lg border border-border-subtle bg-surface-main px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        />
                    </label>

                    {uploadError ? (
                        <div className="rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-sm text-status-danger flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4" />
                            <span>{uploadError}</span>
                        </div>
                    ) : null}

                    {uploadResult ? (
                        <div className="rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm text-status-success space-y-2">
                            <div className="flex items-center gap-2 font-medium">
                                <CheckCircle2 className="h-4 w-4" />
                                Upload complete
                            </div>
                            <p>Total rows: {uploadResult.totalRows}</p>
                            <p>Matched students: {uploadResult.matched}</p>
                            <p>Created contacts: {uploadResult.created}</p>
                            <p>Updated contacts: {uploadResult.updated}</p>
                            {uploadResult.unmatched.length > 0 ? (
                                <p>Unmatched matric numbers: {uploadResult.unmatched.join(", ")}</p>
                            ) : null}
                        </div>
                    ) : null}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={closeUploadModal}
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleUploadContacts}
                            disabled={!uploadFile || isUploading}
                            className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                        >
                            <Upload className="h-4 w-4" />
                            {isUploading ? "Uploading..." : "Upload Contacts"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
