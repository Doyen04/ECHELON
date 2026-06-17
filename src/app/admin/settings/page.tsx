"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    AlertTriangle,
    Mail,
    MessageCircle,
    Phone,
    Plus,
    Save,
    ShieldAlert,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";

type Tab = "institution" | "templates" | "users" | "danger";

type MessageTemplates = {
    whatsapp: string;
    email: string;
    sms: string;
};

type InstitutionSettings = {
    id: string;
    name: string;
    logoUrl: string | null;
    contactEmail: string | null;
    gpaScale: string;
    messageTemplates: MessageTemplates | null;
};

type SettingsUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
};

const DEFAULT_TEMPLATES: MessageTemplates = {
    whatsapp:
        "Hello {{guardian_name}}, the {{semester}} results for {{student_name}} ({{matric_number}}) have been officially released.\n\nGPA: {{gpa}}\n\nView full details here: {{result_link}}",
    email:
        "Hello {{guardian_name}},\n\nThe {{semester}} results for {{student_name}} ({{matric_number}}) are now available.\n\nGPA: {{gpa}}\n\nClick below to view the full result:\n{{result_link}}\n\nRegards,\nRegistry Office",
    sms: "Results for {{student_name}} ({{matric_number}}) - {{semester}} GPA: {{gpa}}. View: {{result_link}}",
};

