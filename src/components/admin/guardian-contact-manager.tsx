"use client";

import { useMemo, useState, useTransition } from "react";
import { Edit3, Trash2, Search, Save, X } from "lucide-react";

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
};

type EditableGuardian = {
    name: string;
    relationship: string;
    email: string;
    phone: string;
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
                                        <div className="font-medium text-foreground">{guardian.name}</div>
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
                                        No parent contacts found.
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
        </div>
    );
}
