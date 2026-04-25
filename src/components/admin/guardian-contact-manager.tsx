"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Edit3, Trash2, Search, Save, Upload, X, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Modal, ConfirmModal } from "@/components/ui/modal";

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
    studentsWithoutContacts: Array<{
        id: string;
        fullName: string;
        matricNumber: string;
        department: string;
        faculty: string;
        level: number;
    }>;
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

export function GuardianContactManager({ guardians, studentsWithoutContacts }: GuardianContactManagerProps) {
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
        if (!normalized) {
            return guardians;
        }

        return guardians.filter((guardian) => {
            return [
                guardian.name,
                guardian.relationship,
                guardian.email ?? "",
                guardian.phone ?? "",
                guardian.matricNumber,
                guardian.studentName,
                guardian.department,
            ]
                .join(" ")
                .toLowerCase()
                .includes(normalized);
        });
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
        if (isUploading) {
            return;
        }

        setIsUploadOpen(false);
        setUploadFile(null);
        setUploadResult(null);
        setUploadError(null);
    };

    const handleUploadContacts = async () => {
        if (!uploadFile || isUploading) {
            return;
        }

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
        if (!selectedGuardian || isSaving) {
            return;
        }

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
        if (!deleteTarget || isSaving) {
            return;
        }

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

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-status-warning/30 bg-status-warning/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">Students without parent contact</h2>
                        <p className="mt-1 text-sm text-text-muted">
                            These students have no guardian record yet and will be skipped during retry checks.
                        </p>
                    </div>
                    <Badge variant="warning" className="rounded-full">
                        {studentsWithoutContacts.length}
                    </Badge>
                </div>

                <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
                    {studentsWithoutContacts.length > 0 ? (
                        studentsWithoutContacts.map((student) => (
                            <article
                                key={student.id}
                                className="rounded-xl border border-border-subtle bg-surface-main px-4 py-3 shadow-sm"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-medium text-foreground">{student.fullName}</p>
                                        <p className="text-xs text-text-muted">{student.matricNumber}</p>
                                    </div>
                                    <p className="text-xs text-text-muted">Level {student.level}</p>
                                </div>
                                <p className="mt-2 text-xs text-text-muted">
                                    {student.department} · {student.faculty}
                                </p>
                            </article>
                        ))
                    ) : (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
                            All students currently have at least one parent contact.
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full max-w-xl">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search parent name, matric number, email, phone..."
                        className="w-full rounded-xl border border-border-subtle bg-surface-main py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                </div>
                <div className="text-sm text-text-muted">
                    Showing <span className="font-medium text-foreground">{filteredGuardians.length}</span> contact(s)
                </div>
                <button
                    type="button"
                    onClick={openUploadModal}
                    className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
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

            <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-main shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border-subtle">
                        <thead className="bg-surface-subtle/40">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Parent</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Student</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Contact</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Consent</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {filteredGuardians.map((guardian) => (
                                <tr key={guardian.id} className="hover:bg-surface-subtle/30">
                                    <td className="px-5 py-4 align-top">
                                        <div className="font-medium text-foreground">{guardian.name || "No parent contact"}</div>
                                        <div className="text-xs text-text-muted">{guardian.relationship}</div>
                                    </td>
                                    <td className="px-5 py-4 align-top">
                                        <div className="font-medium text-foreground">{guardian.studentName}</div>
                                        <div className="text-xs text-text-muted">{guardian.matricNumber}</div>
                                        <div className="text-xs text-text-muted">{guardian.department} · {guardian.faculty} · Level {guardian.level}</div>
                                    </td>
                                    <td className="px-5 py-4 align-top text-sm text-text-muted">
                                        <div>{guardian.email ?? "No email"}</div>
                                        <div>{guardian.phone ?? "No phone"}</div>
                                    </td>
                                    <td className="px-5 py-4 align-top text-sm text-text-muted">
                                        Contact active
                                    </td>
                                    <td className="px-5 py-4 align-top text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditor(guardian)}
                                                className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-surface-main px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-subtle"
                                            >
                                                <Edit3 className="h-4 w-4" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteTarget(guardian)}
                                                className="inline-flex items-center gap-2 rounded-md border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm font-medium text-status-danger transition-colors hover:bg-status-danger/15"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredGuardians.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-text-muted">
                                        No contacts found.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>

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
                            onChange={(event) => setEditState((value) => ({ ...value, name: event.target.value }))}
                            className="w-full rounded-lg border border-border-subtle bg-surface-main px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        />
                    </label>

                    <label className="block space-y-2 text-sm">
                        <span className="font-medium text-foreground">Relationship</span>
                        <input
                            value={editState.relationship}
                            onChange={(event) => setEditState((value) => ({ ...value, relationship: event.target.value }))}
                            className="w-full rounded-lg border border-border-subtle bg-surface-main px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block space-y-2 text-sm">
                            <span className="font-medium text-foreground">Email</span>
                            <input
                                value={editState.email}
                                onChange={(event) => setEditState((value) => ({ ...value, email: event.target.value }))}
                                className="w-full rounded-lg border border-border-subtle bg-surface-main px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                            />
                        </label>
                        <label className="block space-y-2 text-sm">
                            <span className="font-medium text-foreground">Phone</span>
                            <input
                                value={editState.phone}
                                onChange={(event) => setEditState((value) => ({ ...value, phone: event.target.value }))}
                                className="w-full rounded-lg border border-border-subtle bg-surface-main px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                            />
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={closeEditor}
                            className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-surface-main px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-subtle"
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={saveGuardian}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <Save className="h-4 w-4" />
                            {isSaving ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                onConfirm={deleteGuardian}
                title="Delete Parent Contact"
                description={
                    <span>
                        This will permanently remove <strong>{deleteTarget?.name}</strong> from {deleteTarget?.studentName}'s contact list.
                    </span>
                }
                confirmText={isSaving ? "Deleting..." : "Delete Contact"}
                requiredWord="SEND"
                isDestructive
            />

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
                            className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-surface-main px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-subtle"
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleUploadContacts}
                            disabled={!uploadFile || isUploading}
                            className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
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
