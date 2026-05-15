"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Edit3, Trash2, Search, Save, Upload, X, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-md xl:max-w-xl">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by parent name, matric number, email..."
                        className="w-full h-11 rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-sidebar-primary/50 focus:ring-1 focus:ring-sidebar-primary/20"
                    />
                </div>
                
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:text-xs">
                        <span className="text-foreground">{filteredGuardians.length}</span> Records
                    </div>
                    <Button
                        type="button"
                        onClick={openUploadModal}
                        className="h-10 gap-2 rounded-xl bg-sidebar-primary px-5 text-sm font-bold sm:w-auto"
                    >
                        <Upload className="h-4 w-4" />
                        <span className="hidden sm:inline">Import CSV</span>
                        <span className="sm:hidden">Import</span>
                    </Button>
                </div>
            </div>

            {message ? (
                <div className={cn(
                    "rounded-xl border px-4 py-3 text-sm font-medium animate-in slide-in-from-top-2",
                    isError ? "border-destructive/20 bg-destructive/5 text-destructive" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-700"
                )}>
                    {message}
                </div>
            ) : null}

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Parent</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Student Linked</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contact Detail</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Manage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredGuardians.map((guardian) => (
                                <tr key={guardian.id} className="group transition-colors hover:bg-muted/20">
                                    <td className="px-6 py-5 align-top">
                                        <div className="text-sm font-bold text-foreground leading-none">
                                            {guardian.name || "N/A"}
                                        </div>
                                        <div className="mt-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-tight">
                                            {guardian.relationship}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 align-top">
                                        <div className="text-sm font-bold text-foreground leading-none">
                                            {guardian.studentName}
                                        </div>
                                        <div className="mt-1.5 flex flex-col gap-0.5">
                                            <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-tighter">
                                                {guardian.matricNumber}
                                            </div>
                                            <div className="text-[10px] font-bold text-muted-foreground/70 uppercase">
                                                {guardian.department} · LVL {guardian.level}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 align-top">
                                        <div className="space-y-1">
                                            <div className="text-[11px] font-medium text-foreground truncate max-w-45">
                                                {guardian.email ?? "No email address"}
                                            </div>
                                            <div className="text-[11px] font-medium text-muted-foreground">
                                                {guardian.phone ?? "No phone number"}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 align-top">
                                        <Badge variant="outline" className="h-5 rounded-md px-1.5 text-[9px] font-bold uppercase tracking-tight bg-emerald-500/5 text-emerald-700 border-emerald-500/20">
                                            Verified
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-5 align-top text-right">
                                        <div className="inline-flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEditor(guardian)}
                                                className="h-8 w-8 p-0 rounded-md"
                                            >
                                                <Edit3 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setDeleteTarget(guardian)}
                                                className="h-8 w-8 p-0 rounded-md text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card List View */}
            <div className="grid gap-4 md:hidden">
                {filteredGuardians.map((guardian) => (
                    <div key={guardian.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">Parent</div>
                                <div className="text-sm font-bold text-foreground">{guardian.name || "N/A"}</div>
                                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight">{guardian.relationship}</div>
                            </div>
                            <Badge variant="outline" className="h-5 rounded-md px-1.5 text-[9px] font-bold uppercase tracking-tight bg-emerald-500/5 text-emerald-700 border-emerald-500/20">
                                Verified
                            </Badge>
                        </div>

                        <div className="space-y-1 pt-3 border-t border-border/50">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">Student Linked</div>
                            <div className="text-sm font-bold text-foreground">{guardian.studentName}</div>
                            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                <span className="font-mono uppercase tracking-tighter">{guardian.matricNumber}</span>
                                <span>·</span>
                                <span className="uppercase">{guardian.department}</span>
                            </div>
                        </div>

                        <div className="space-y-1 pt-3 border-t border-border/50">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">Contact Details</div>
                            <div className="text-[11px] font-medium text-foreground">{guardian.email ?? "No email"}</div>
                            <div className="text-[11px] font-medium text-muted-foreground">{guardian.phone ?? "No phone"}</div>
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openEditor(guardian)}
                                className="h-9 flex-1 gap-2 rounded-xl text-[11px] font-bold uppercase tracking-tight"
                            >
                                <Edit3 className="h-3.5 w-3.5" />
                                Edit
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteTarget(guardian)}
                                className="h-9 flex-1 gap-2 rounded-xl text-[11px] font-bold uppercase tracking-tight text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredGuardians.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border border-dashed">
                    <Search className="h-8 w-8 text-muted-foreground/30" />
                    <p className="mt-2 text-sm font-medium text-muted-foreground">No contacts found matching your search.</p>
                </div>
            ) : null}

            <Modal
                isOpen={Boolean(selectedGuardian)}
                onClose={closeEditor}
                title="Edit Parent Contact"
                icon={<Edit3 className="h-5 w-5" />}
                size="lg"
            >
                <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Parent Name</label>
                            <Input
                                value={editState.name}
                                onChange={(event) => setEditState((value) => ({ ...value, name: event.target.value }))}
                                placeholder="Full Name"
                                className="h-10 rounded-xl bg-muted/30"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Relationship</label>
                            <Input
                                value={editState.relationship}
                                onChange={(event) => setEditState((value) => ({ ...value, relationship: event.target.value }))}
                                placeholder="e.g. Mother, Father"
                                className="h-10 rounded-xl bg-muted/30"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
                            <Input
                                value={editState.email}
                                onChange={(event) => setEditState((value) => ({ ...value, email: event.target.value }))}
                                placeholder="email@example.com"
                                className="h-10 rounded-xl bg-muted/30"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone Number</label>
                            <Input
                                value={editState.phone}
                                onChange={(event) => setEditState((value) => ({ ...value, phone: event.target.value }))}
                                placeholder="+234..."
                                className="h-10 rounded-xl bg-muted/30"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={closeEditor}
                            className="rounded-xl text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={saveGuardian}
                            disabled={isSaving}
                            className="rounded-xl bg-sidebar-primary min-w-30 font-bold shadow-md shadow-sidebar-primary/20"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                onConfirm={deleteGuardian}
                title="Delete Contact"
                description={
                    <div className="space-y-2">
                        <p>Are you sure you want to permanently remove <span className="font-bold text-foreground">{deleteTarget?.name}</span>?</p>
                        <p className="text-xs">This record is linked to student <span className="font-medium text-foreground">{deleteTarget?.studentName}</span> ({deleteTarget?.matricNumber}).</p>
                    </div>
                }
                confirmText={isSaving ? "Deleting..." : "Delete Contact"}
                requiredWord="DELETE"
                isDestructive
            />

            <Modal
                isOpen={isUploadOpen}
                onClose={closeUploadModal}
                title="Import Contacts"
                icon={<Upload className="h-5 w-5" />}
                size="lg"
            >
                <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-foreground">CSV Format Guide</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Upload a CSV with <span className="font-bold text-foreground">matric_number</span> to match students. 
                            You can also include <span className="italic">parent_name, parent_email,</span> and <span className="italic">parent_phone</span> to update their records.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select CSV File</label>
                        <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                            className="flex h-11 w-full rounded-xl border border-input bg-muted/30 px-3 py-2 text-sm text-foreground file:border-0 file:bg-transparent file:text-sm file:font-bold file:text-sidebar-primary"
                        />
                    </div>

                    {uploadError ? (
                        <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive font-medium animate-in slide-in-from-top-2">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>{uploadError}</span>
                        </div>
                    ) : null}

                    {uploadResult ? (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4 text-sm text-emerald-700 space-y-3 animate-in zoom-in-95">
                            <div className="flex items-center gap-2 font-bold uppercase tracking-tight">
                                <CheckCircle2 className="h-4 w-4" />
                                Import Summary
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                                <p>Matched: <span className="font-bold text-emerald-800">{uploadResult.matched}</span></p>
                                <p>Created: <span className="font-bold text-emerald-800">{uploadResult.created}</span></p>
                                <p>Updated: <span className="font-bold text-emerald-800">{uploadResult.updated}</span></p>
                            </div>
                            {uploadResult.unmatched.length > 0 ? (
                                <div className="pt-2 border-t border-emerald-500/10">
                                    <p className="font-bold uppercase tracking-tighter text-[10px] opacity-70">Unmatched Matric Numbers</p>
                                    <p className="mt-1 font-mono text-[10px]">{uploadResult.unmatched.join(", ")}</p>
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={closeUploadModal}
                            className="rounded-xl text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleUploadContacts}
                            disabled={!uploadFile || isUploading}
                            className="rounded-xl bg-sidebar-primary min-w-35 font-bold shadow-md shadow-sidebar-primary/20"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {isUploading ? "Importing..." : "Start Import"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