export default function SettingsPage() {
    const searchParams = useSearchParams();
    const defaultTab = (searchParams.get("tab") as Tab) || "institution";
    const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

    const [settings, setSettings] = useState<InstitutionSettings | null>(null);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/settings")
            .then((r) => r.json())
            .then((data) => {
                setSettings(data.institution ?? null);
                setLoadingSettings(false);
            })
            .catch(() => setLoadingSettings(false));
    }, []);

    const handleChange = useCallback((patch: Partial<InstitutionSettings>) => {
        setSettings((prev) => (prev ? { ...prev, ...patch } : null));
        setHasChanges(true);
        setSaveError(null);
    }, []);

    const handleTemplateChange = useCallback((channel: keyof MessageTemplates, value: string) => {
        setSettings((prev) => {
            if (!prev) return null;
            const current = prev.messageTemplates ?? DEFAULT_TEMPLATES;
            return { ...prev, messageTemplates: { ...current, [channel]: value } };
        });
        setHasChanges(true);
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        setSaveError(null);
        try {
            const res = await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: settings.name,
                    contactEmail: settings.contactEmail,
                    gpaScale: settings.gpaScale,
                    messageTemplates: settings.messageTemplates,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                setSaveError(data.error ?? "Failed to save");
            } else {
                setHasChanges(false);
            }
        } catch {
            setSaveError("Network error — please try again");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto w-full bg-background dashboard-root">
            <PageHeader
                title="Settings"
                action={
                    <div className="flex items-center gap-3">
                        {saveError && (
                            <span className="text-xs text-status-danger">{saveError}</span>
                        )}
                        <button
                            disabled={!hasChanges || isSaving}
                            onClick={handleSave}
                            className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="h-4 w-4" />
                            {isSaving ? "Saving…" : "Save Changes"}
                        </button>
                    </div>
                }
            />

            <div className="p-6 md:p-8 space-y-6 max-w-6xl w-full mx-auto">
                <div className="flex flex-col lg:flex-row gap-8 items-start dashboard-section">
                    <div className="w-full lg:w-64 shrink-0 rounded-xl border border-border-subtle bg-surface-main shadow-sm hidden lg:block overflow-hidden">
                        <nav className="flex flex-col">
                            <SidebarTab id="institution" label="Institution" active={activeTab === "institution"} onClick={() => setActiveTab("institution")} />
                            <SidebarTab id="templates" label="Notification Templates" active={activeTab === "templates"} onClick={() => setActiveTab("templates")} />
                            <SidebarTab id="users" label="Users & Roles" active={activeTab === "users"} onClick={() => setActiveTab("users")} />
                            <SidebarTab id="danger" label="Danger Zone" active={activeTab === "danger"} onClick={() => setActiveTab("danger")} isDanger />
                        </nav>
                    </div>

                    <div className="w-full lg:hidden flex overflow-x-auto border-b border-border-subtle no-scrollbar">
                        <MobileTab id="institution" label="Institution" active={activeTab === "institution"} onClick={() => setActiveTab("institution")} />
                        <MobileTab id="templates" label="Templates" active={activeTab === "templates"} onClick={() => setActiveTab("templates")} />
                        <MobileTab id="users" label="Users" active={activeTab === "users"} onClick={() => setActiveTab("users")} />
                        <MobileTab id="danger" label="Danger Zone" active={activeTab === "danger"} onClick={() => setActiveTab("danger")} isDanger />
                    </div>

                    <div className="flex-1 w-full relative">
                        {loadingSettings ? (
                            <div className="rounded-xl border border-border-subtle bg-surface-main p-8 text-sm text-text-muted">
                                Loading settings…
                            </div>
                        ) : (
                            <>
                                {activeTab === "institution" && (
                                    <InstitutionTab settings={settings} onChange={handleChange} />
                                )}
                                {activeTab === "templates" && (
                                    <TemplatesTab
                                        templates={settings?.messageTemplates ?? DEFAULT_TEMPLATES}
                                        onChange={handleTemplateChange}
                                    />
                                )}
                                {activeTab === "users" && <UsersTab />}
                                {activeTab === "danger" && <DangerTab />}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---- INSTITUTION TAB ---- //

function InstitutionTab({
    settings,
    onChange,
}: {
    settings: InstitutionSettings | null;
    onChange: (patch: Partial<InstitutionSettings>) => void;
}) {
    return (
        <div className="rounded-xl border border-border-subtle bg-surface-main shadow-sm page-transition-enter">
            <div className="p-6 border-b border-border-subtle">
                <h2 className="text-lg font-serif text-foreground">Institution Identity</h2>
                <p className="text-sm text-text-muted mt-1">Configure your branding and academic format settings.</p>
            </div>
            <div className="p-6 space-y-8">
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-foreground">Institution Logo</label>
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded border border-border-subtle bg-surface-subtle flex items-center justify-center p-2">
                            {settings?.logoUrl ? (
                                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-xs text-text-muted text-center">No logo set</div>
                            )}
                        </div>
                        <div className="flex-1 border-2 border-dashed border-border-subtle rounded-xl bg-surface-subtle/30 p-6 flex flex-col items-center justify-center hover:bg-surface-subtle/60 transition-colors cursor-pointer">
                            <UploadCloud className="h-6 w-6 text-text-muted mb-2" />
                            <div className="text-sm font-medium text-foreground">Upload new logo</div>
                            <div className="text-xs text-text-muted mt-1">PNG, JPG up to 2MB. Square recommended.</div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">Institution Name</label>
                        <input
                            type="text"
                            value={settings?.name ?? ""}
                            onChange={(e) => onChange({ name: e.target.value })}
                            className="w-full h-10 rounded-md border border-border-subtle bg-transparent px-3 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">GPA Scale</label>
                        <select
                            value={settings?.gpaScale ?? "5.0"}
                            onChange={(e) => onChange({ gpaScale: e.target.value })}
                            className="w-full h-10 rounded-md border border-border-subtle bg-transparent px-3 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                        >
                            <option value="5.0">5.0 Scale</option>
                            <option value="4.0">4.0 Scale</option>
                        </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-medium text-foreground">Default Contact Email</label>
                        <input
                            type="email"
                            value={settings?.contactEmail ?? ""}
                            onChange={(e) => onChange({ contactEmail: e.target.value })}
                            className="w-full h-10 rounded-md border border-border-subtle bg-transparent px-3 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                        />
                        <p className="text-xs text-text-muted">Shown in the parent portal footer for queries.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---- TEMPLATES TAB ---- //

const TEMPLATE_VARIABLES = [
    "{{guardian_name}}", "{{student_name}}", "{{matric_number}}",
    "{{session}}", "{{semester}}", "{{gpa}}", "{{cgpa}}", "{{result_link}}",
];

function TemplatesTab({
    templates,
    onChange,
}: {
    templates: MessageTemplates;
    onChange: (channel: keyof MessageTemplates, value: string) => void;
}) {
    const [subTab, setSubTab] = useState<keyof MessageTemplates>("whatsapp");

  return (
    <div className='rounded-xl border border-border-subtle bg-surface-main shadow-sm overflow-hidden page-transition-enter'>
      <div className='p-6 border-b border-border-subtle'>
        <h2 className='text-lg font-serif text-foreground'>
          Notification Templates
        </h2>
        <p className='text-sm text-text-muted mt-1'>
          Configure the automated messages sent to parents and guardians.
        </p>
      </div>

            <div className="flex border-b border-border-subtle bg-surface-subtle/30">
                {(["whatsapp", "email", "sms"] as const).map((ch) => (
                    <button
                        key={ch}
                        onClick={() => setSubTab(ch)}
                        className={`flex-1 flex justify-center items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${subTab === ch ? "border-brand text-foreground bg-white" : "border-transparent text-text-muted hover:text-foreground"}`}
                    >
                        {ch === "whatsapp" && <MessageCircle className="h-4 w-4" />}
                        {ch === "email" && <Mail className="h-4 w-4" />}
                        {ch === "sms" && <Phone className="h-4 w-4" />}
                        {ch.charAt(0).toUpperCase() + ch.slice(1)}
                    </button>
                ))}
            </div>

            <div className="p-6 space-y-6">
                {subTab === "whatsapp" && (
                    <div className="rounded-lg border border-(--color-warning)/40 bg-status-warning/10 p-4 flex gap-3 text-status-warning">
                        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                        <p className="text-sm">
                            <span className="font-semibold block mb-1">Meta Approval Required</span>
                            WhatsApp templates must be submitted to Meta for approval before use. The template body here is informational — the actual message is controlled by your approved Meta template.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-foreground">Message Body</label>
                            <button
                                className="text-xs text-brand hover:underline"
                                onClick={() => onChange(subTab, DEFAULT_TEMPLATES[subTab])}
                            >
                                Reset to default
                            </button>
                        </div>
                        <textarea
                            value={templates[subTab]}
                            onChange={(e) => onChange(subTab, e.target.value)}
                            className="w-full h-48 rounded-md border border-border-subtle bg-surface-subtle/30 p-3 text-sm font-mono focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none leading-relaxed"
                        />
                        <div className="space-y-2">
                            <div className="text-xs font-semibold uppercase tracking-widest text-text-muted">Available Variables</div>
                            <div className="flex flex-wrap gap-2">
                                {TEMPLATE_VARIABLES.map((v) => (
                                    <button
                                        key={v}
                                        className="bg-surface-subtle border border-border-subtle hover:border-brand text-text-muted text-xs font-mono px-2 py-1 rounded transition-colors"
                                        onClick={() => onChange(subTab, templates[subTab] + " " + v)}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-foreground">Preview</label>
                        <div className={`rounded-xl border border-border-subtle p-4 text-sm leading-relaxed whitespace-pre-wrap ${subTab === "whatsapp" ? "bg-[#e1f5c4]/30" : "bg-surface-subtle/20"}`}>
                            {templates[subTab]
                                .replace("{{guardian_name}}", "Mrs. Folake")
                                .replace("{{student_name}}", "John Adeyemi")
                                .replace("{{matric_number}}", "CSC/2021/001")
                                .replace("{{semester}}", "First Semester 2024/2025")
                                .replace("{{session}}", "2024/2025")
                                .replace("{{gpa}}", "4.21")
                                .replace("{{cgpa}}", "4.10")
                                .replace("{{result_link}}", "https://results.university.edu.ng/view?token=abc123")}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---- USERS TAB ---- //

function UsersTab() {
    const [users, setUsers] = useState<SettingsUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "super_admin" });
    const [addError, setAddError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    const load = () => {
        fetch("/api/settings/users")
            .then((r) => r.json())
            .then((d) => { setUsers(d.users ?? []); setLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);
        setAddError(null);
        const res = await fetch("/api/settings/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
            setAddError(data.error ?? "Failed to create user");
        } else {
            setShowAddForm(false);
            setForm({ name: "", email: "", password: "", role: "super_admin" });
            load();
        }
        setIsAdding(false);
    };

    const handleRemove = async (id: string) => {
        if (!confirm("Remove this user? They will lose all access immediately.")) return;
        const res = await fetch(`/api/settings/users/${id}`, { method: "DELETE" });
        if (res.ok) load();
    };

    return (
        <div className="rounded-xl border border-border-subtle bg-surface-main shadow-sm overflow-hidden page-transition-enter">
            <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-serif text-foreground">System Users</h2>
                    <p className="text-sm text-text-muted mt-1">Manage who has access to the admin dashboard.</p>
                </div>
                <button
                    onClick={() => setShowAddForm((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-hover transition-colors"
                >
                    {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {showAddForm ? "Cancel" : "Add User"}
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleAdd} className="p-6 border-b border-border-subtle bg-surface-subtle/30 space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">New User</h3>
                    {addError && <p className="text-xs text-status-danger">{addError}</p>}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-text-muted">Full Name</label>
                            <input
                                required
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                className="w-full h-9 rounded-md border border-border-subtle bg-transparent px-3 text-sm outline-none focus:border-brand"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-text-muted">Email</label>
                            <input
                                required
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                className="w-full h-9 rounded-md border border-border-subtle bg-transparent px-3 text-sm outline-none focus:border-brand"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-text-muted">Password</label>
                            <input
                                required
                                type="password"
                                minLength={8}
                                value={form.password}
                                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                className="w-full h-9 rounded-md border border-border-subtle bg-transparent px-3 text-sm outline-none focus:border-brand"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-text-muted">Role</label>
                            <select
                                value={form.role}
                                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                                className="w-full h-9 rounded-md border border-border-subtle bg-transparent px-3 text-sm outline-none focus:border-brand"
                            >
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isAdding}
                        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                        {isAdding ? "Creating…" : "Create User"}
                    </button>
                </form>
            )}

            {loading ? (
                <div className="p-6 text-sm text-text-muted">Loading…</div>
            ) : (
                <table className="min-w-full divide-y divide-border-subtle">
                    <thead className="bg-surface-subtle/40">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Name & Email</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle bg-surface-main">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-foreground">{user.name}</div>
                                    <div className="text-sm text-text-muted">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex rounded-full bg-[#B8860B] px-2 py-0.5 text-xs font-medium text-white capitalize">
                                        {user.role.replace(/_/g, " ")}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button
                                        onClick={() => handleRemove(user.id)}
                                        className="text-sm text-status-danger hover:underline"
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-sm text-text-muted text-center">No users found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}

// ---- DANGER TAB ---- //

function DangerTab() {
    const [isResetting, setIsResetting] = useState(false);
    const [resetMsg, setResetMsg] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleResetLogs = async () => {
        if (!confirm("Permanently delete all notification logs? This cannot be undone.")) return;
        setIsResetting(true);
        setResetMsg(null);
        const res = await fetch("/api/settings/reset-logs", { method: "POST" });
        const data = await res.json();
        setResetMsg(res.ok ? `Deleted ${data.deleted} log entries.` : (data.error ?? "Failed"));
        setIsResetting(false);
    };

    const handleExport = async () => {
        setIsExporting(true);
        const res = await fetch("/api/settings/export");
        if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `dispatch-export-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
        setIsExporting(false);
    };

    return (
        <div className="rounded-xl border border-status-danger/50 bg-surface-main shadow-sm overflow-hidden page-transition-enter">
            <div className="p-6 border-b border-status-danger/20 bg-status-danger/5">
                <h2 className="text-lg font-serif text-status-danger flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" /> Danger Zone
                </h2>
                <p className="text-sm text-status-danger/80 mt-1">Destructive actions and system-wide resets.</p>
            </div>

            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-border-subtle">
                    <div>
                        <div className="font-medium text-foreground">Export completely</div>
                        <div className="text-sm text-text-muted mt-1">Download a unified CSV of all dispatch logs across the system.</div>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="shrink-0 rounded px-4 py-2 border border-border-subtle text-sm font-medium hover:bg-surface-subtle disabled:opacity-50"
                    >
                        {isExporting ? "Exporting…" : "Export All Data"}
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                    <div>
                        <div className="font-medium text-status-danger">Reset notification logs</div>
                        <div className="text-sm text-text-muted mt-1">Permanently delete all delivery logs. Student records are not affected.</div>
                        {resetMsg && <p className="text-xs mt-1 text-text-muted">{resetMsg}</p>}
                    </div>
                    <button
                        onClick={handleResetLogs}
                        disabled={isResetting}
                        className="shrink-0 rounded px-4 py-2 bg-status-danger text-white text-sm font-medium hover:bg-red-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Trash2 className="h-4 w-4" />
                        {isResetting ? "Resetting…" : "Reset Logs"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---- NAV COMPONENTS ---- //

function SidebarTab({ id, label, active, onClick, isDanger }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center px-4 py-3 text-sm font-medium text-left border-l-4 transition-colors ${
                active
                    ? isDanger
                        ? "border-status-danger bg-status-danger/5 text-status-danger"
                        : "border-brand bg-surface-subtle/50 text-brand"
                    : "border-transparent text-text-muted hover:bg-surface-subtle/30 hover:text-foreground"
            }`}
        >
            {label}
        </button>
    );
}

function MobileTab({ id, label, active, onClick, isDanger }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                active
                    ? isDanger
                        ? "border-status-danger text-status-danger"
                        : "border-brand text-brand"
                    : "border-transparent text-text-muted hover:text-foreground"
            }`}
        >
            {label}
        </button>
    );
}
