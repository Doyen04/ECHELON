"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Save, UploadCloud, AlertTriangle, MessageCircle, Mail, Phone, Plus, Trash2, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import type { DataTableColumn } from "@/components/ui/data-table";
import { ExportButton } from "@/components/admin/export-button";

type Tab = "institution" | "templates" | "users" | "danger";

type UserRow = {
    id: string;
    name: string;
    email: string;
    role: string;
    roleColor: string;
    active: boolean;
};

const usersData: UserRow[] = [
    { id: "1", name: "System Admin", email: "admin@university.edu.ng", role: "Super Admin", roleColor: "bg-[#B8860B]", active: true },
    { id: "2", name: "Prof. A. Okoye", email: "senate@university.edu.ng", role: "Senate Officer", roleColor: "bg-teal-600", active: true },
    { id: "3", name: "Registrar Adeyemi", email: "registry@university.edu.ng", role: "Registrar", roleColor: "bg-slate-600", active: true },
];

export default function SettingsPage() {
    const searchParams = useSearchParams();
    const defaultTab = (searchParams.get("tab") as Tab) || "institution";
    const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
    const [hasChanges, setHasChanges] = useState(false);

    return (
        <div className="flex flex-col h-full overflow-y-auto w-full bg-background dashboard-root">
            <PageHeader
                title="Settings"
                action={
                    <Button
                        disabled={!hasChanges}
                        onClick={() => setHasChanges(false)}
                        className="inline-flex items-center gap-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="h-4 w-4" />
                        Save Changes
                    </Button>
                }
            />

            <div className="p-6 md:p-8 space-y-6 max-w-6xl w-full mx-auto">
                <div className="flex flex-col lg:flex-row gap-8 items-start dashboard-section">

                    {/* Vertical Tabs */}
                    <Card className="w-full lg:w-64 shrink-0 rounded-xl shadow-sm hidden lg:block overflow-hidden">
                        <nav className="flex flex-col">
                            <SidebarTab id="institution" label="Institution" active={activeTab === "institution"} onClick={() => setActiveTab("institution")} />
                            <SidebarTab id="templates" label="Notification Templates" active={activeTab === "templates"} onClick={() => setActiveTab("templates")} />
                            <SidebarTab id="users" label="Users & Roles" active={activeTab === "users"} onClick={() => setActiveTab("users")} />
                            <SidebarTab id="danger" label="Danger Zone" active={activeTab === "danger"} onClick={() => setActiveTab("danger")} isDanger />
                        </nav>
                    </Card>

                    {/* Mobile Tabs */}
                    <div className="w-full lg:hidden flex overflow-x-auto border-b border-border-subtle no-scrollbar">
                        <MobileTab id="institution" label="Institution" active={activeTab === "institution"} onClick={() => setActiveTab("institution")} />
                        <MobileTab id="templates" label="Templates" active={activeTab === "templates"} onClick={() => setActiveTab("templates")} />
                        <MobileTab id="users" label="Users" active={activeTab === "users"} onClick={() => setActiveTab("users")} />
                        <MobileTab id="danger" label="Danger Zone" active={activeTab === "danger"} onClick={() => setActiveTab("danger")} isDanger />
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 w-full relative">
                        {activeTab === "institution" && <InstitutionTab onChange={() => setHasChanges(true)} />}
                        {activeTab === "templates" && <TemplatesTab onChange={() => setHasChanges(true)} />}
                        {activeTab === "users" && <UsersTab />}
                        {activeTab === "danger" && <DangerTab />}
                    </div>

                </div>
            </div>
        </div>
    );
}

// ---- TABS LAYOUT COMPONENTS ---- //

