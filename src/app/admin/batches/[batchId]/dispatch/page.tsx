"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmModal } from "@/components/ui/modal";
import { CheckCircle2, AlertTriangle, MessageCircle, Mail, Phone, ChevronRight, XCircle, Plus } from "lucide-react";

export default function DispatchPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.batchId as string;
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleSend = () => {
    // Navigate to delivery log for an arbitrary dispatch ID
    router.push(`/admin/delivery/123`);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto w-full bg-[var(--color-bg)] dashboard-root">
      <PageHeader 
        title="Send Results — Computer Science · First Semester" 
        breadcrumbs={
          <div className="flex items-center gap-1">
            <Link href="/admin/batches" className="hover:text-[var(--color-text-primary)] transition-colors">Batches</Link>
            <span>/</span>
            <Link href={`/admin/batches/${batchId}`} className="hover:text-[var(--color-text-primary)] transition-colors text-mono">{batchId}</Link>
            <span>/</span>
            <span className="text-[var(--color-text-primary)]">Dispatch</span>
          </div>
        }
      />

      <div className="p-6 md:p-8 space-y-8 max-w-4xl w-full mx-auto">
        {/* PRE-DISPATCH CHECKLIST */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm dashboard-section">
          <div className="p-6 border-b border-[var(--color-border)]">
            <h2 className="text-lg font-serif text-[var(--color-text-primary)]">Pre-Dispatch Checklist</h2>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            <ChecklistItem 
              status="pass"
              title="Batch approved by Senate"
              desc="Approved by Prof. A. Okoye on 14 Jan 2025"
            />
            <ChecklistItem 
              status="pass"
              title="231 students approved for dispatch"
              desc="8 students withheld — will NOT receive notifications"
            />
            <ChecklistItem 
              status="warn"
              title="Contact coverage: 94% (218 / 231 have valid contact)"
              desc="13 students missing parent contact data"
              action={<button className="text-sm font-medium text-[var(--color-accent)] mt-1 inline-flex items-center hover:underline">View missing contacts →</button>}
            />
            <ChecklistItem 
              status="pass"
              title="NDPR consent verified for all contacts"
              desc="Consent collected during registration forms"
            />
            <ChecklistItem 
              status="pass"
              title="Notification channels ready"
              desc={
                <div className="space-y-1 mt-1">
                  <div className="flex gap-2 items-center"><MessageCircle className="h-4 w-4 text-[var(--color-text-muted)]" /> WhatsApp: Termii connected</div>
                  <div className="flex gap-2 items-center"><Mail className="h-4 w-4 text-[var(--color-text-muted)]" /> Email: Resend connected</div>
                  <div className="flex gap-2 items-center"><Phone className="h-4 w-4 text-[var(--color-text-muted)]" /> SMS: Termii connected (fallback)</div>
                </div>
              }
            />
          </div>
        </div>

        {/* CHANNEL BREAKDOWN PREVIEW */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm dashboard-section" style={{animationDelay: '100ms'}}>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-6">Estimated Sends Breakdown</h2>
          
          <div className="space-y-5">
            <ProgressBar icon={MessageCircle} channel="WhatsApp" count={172} total={231} color="bg-green-500" />
            <ProgressBar icon={Mail} channel="Email" count={38} total={231} color="bg-blue-500" />
            <ProgressBar icon={Phone} channel="SMS" count={8} total={231} color="bg-slate-500" />
            <ProgressBar icon={XCircle} channel="No contact" count={13} total={231} color="bg-[var(--color-border)]" valueColor="text-[var(--color-text-muted)]" />
          </div>
        </div>

        {/* SEND TRIGGER */}
        <div className="rounded-xl border-2 border-[var(--color-accent)]/80 bg-[var(--color-accent)]/5 p-8 text-center dashboard-section" style={{animationDelay: '200ms'}}>
          <p className="text-lg text-[var(--color-text-primary)] mb-2">
            Ready to send results to <span className="font-semibold">218 parents</span>.
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            This action will enqueue all notifications immediately and cannot be undone.
          </p>
          <button 
            onClick={() => setIsConfirmOpen(true)}
            className="w-full sm:w-auto px-8 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium rounded-md shadow-lg transition-all"
          >
            Send Results Now
          </button>
        </div>

        {/* MISSING CONTACTS */}
        <div className="dashboard-section" style={{animationDelay: '300ms'}}>
          <details className="group rounded-xl border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5 shadow-sm overflow-hidden">
            <summary className="flex cursor-pointer items-center justify-between p-6 list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-[var(--color-warning)]" />
                <h3 className="text-[var(--color-warning)] font-medium">13 Students Missing Parent Contacts</h3>
              </div>
              <ChevronRight className="h-5 w-5 text-[var(--color-warning)] transition-transform group-open:rotate-90" />
            </summary>
            
            <div className="border-t border-[var(--color-warning)]/20">
              <table className="min-w-full divide-y divide-[var(--color-warning)]/20">
                <thead className="bg-[var(--color-warning)]/10">
                  <tr>
                    <th className="px-6 py-2 text-left text-xs font-medium text-[var(--color-warning)]">Matric No.</th>
                    <th className="px-6 py-2 text-left text-xs font-medium text-[var(--color-warning)]">Student Name</th>
                    <th className="px-6 py-2 text-left text-xs font-medium text-[var(--color-warning)]">Missing</th>
                    <th className="px-6 py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-warning)]/20 bg-white/40">
                  <tr>
                    <td className="px-6 py-3 font-mono text-sm text-[var(--color-warning)]">CSC/2021/045</td>
                    <td className="px-6 py-3 text-sm text-[var(--color-text-primary)]">Bello, Kazeem</td>
                    <td className="px-6 py-3 text-sm text-[var(--color-text-muted)]">Phone, Email</td>
                    <td className="px-6 py-3 text-right">
                      <button className="inline-flex items-center gap-1 text-[var(--color-accent)] text-xs font-medium hover:underline">
                        <Plus className="h-3 w-3" /> Add Contact
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-mono text-sm text-[var(--color-warning)]">CSC/2021/112</td>
                    <td className="px-6 py-3 text-sm text-[var(--color-text-primary)]">Okon, Favour</td>
                    <td className="px-6 py-3 text-sm text-[var(--color-text-muted)]">Phone, Email</td>
                    <td className="px-6 py-3 text-right">
                      <button className="inline-flex items-center gap-1 text-[var(--color-accent)] text-xs font-medium hover:underline">
                        <Plus className="h-3 w-3" /> Add Contact
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSend}
        title="Confirm: Send Results"
        description={<p className="text-sm">You are about to send notifications to <strong>218 parents</strong>. This action will trigger external SMS, WhatsApp, and Email APIs and <strong>cannot be undone</strong>.</p>}
        confirmText="Confirm Send →"
        isDestructive={false}
      />

    </div>
  );
}

function ChecklistItem({ status, title, desc, action }: { status: 'pass' | 'warn', title: string, desc: React.ReactNode, action?: React.ReactNode }) {
  return (
    <div className="flex gap-4 p-6">
      <div className="shrink-0 mt-0.5">
        {status === 'pass' ? (
          <CheckCircle2 className="h-6 w-6 text-[var(--color-success)]" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-[var(--color-warning)]" />
        )}
      </div>
      <div>
        <h3 className="font-medium text-[var(--color-text-primary)]">{title}</h3>
        <div className="text-sm text-[var(--color-text-muted)] mt-1">{desc}</div>
        {action}
      </div>
    </div>
  )
}

function ProgressBar({ icon: Icon, channel, count, total, color, valueColor = "text-[var(--color-text-primary)]" }: any) {
  const percentage = Math.round((count / total) * 100);
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 w-28 shrink-0 text-sm font-medium text-[var(--color-text-secondary)]">
        <Icon className="h-4 w-4" /> {channel}
      </div>
      <div className="flex-1 h-3 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }} />
      </div>
      <div className={`w-28 text-right text-sm ${valueColor}`}>
        <span className="font-medium">{count}</span> parents
      </div>
    </div>
  )
}
