"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Save,
  Mail,
  Phone,
  Trash2,
  ShieldAlert,
  BellRing,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tab = "templates" | "danger";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const defaultTab = (searchParams.get("tab") as Tab) || "templates";
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [hasChanges, setHasChanges] = useState(false);

  const tabs = [
    { id: "templates", label: "Notification Layouts", icon: BellRing },

    {
      id: "danger",
      label: "System Control",
      icon: ShieldAlert,
      isDanger: true,
    },
  ];

  return (
    <div className='flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-background'>
      <PageHeader
        title='System Settings'
        action={
          <Button
            disabled={!hasChanges}
            onClick={() => setHasChanges(false)}
            className='rounded-xl gap-2 bg-sidebar-primary '
          >
            <Save className='h-4 w-4' />
            Save Changes
          </Button>
        }
      />

      <main className='mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
        <div className='flex flex-col lg:flex-row gap-8 items-start'>
          {/* Sidebar Navigation */}
          <Card className='w-full lg:w-72 shrink-0 rounded-xl border-border bg-card p-2 hidden lg:block'>
            <nav className='space-y-1'>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-all",
                    activeTab === tab.id
                      ? tab.isDanger
                        ? "bg-destructive/5 text-destructive border border-destructive/20"
                        : "bg-muted text-foreground border border-border"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <tab.icon
                    className={cn(
                      "h-4 w-4",
                      activeTab === tab.id ? "" : "opacity-70",
                    )}
                  />
                  {tab.label}
                </button>
              ))}
            </nav>
          </Card>

          {/* Mobile Tabs */}
          <div className='w-full lg:hidden flex gap-2 overflow-x-auto pb-4 no-scrollbar'>
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "secondary" : "ghost"}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "rounded-xl h-10 px-4 text-xs font-bold gap-2 whitespace-nowrap",
                  activeTab === tab.id &&
                    tab.isDanger &&
                    "text-destructive bg-destructive/5",
                )}
              >
                <tab.icon className='h-3.5 w-3.5' />
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Content Area */}
          <div className='flex-1 w-full'>
            {activeTab === "templates" && (
              <TemplatesTab onChange={() => setHasChanges(true)} />
            )}
            {activeTab === "danger" && <DangerTab />}
          </div>
        </div>
      </main>
    </div>
  );
}

function TemplatesTab({ onChange }: { onChange: () => void }) {
  const [subTab, setSubTab] = useState<"email" | "sms">("email");
  const [template, setTemplate] = useState(
    "Hello {{guardian_name}}, the {{semester}} results for {{student_name}} ({{matric_number}}) have been officially released.\n\nGPA: {{gpa}}\n\nView full details here: {{result_link}}",
  );

  const handleTemplateChange = (e: any) => {
    setTemplate(e.target.value);
    onChange();
  };

  return (
    <Card className='rounded-xl border-border bg-card overflow-hidden animate-in fade-in duration-500'>
      <div className='p-6 border-b border-border bg-muted/20'>
        <h2 className='text-sm font-bold text-foreground uppercase tracking-wider'>
          Notification Templates
        </h2>
        <p className='text-xs text-muted-foreground mt-1'>
          Configure the automated messages sent to parents and guardians.
        </p>
      </div>

      <div className='flex p-1 bg-muted/30 border-b border-border'>
        {[
          { id: "email", label: "Official Email", icon: Mail },
          { id: "sms", label: "Standard SMS", icon: Phone },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id as any)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-bold uppercase tracking-tight rounded-lg transition-all",
              subTab === t.id
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className='h-3.5 w-3.5' /> {t.label}
          </button>
        ))}
      </div>

      <div className='p-6 space-y-6'>
        <div className='grid grid-cols-1 xl:grid-cols-2 gap-8'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <label className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                Message Content
              </label>
              <button
                className='text-[10px] font-bold text-sidebar-primary hover:underline uppercase'
                onClick={onChange}
              >
                Reset
              </button>
            </div>

            <textarea
              value={template}
              onChange={handleTemplateChange}
              className='w-full h-48 rounded-xl border border-border bg-muted/10 p-4 text-[13px] font-mono focus:ring-1 focus:ring-sidebar-primary outline-none resize-none leading-relaxed'
            />

            <div className='space-y-3'>
              <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                Insert Dynamic Variables
              </div>
              <div className='flex flex-wrap gap-1.5'>
                {[
                  "{{guardian_name}}",
                  "{{student_name}}",
                  "{{matric_number}}",
                  "{{semester}}",
                  "{{gpa}}",
                  "{{cgpa}}",
                  "{{result_link}}",
                ].map((v) => (
                  <button
                    key={v}
                    className='bg-muted/50 border border-border hover:border-sidebar-primary text-foreground text-[10px] font-bold px-2 py-1 rounded-md transition-all'
                    onClick={() => {
                      setTemplate((prev) => prev + " " + v);
                      onChange();
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <label className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
              Real-time Preview
            </label>
            <div
              className={cn(
                "rounded-2xl border border-border p-5 text-[13px] leading-relaxed relative overflow-hidden bg-muted/5",
              )}
            >
              <p className='relative z-10'>
                Hello{" "}
                <span className='font-bold text-sidebar-primary'>
                  Mrs. Folake
                </span>
                , the{" "}
                <span className='font-bold text-sidebar-primary'>
                  First Semester
                </span>{" "}
                results for{" "}
                <span className='font-bold text-sidebar-primary'>
                  John Adeyemi
                </span>{" "}
                (
                <span className='font-bold text-sidebar-primary'>
                  CSC/2021/001
                </span>
                ) have been officially released.
                <br />
                <br />
                GPA:{" "}
                <span className='font-bold text-sidebar-primary'>4.21</span>
                <br />
                <br />
                View full details here:{" "}
                <span className='text-blue-500 underline break-all font-medium'>
                  https://results.mountaintopuniversity.edu.ng/view?token=...
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function DangerTab() {
  return (
    <Card className='rounded-xl border-destructive/20 bg-card overflow-hidden animate-in fade-in duration-500'>
      <div className='p-6 border-b border-destructive/10 bg-destructive/5'>
        <h2 className='text-sm font-bold text-destructive uppercase tracking-wider flex items-center gap-2'>
          <ShieldAlert className='h-4 w-4' /> System Control
        </h2>
        <p className='text-xs text-destructive/70 mt-1'>
          Permanent administrative actions and data management.
        </p>
      </div>

      <div className='p-6 space-y-2'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-border'>
          <div className='space-y-1'>
            <p className='text-sm font-bold text-foreground'>
              Complete Data Backup
            </p>
            <p className='text-xs text-muted-foreground'>
              Export all student records, results, and system logs to a secure
              archive.
            </p>
          </div>
          <Button
            variant='outline'
            className='rounded-xl h-9 text-[10px] font-bold uppercase tracking-tight'
          >
            Export Archive
          </Button>
        </div>

        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4'>
          <div className='space-y-1'>
            <p className='text-sm font-bold text-destructive'>
              Reset System Logs
            </p>
            <p className='text-xs text-muted-foreground'>
              Permanently clear all notification delivery logs to optimize
              storage.
            </p>
          </div>
          <Button
            variant='destructive'
            className='rounded-xl h-9 text-[10px] font-bold uppercase tracking-tight'
          >
            <Trash2 className='h-3.5 w-3.5 mr-1.5' /> Reset Logs
          </Button>
        </div>
      </div>
    </Card>
  );
}
