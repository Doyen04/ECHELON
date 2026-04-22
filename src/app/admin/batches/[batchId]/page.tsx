"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badges";
import { ChevronDown, ChevronRight, Phone, Mail, CheckCircle2, XCircle, MoreHorizontal } from "lucide-react";

export default function BatchDetailPage() {
  const params = useParams();
  const batchId = params.batchId as string;
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newDocs = new Set(expandedRows);
    if (newDocs.has(id)) {
      newDocs.delete(id);
    } else {
      newDocs.add(id);
    }
    setExpandedRows(newDocs);
  };

  const toggleSelection = (id: string) => {
    const newSelect = new Set(selectedIds);
    if (newSelect.has(id)) {
      newSelect.delete(id);
    } else {
      newSelect.add(id);
    }
    setSelectedIds(newSelect);
  }

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(mockStudents.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto w-full bg-[var(--color-bg)] dashboard-root">
      <PageHeader 
        title={
          <div className="flex items-center gap-3">
            Computer Science · First Semester 2024/2025
            <StatusBadge status="approved" />
          </div>
        }
        breadcrumbs={
          <div className="flex items-center gap-1">
            <Link href="/admin/batches" className="hover:text-[var(--color-text-primary)] transition-colors">Batches</Link>
            <span>/</span>
            <span className="text-[var(--color-text-primary)]">{batchId}</span>
          </div>
        }
        action={
          <Link 
            href={`/admin/batches/${batchId}/dispatch`}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Send Results →
          </Link>
        }
      />

      <div className="p-6 md:p-8 space-y-6 max-w-[1600px] w-full mx-auto relative pb-24">
        {/* SUMMARY STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 dashboard-section">
          <SummaryCard title="Total Students" value="247" />
          <SummaryCard title="Approved" value="231" />
          <SummaryCard title="Withheld" value="8" />
          <SummaryCard title="Pending" value="8" />
        </div>

        {/* RESULTS TABLE */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-x-auto dashboard-section">
          <table className="min-w-full divide-y divide-[var(--color-border)] relative">
            <thead className="bg-[var(--color-surface-2)]/40">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input 
                    type="checkbox" 
                    onChange={toggleAll}
                    checked={selectedIds.size === mockStudents.length && mockStudents.length > 0}
                    className="rounded border-[var(--color-border)] accent-[var(--color-accent)]" 
                  />
                </th>
                <th className="w-12 px-2 py-3 text-center"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Matric No.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Student Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Courses</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">GPA</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">CGPA</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {mockStudents.map((student, idx) => {
                const isExpanded = expandedRows.has(student.id);
                const isSelected = selectedIds.has(student.id);
                const statusBorder = student.status === 'withheld' ? 'border-l-4 border-l-[var(--color-danger)] opacity-80 bg-[var(--color-danger-soft)]/20' 
                                  : student.status === 'approved' ? 'border-l-4 border-l-[var(--color-success)] bg-white'
                                  : 'border-l-4 border-l-transparent bg-white';

                return (
                  <React.Fragment key={student.id}>
                    <tr className={`hover:bg-[var(--color-surface-2)]/40 transition-colors ${statusBorder} table-row-enter`} style={{ animationDelay: `${idx * 20}ms` }}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelection(student.id)}
                          className="rounded border-[var(--color-border)] accent-[var(--color-accent)]" 
                        />
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-center text-[var(--color-text-muted)] cursor-pointer" onClick={() => toggleRow(student.id)}>
                        {isExpanded ? <ChevronDown className="h-5 w-5 hover:text-[var(--color-text-primary)] transition-colors" /> : <ChevronRight className="h-5 w-5 hover:text-[var(--color-text-primary)] transition-colors" />}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-[var(--color-text-secondary)]">{student.matric}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text-primary)]">{student.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center rounded-full bg-[var(--color-surface-2)] px-2.5 py-0.5 text-xs text-[var(--color-text-secondary)]">
                          {student.coursesCount} courses
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">{student.gpa}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">{student.cgpa}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                          {student.hasPhone ? <Phone className="h-4 w-4 text-green-600" /> : <Phone className="h-4 w-4 opacity-30" />}
                          {student.hasEmail ? <Mail className="h-4 w-4 text-blue-600" /> : <Mail className="h-4 w-4 opacity-30" />}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={student.status as any} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                         <button className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded-md hover:bg-[var(--color-surface-2)]">
                           <MoreHorizontal className="h-5 w-5" />
                         </button>
                      </td>
                    </tr>
                    
                    {/* EXPANDED INLINE TABLE */}
                    {isExpanded && (
                      <tr className={`${statusBorder}`}>
                        <td colSpan={10} className="p-0 border-b border-[var(--color-border)]">
                          <div className="bg-[var(--color-surface-2)]/30 px-12 py-4 page-transition-enter overflow-x-auto shadow-inner">
                            <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">{student.name} - Course Results</h4>
                            <div className="rounded border border-[var(--color-border)] bg-white overflow-hidden max-w-2xl">
                              <table className="min-w-full divide-y divide-[var(--color-border)]">
                                <thead className="bg-[var(--color-surface-2)]/50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-text-muted)] w-24">Code</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-text-muted)]">Title</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-text-muted)] w-16">Units</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-text-muted)] w-16">Grade</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-text-muted)] w-16">Score</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                  {mockCourses.map(course => (
                                    <tr key={course.code}>
                                      <td className="px-4 py-2 text-sm font-mono text-[var(--color-text-secondary)]">{course.code}</td>
                                      <td className="px-4 py-2 text-sm text-[var(--color-text-primary)]">{course.title}</td>
                                      <td className="px-4 py-2 text-sm text-[var(--color-text-primary)]">{course.units}</td>
                                      <td className="px-4 py-2 text-sm font-medium text-[var(--color-text-primary)]">{course.grade}</td>
                                      <td className="px-4 py-2 text-sm text-[var(--color-text-secondary)]">{course.score}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* APPROVAL METADATA */}
        <div className="text-xs text-[var(--color-text-muted)] flex items-center justify-end gap-2 mt-4 dashboard-section">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
          <span>Approved by: <span className="font-medium text-[var(--color-text-primary)]">Prof. A. Okoye</span> · 14 Jan 2025, 10:45 AM · IP: 196.223.111.94</span>
        </div>
      </div>

      {/* BULK ACTION BAR */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl shadow-2xl bg-white border border-[var(--color-border)] px-6 py-4 flex items-center gap-6 modal-enter">
          <div className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium px-3 py-1.5 rounded-md text-sm">
            {selectedIds.size} selected
          </div>
          <div className="flex items-center gap-3 pr-2">
            <button className="flex items-center gap-2 rounded-md bg-[var(--color-success)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity">
              <CheckCircle2 className="h-4 w-4" /> Approve Selected
            </button>
            <button className="flex items-center gap-2 rounded-md bg-[var(--color-danger)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity">
              <XCircle className="h-4 w-4" /> Withhold Selected
            </button>
            <div className="w-px h-8 bg-[var(--color-border)] mx-1"></div>
            <button 
              onClick={() => setSelectedIds(new Set())}
              className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value }: { title: string, value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 dashboard-card shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">{title}</div>
      <div className="text-3xl font-serif text-[var(--color-text-primary)]">{value}</div>
    </div>
  );
}

const mockStudents = [
  { id: "s1", matric: "CSC/2021/001", name: "Adeyemi, John Ola", coursesCount: 6, gpa: "4.21", cgpa: "4.05", hasPhone: true, hasEmail: true, status: "approved" },
  { id: "s2", matric: "CSC/2021/002", name: "Okafor, Blessing Nneka", coursesCount: 6, gpa: "3.85", cgpa: "3.91", hasPhone: true, hasEmail: false, status: "approved" },
  { id: "s3", matric: "CSC/2021/005", name: "Musa, Ibrahim Yunus", coursesCount: 5, gpa: "2.10", cgpa: "2.35", hasPhone: false, hasEmail: false, status: "withheld" },
  { id: "s4", matric: "CSC/2021/008", name: "Eze, Emmanuel Chinedu", coursesCount: 7, gpa: "4.85", cgpa: "4.70", hasPhone: true, hasEmail: true, status: "approved" },
  { id: "s5", matric: "CSC/2021/010", name: "Adegoke, Sarah T.", coursesCount: 6, gpa: "3.45", cgpa: "3.55", hasPhone: true, hasEmail: true, status: "pending" },
];

const mockCourses = [
  { code: "CSC301", title: "Automata Theory", units: 3, grade: "A", score: 78 },
  { code: "CSC303", title: "Data Structures", units: 3, grade: "B", score: 65 },
  { code: "CSC305", title: "Database Systems", units: 3, grade: "A", score: 82 },
  { code: "CSC307", title: "Operating Systems", units: 3, grade: "C", score: 55 },
  { code: "GST301", title: "Communication in English", units: 2, grade: "B", score: 68 },
];
