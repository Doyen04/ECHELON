"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Download, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, ChannelBadge } from "@/components/ui/badges";

export default function DeliveryLogPage() {
  const [activeTab, setActiveTab] = useState<"all" | "delivered" | "failed" | "pending">("all");
  const [selectedFailed, setSelectedFailed] = useState<Set<string>>(new Set());

  const toggleFailedSelection = (id: string) => {
    const newSelect = new Set(selectedFailed);
    if (newSelect.has(id)) newSelect.delete(id);
    else newSelect.add(id);
    setSelectedFailed(newSelect);
  };

  const handleToggleAllFailed = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const failedIds = mockDeliveries.filter(d => d.status === "failed").map(d => d.matric);
      setSelectedFailed(new Set(failedIds));
    } else {
      setSelectedFailed(new Set());
    }
  };

  const filtered = mockDeliveries.filter(d => activeTab === "all" || d.status === activeTab);
  
  const totalFailed = mockDeliveries.filter(d => d.status === "failed").length;

  return (
    <div className="flex flex-col h-full overflow-y-auto w-full bg-[var(--color-bg)] dashboard-root">
      <PageHeader 
        title="Delivery Log" 
        breadcrumbs="Computer Science · First Semester · Sent 14 Jan 2025"
        action={
          <button className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] shadow-sm hover:bg-[var(--color-surface-2)] transition-colors">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        }
      />

      <div className="p-6 md:p-8 space-y-6 max-w-[1600px] w-full mx-auto relative pb-24">
        {/* DISPATCH SUMMARY STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 dashboard-section">
          <SummaryCard title="Total Sent" value="218" />
          <SummaryCard title="Delivered" value="204" subvalue="94%" color="text-[var(--color-success)]" />
          <SummaryCard title="Failed" value="9" color="text-[var(--color-danger)]" />
          <SummaryCard title="Pending" value="5" />
        </div>

        {/* DELIVERY PROGRESS BAR */}
        <div className="dashboard-section" style={{animationDelay: '100ms'}}>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <div className="flex justify-between text-sm font-medium mb-3">
              <span className="text-[var(--color-text-primary)]">Live Progress</span>
              <span className="text-[var(--color-success)]">204 / 218 delivered</span>
            </div>
            <div className="h-4 w-full bg-[var(--color-surface-2)] rounded-full overflow-hidden flex">
              <div className="h-full bg-[var(--color-success)]" style={{ width: '94%' }} />
              <div className="h-full bg-[var(--color-warning)]" style={{ width: '2%' }} />
              <div className="h-full bg-[var(--color-danger)]" style={{ width: '4%' }} />
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs font-medium">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)]"></div><span className="text-[var(--color-text-secondary)]">Delivered</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[var(--color-warning)]"></div><span className="text-[var(--color-text-secondary)]">Pending</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[var(--color-danger)]"></div><span className="text-[var(--color-text-secondary)]">Failed</span></div>
            </div>
          </div>
        </div>

        {/* FILTER TABS */}
        <div className="flex border-b border-[var(--color-border)] dashboard-section pt-4" style={{animationDelay: '150ms'}}>
          <TabButton active={activeTab === "all"} onClick={() => setActiveTab("all")} label="All" count={218} />
          <TabButton active={activeTab === "delivered"} onClick={() => setActiveTab("delivered")} label="Delivered" count={204} color="text-[var(--color-success)]" />
          <TabButton active={activeTab === "failed"} onClick={() => setActiveTab("failed")} label="Failed" count={9} color="text-[var(--color-danger)]" />
          <TabButton active={activeTab === "pending"} onClick={() => setActiveTab("pending")} label="Pending" count={5} color="text-[var(--color-warning)]" />
        </div>

        {/* DELIVERY TABLE */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-x-auto dashboard-section" style={{animationDelay: '200ms'}}>
          <table className="min-w-full divide-y divide-[var(--color-border)]">
            <thead className="bg-[var(--color-surface-2)]/40">
              <tr>
                {activeTab === "failed" && (
                  <th className="w-12 px-4 py-3 text-left">
                    <input 
                      type="checkbox" 
                      onChange={handleToggleAllFailed}
                      checked={selectedFailed.size === totalFailed && totalFailed > 0}
                      className="rounded border-[var(--color-border)] accent-[var(--color-accent)]" 
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Matric No.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Student Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Guardian Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Channel</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Sent At</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {filtered.map((row, idx) => {
                const isFailed = row.status === "failed";
                return (
                  <tr key={idx} className={`hover:bg-[var(--color-surface-2)]/40 transition-colors table-row-enter ${isFailed ? "border-l-4 border-l-[var(--color-danger)]" : "border-l-4 border-l-transparent"}`} style={{ animationDelay: `${idx * 20}ms` }}>
                    {activeTab === "failed" && (
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          checked={selectedFailed.has(row.matric)}
                          onChange={() => toggleFailedSelection(row.matric)}
                          className="rounded border-[var(--color-border)] accent-[var(--color-accent)]" 
                        />
                      </td>
                    )}
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-[var(--color-text-secondary)]">{row.matric}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text-primary)]">{row.student}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">{row.guardian}</td>
                    <td className="px-4 py-4 whitespace-nowrap"><ChannelBadge channel={row.channel as any} /></td>
                    <td className="px-4 py-4 whitespace-nowrap"><StatusBadge status={row.status as any} /></td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)]">{row.sentAt}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-right min-w-[200px]">
                      {isFailed ? (
                         <div className="flex flex-col items-end gap-2">
                           <div className="inline-flex rounded bg-[var(--color-danger)]/10 px-2 py-1 text-xs text-[var(--color-danger)] max-w-xs truncate">
                             {row.error}
                           </div>
                           <button className="text-xs font-medium text-[var(--color-accent)] hover:underline inline-flex items-center gap-1">
                             <RefreshCw className="h-3 w-3" /> Retry Send
                           </button>
                         </div>
                      ) : row.status === 'delivered' ? (
                        <div className="text-xs text-[var(--color-text-muted)]">
                          Delivered: {row.deliveredAt}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BULK RETRY STRIP */}
      {activeTab === "failed" && selectedFailed.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl shadow-2xl bg-[var(--color-surface)] border border-[var(--color-border)] px-6 py-4 flex items-center justify-between gap-8 modal-enter min-w-[400px]">
          <div className="font-medium text-[var(--color-danger)] text-sm">
            {selectedFailed.size} failed sends selected
          </div>
          <button className="flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity">
            <RefreshCw className="h-4 w-4" /> Retry All Selected
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, subvalue, color }: any) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 dashboard-card shadow-sm flex flex-col justify-between">
      <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">{title}</div>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-serif ${color ? color : "text-[var(--color-text-primary)]"}`}>{value}</span>
        {subvalue && <span className="text-sm font-medium text-[var(--color-text-muted)]">{subvalue}</span>}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, count, color = "text-[var(--color-text-primary)]" }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
        active 
          ? `border-[var(--color-accent)] ${color}` 
          : `border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]`
      }`}
    >
      {label} <span className="inline-flex ml-2 rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">{count}</span>
    </button>
  );
}

const mockDeliveries = [
  { matric: "CSC/2021/001", student: "Adeyemi, John Ola", guardian: "Mrs. Folake Adeyemi", channel: "whatsapp", status: "delivered", sentAt: "10:45 AM", deliveredAt: "10:46 AM, read 10:50 AM" },
  { matric: "CSC/2021/002", student: "Okafor, Blessing", guardian: "Mr. Chukwu Okafor", channel: "email", status: "delivered", sentAt: "10:45 AM", deliveredAt: "10:45 AM" },
  { matric: "CSC/2021/004", student: "Eze, Emmanuel", guardian: "Chief Eze", channel: "whatsapp", status: "failed", sentAt: "10:45 AM", error: "Number not registered on WhatsApp" },
  { matric: "CSC/2021/005", student: "Musa, Ibrahim", guardian: "Alhaji Musa", channel: "sms", status: "pending", sentAt: "10:45 AM" },
  { matric: "CSC/2021/008", student: "Adegoke, Sarah", guardian: "Dr. Adegoke", channel: "whatsapp", status: "delivered", sentAt: "10:45 AM", deliveredAt: "10:47 AM" },
  { matric: "CSC/2021/010", student: "Bello, Kazeem", guardian: "Mr. Bello", channel: "email", status: "failed", sentAt: "10:45 AM", error: "Hard bounce: mailbox full" },
];
