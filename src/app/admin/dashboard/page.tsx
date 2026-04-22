import React from "react";
import Link from "next/link";
import { ArrowRight, FileText, Send, CheckCircle2, UploadCloud, Clock, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badges";

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full overflow-y-auto w-full bg-background">
      <PageHeader 
        title="Dashboard" 
        breadcrumbs="2024/2025 Â· First Semester" 
      />

      <div className="p-6 md:p-8 space-y-8 max-w-400 w-full mx-auto">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Batches" 
            value="14" 
            linkHref="/admin/batches" 
            linkText="View all â†’" 
            delay={0}
          />
          <StatCard 
            title="Pending Approval" 
            value="4" 
            linkHref="/admin/approvals" 
            linkText="Review now â†’" 
            accent="border-[var(--color-warning)]"
            delay={1}
          />
          <StatCard 
            title="Approved Batches" 
            value="8" 
            linkHref="/admin/batches" 
            linkText="Send results â†’" 
            delay={2}
          />
          <StatCard 
            title="Dispatched Batches" 
            value="2" 
            linkHref="/admin/delivery/latest" 
            linkText="View logs â†’" 
            delay={3}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Recent Batches (60%) */}
          <div className="lg:col-span-3 space-y-4 dashboard-section">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif text-foreground">Recent Batches</h2>
            </div>
            
            <div className="rounded-xl border border-border-subtle bg-surface-main overflow-hidden">
              <table className="min-w-full divide-y divide-border-subtle">
                <thead className="bg-surface-subtle/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted tracking-wider">Session</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted tracking-wider">Dept</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted tracking-wider">Students</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle bg-surface-main">
                  {/* MockRows */}
                  <RecentBatchRow session="2024/25 Â· 1st" dept="Computer Science" students={247} status="pending" idx={0} />
                  <RecentBatchRow session="2024/25 Â· 1st" dept="Physics" students={112} status="approved" idx={1} />
                  <RecentBatchRow session="2024/25 Â· 1st" dept="Mathematics" students={86} status="in_review" idx={2} />
                  <RecentBatchRow session="2024/25 Â· 1st" dept="Chemistry" students={184} status="dispatched" idx={3} />
                  <RecentBatchRow session="2024/25 Â· 1st" dept="Biology" students={210} status="pending" idx={4} />
                </tbody>
              </table>
              <div className="bg-surface-subtle/30 px-4 py-3 border-t border-border-subtle text-sm">
                <Link href="/admin/batches" className="text-brand font-medium hover:text-brand-hover transition-colors hover:underline">
                  View all recent batches â†’
                </Link>
              </div>
            </div>
          </div>

          {/* Notification Summary (40%) */}
          <div className="lg:col-span-2 space-y-4 dashboard-section" style={{animationDelay: '100ms'}}>
             <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif text-foreground">Last Dispatch</h2>
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface-main p-6 space-y-6">
              <div>
                <h3 className="font-medium text-foreground">Chemistry Â· First Semester</h3>
                <p className="text-sm text-text-muted mt-1">Triggered 14 Jan 2025 by Registrar Adeyemi</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                 <div className="bg-surface-subtle rounded-lg p-3 text-center">
                    <div className="text-2xl font-serif text-foreground">184</div>
                    <div className="text-xs text-text-muted mt-1">Total</div>
                 </div>
                 <div className="bg-status-success/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-serif text-status-success">179</div>
                    <div className="text-xs font-medium text-status-success mt-1">Sent</div>
                 </div>
                 <div className="bg-status-danger/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-serif text-status-danger">5</div>
                    <div className="text-xs font-medium text-status-danger mt-1">Failed</div>
                 </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-foreground">Delivery Progress</span>
                  <span className="text-status-success">97%</span>
                </div>
                <div className="h-2 w-full bg-surface-subtle rounded-full overflow-hidden">
                  <div className="h-full bg-status-success rounded-full" style={{ width: '97%' }} />
                </div>
              </div>

              <Link href="/admin/delivery/123" className="inline-flex items-center gap-2 text-sm text-brand font-medium hover:text-brand-hover transition-colors hover:underline">
                View delivery log <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Pipeline Status Strip */}
        <div className="dashboard-section" style={{animationDelay: '150ms'}}>
          <div className="rounded-xl border border-border-subtle bg-surface-main p-6">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-6">Pipeline Workflow</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative">
              <div className="hidden sm:block absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-border-subtle z-0"></div>
              
              <PipelineStep icon={UploadCloud} label="Upload" count={14} active={false} />
              <PipelineStep icon={Clock} label="Senate Review" count={4} active={true} />
              <PipelineStep icon={CheckCircle2} label="Approved" count={8} active={false} />
              <PipelineStep icon={Send} label="Dispatched" count={2} active={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, linkHref, linkText, accent, delay }: { title: string, value: string, linkHref: string, linkText: string, accent?: string, delay: number }) {
  return (
    <div 
      className={`rounded-2xl border bg-surface-main p-6 dashboard-card flex flex-col justify-between ${accent ? accent : 'border-border-subtle'}`}
      style={{ animationDelay: `${delay * 50}ms` }}
    >
      <div className="text-sm text-text-muted font-medium mb-4">{title}</div>
      <div className="text-4xl font-serif text-foreground mb-4">{value}</div>
      <Link href={linkHref} className="text-sm font-medium text-brand hover:text-brand-hover hover:underline inline-flex items-center gap-1">
        {linkText}
      </Link>
    </div>
  );
}

function RecentBatchRow({ session, dept, students, status, idx }: { session: string, dept: string, students: number, status: any, idx: number }) {
  return (
    <tr className="hover:bg-surface-subtle/50 transition-colors group table-row-enter cursor-pointer" style={{ animationDelay: `${idx * 40}ms` }}>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">{session}</td>
      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">{dept}</td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted">{students}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        <StatusBadge status={status} />
      </td>
    </tr>
  );
}

function PipelineStep({ icon: Icon, label, count, active }: { icon: any, label: string, count: number, active: boolean }) {
  return (
    <div className={`relative z-10 flex flex-col items-center gap-2 bg-surface-main sm:px-4 ${active ? 'text-brand' : 'text-text-muted'}`}>
      <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${active ? 'border-brand bg-brand/10 text-brand' : 'border-border-subtle bg-surface-main text-text-muted'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-center">
        <div className={`text-sm font-medium ${active ? 'text-foreground' : ''}`}>{label}</div>
        <div className="text-xs mt-0.5">{count} batches</div>
      </div>
    </div>
  );
}