function InstitutionTab({ onChange }: { onChange: () => void }) {
    return (
        <Card className="rounded-xl shadow-sm page-transition-enter">
            <div className="p-6 border-b border-border-subtle">
                <h2 className="text-lg font-serif text-foreground">Institution Identity</h2>
                <p className="text-sm text-text-muted mt-1">Configure your branding and academic format settings.</p>
            </div>
            <div className="p-6 space-y-8">
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-foreground">Institution Logo</label>
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded border border-border-subtle bg-surface-subtle flex items-center justify-center p-2">
                            <div className="text-xs text-text-muted text-center">No logo set</div>
                        </div>
                        <div className="flex-1 border-2 border-dashed border-border-subtle rounded-xl bg-surface-subtle/30 p-6 flex flex-col items-center justify-center hover:bg-surface-subtle/60 transition-colors cursor-pointer" onClick={onChange}>
                            <UploadCloud className="h-6 w-6 text-text-muted mb-2" />
                            <div className="text-sm font-medium text-foreground">Upload new logo</div>
                            <div className="text-xs text-text-muted mt-1">PNG, JPG up to 2MB. Square recommended.</div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">Institution Name</label>
                        <input type="text" defaultValue="University of Technology" className="w-full h-10 rounded-md border border-border-subtle bg-transparent px-3 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" onChange={onChange} />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">GPA Scale</label>
                        <select className="w-full h-10 rounded-md border border-border-subtle bg-transparent px-3 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" onChange={onChange}>
                            <option value="5.0">5.0 Scale</option>
                            <option value="4.0">4.0 Scale</option>
                        </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-medium text-foreground">Default Contact Email</label>
                        <input type="email" defaultValue="registry@university.edu.ng" className="w-full h-10 rounded-md border border-border-subtle bg-transparent px-3 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" onChange={onChange} />
                        <p className="text-xs text-text-muted">This will be shown in the footer of the parent portal for queries.</p>
                    </div>
                </div>
            </div>
        </Card>
    )
}

function TemplatesTab({ onChange }: { onChange: () => void }) {
    const [subTab, setSubTab] = useState<"whatsapp" | "email" | "sms">("whatsapp");
    const [template, setTemplate] = useState("Hello {{guardian_name}}, the {{semester}} results for {{student_name}} ({{matric_number}}) have been officially released.\n\nGPA: {{gpa}}\n\nView full details here: {{result_link}}");

    const handleTemplateChange = (e: any) => {
        setTemplate(e.target.value);
        onChange();
    };

    return (
        <Card className="rounded-xl shadow-sm overflow-hidden page-transition-enter">
            <div className="p-6 border-b border-border-subtle">
                <h2 className="text-lg font-serif text-foreground">Notification Templates</h2>
                <p className="text-sm text-text-muted mt-1">Customize the messages sent to parents. Use brackets for dynamic data.</p>
            </div>

            <div className="flex border-b border-border-subtle bg-surface-subtle/30">
                <button onClick={() => setSubTab("whatsapp")} className={`flex-1 flex justify-center items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${subTab === 'whatsapp' ? 'border-brand text-foreground bg-background' : 'border-transparent text-text-muted hover:text-foreground'}`}>
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                </button>
                <button onClick={() => setSubTab("email")} className={`flex-1 flex justify-center items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${subTab === 'email' ? 'border-brand text-foreground bg-background' : 'border-transparent text-text-muted hover:text-foreground'}`}>
                    <Mail className="h-4 w-4" /> Email
                </button>
                <button onClick={() => setSubTab("sms")} className={`flex-1 flex justify-center items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${subTab === 'sms' ? 'border-brand text-foreground bg-background' : 'border-transparent text-text-muted hover:text-foreground'}`}>
                    <Phone className="h-4 w-4" /> SMS
                </button>
            </div>

            <div className="p-6 space-y-6">
                {subTab === "whatsapp" && (
                    <div className="rounded-lg border border-(--color-warning)/40 bg-status-warning/10 p-4 flex gap-3 text-status-warning">
                        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                        <p className="text-sm">
                            <span className="font-semibold block mb-1">Meta Approval Required</span>
                            WhatsApp templates must be submitted to Meta for approval before use. Changes here do not auto-update your Meta template — manual re-submission in your provider dashboard is required to avoid delivery failures.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-foreground">Message Body</label>
                            <button className="text-xs text-brand hover:underline" onClick={() => { onChange(); }}>Reset to default</button>
                        </div>

                        <textarea
                            value={template}
                            onChange={handleTemplateChange}
                            className="w-full h-48 rounded-md border border-border-subtle bg-surface-subtle/30 p-3 text-sm font-mono focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none leading-relaxed"
                        />

                        <div className="space-y-2">
                            <div className="text-xs font-semibold uppercase tracking-widest text-text-muted">Available Variables</div>
                            <div className="flex flex-wrap gap-2">
                                {["{{guardian_name}}", "{{student_name}}", "{{matric_number}}", "{{session}}", "{{semester}}", "{{gpa}}", "{{cgpa}}", "{{result_link}}"].map(v => (
                                    <button key={v} className="bg-surface-subtle border border-border-subtle hover:border-brand text-text-muted text-xs font-mono px-2 py-1 rounded transition-colors" onClick={() => { setTemplate(prev => prev + " " + v); onChange(); }}>
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-foreground">Preview</label>
                        <div className={`rounded-xl border border-border-subtle p-4 text-sm leading-relaxed ${subTab === 'whatsapp' ? 'bg-[#e1f5c4]/30' : 'bg-surface-subtle/20'}`}>
                            Hello <span className="font-medium text-blue-600">Mrs. Folake</span>, the <span className="font-medium text-blue-600">First Semester</span> results for <span className="font-medium text-blue-600">John Adeyemi</span> (<span className="font-medium text-blue-600">CSC/2021/001</span>) have been officially released.<br /><br />
                            GPA: <span className="font-medium text-blue-600">4.21</span><br /><br />
                            View full details here: <span className="text-blue-500 underline break-all">https://results.university.edu.ng/view?token=abc123xyz</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    )
}

function UsersTab() {
    const userColumns: DataTableColumn<UserRow>[] = [
        {
            header: "Name & Email",
            cell: (row) => (
                <div>
                    <div className="font-medium text-foreground">{row.name}</div>
                    <div className="text-sm text-text-muted">{row.email}</div>
                </div>
            ),
        },
        {
            header: "Role",
            cell: (row) => (
                <span className={`inline-flex rounded-full ${row.roleColor} px-2.5 py-0.5 text-xs font-medium text-white`}>
                    {row.role}
                </span>
            ),
        },
        {
            header: "Status",
            cell: (row) => (
                <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                    <span className={`w-2 h-2 rounded-full ${row.active ? "bg-status-success" : "bg-muted"}`} />
                    {row.active ? "Active" : "Inactive"}
                </span>
            ),
            hideOnMobile: true,
        },
    ];

    return (
        <Card className="rounded-xl shadow-sm overflow-hidden page-transition-enter">
            <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-serif text-foreground">System Users</h2>
                    <p className="text-sm text-text-muted mt-1">Manage who has access to the admin dashboard.</p>
                </div>
                <Button className="inline-flex items-center gap-2 rounded-full">
                    <Plus className="h-4 w-4" /> Add User
                </Button>
            </div>

            <DataTable
                columns={userColumns}
                data={usersData}
                rowKey={(row) => row.id}
                emptyMessage="No users found."
                className="border-0 rounded-none shadow-none"
                rowAction={() => (
                    <button className="text-sm text-text-muted hover:text-foreground transition-colors">Edit</button>
                )}
            />
        </Card>
    )
}

function DangerTab() {
    return (
        <Card className="rounded-xl border border-status-danger/50 shadow-sm overflow-hidden page-transition-enter">
            <div className="p-6 border-b border-status-danger/20 bg-status-danger/5">
                <h2 className="text-lg font-serif text-status-danger flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Danger Zone</h2>
                <p className="text-sm text-status-danger/80 mt-1">Destructive actions and system-wide resets.</p>
            </div>

            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-border-subtle">
                    <div>
                        <div className="font-medium text-foreground">Export completely</div>
                        <div className="text-sm text-text-muted mt-1">Download a unified CSV of all uploaded results, approvals, and logs across the system.</div>
                    </div>
                    <ExportButton
                        endpoint="/api/settings/export-all"
                        filename={`full-export-${new Date().toISOString().split('T')[0]}.zip`}
                        label="Export All Data"
                    />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                    <div>
                        <div className="font-medium text-status-danger">Reset notification logs</div>
                        <div className="text-sm text-text-muted mt-1">Permanently delete all delivery logs. Student results and contacts are not affected.</div>
                    </div>
                    <Button variant="destructive" className="shrink-0 rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2">
                        <Trash2 className="h-4 w-4" /> Reset Logs
                    </Button>
                </div>
            </div>
        </Card>
    )
}


function SidebarTab({ id, label, active, onClick, isDanger }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center px-4 py-3 text-sm font-medium text-left border-l-4 transition-colors ${active
                ? isDanger ? "border-status-danger bg-status-danger/5 text-status-danger" : "border-brand bg-surface-subtle/50 text-brand"
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
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${active
                ? isDanger ? "border-status-danger text-status-danger" : "border-brand text-brand"
                : "border-transparent text-text-muted hover:text-foreground"
                }`}
        >
            {label}
        </button>
    );
}
