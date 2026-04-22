"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { UserCog, ChevronDown, ChevronRight, CheckCircle2, Phone, Mail, XCircle, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badges";

export default function StudentRecordPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set(["2024-1"]));

  const toggleSession = (id: string) => {
    const newDocs = new Set(expandedSessions);
    if (newDocs.has(id)) newDocs.delete(id);
    else newDocs.add(id);
    setExpandedSessions(newDocs);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto w-full bg-background dashboard-root">
      <PageHeader 
        title={
          <div className="flex flex-col">
            <span className="font-serif text-2xl text-foreground">Adeyemi, John Ola</span>
            <div className="flex items-center gap-2 mt-1 text-sm font-sans tracking-normal font-normal text-text-muted">
              <span className="font-mono text-text-muted">CSC/2021/001</span>
              <span>·</span>
              <span>Computer Science</span>
              <span>·</span>
              <span>Level 400</span>
            </div>
          </div>
        }
        action={
          <button className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-surface-main px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-surface-subtle transition-colors">
            <UserCog className="h-4 w-4" />
            Edit Contacts
          </button>
        }
      />

      <div className="p-6 md:p-8 space-y-6 max-w-400 w-full mx-auto pb-24">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Result History (65%) */}
          <div className="flex-1 lg:max-w-[65%] space-y-6 dashboard-section">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted border-b border-border-subtle pb-2 flex items-center justify-between">
              Result History
              <span className="text-xs font-medium bg-surface-subtle py-0.5 px-2 rounded-full text-text-muted">3 semesters</span>
            </h2>

            <div className="space-y-4">
              {mockHistory.map((hist, idx) => {
                const isExpanded = expandedSessions.has(hist.id);
                return (
                  <div key={hist.id} className="rounded-xl border border-border-subtle bg-surface-main shadow-sm overflow-hidden" style={{animationDelay: `${idx * 100}ms`}}>
                    <button 
                      onClick={() => toggleSession(hist.id)}
                      className="w-full flex items-center justify-between p-5 hover:bg-surface-subtle/40 transition-colors text-left"
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded text-text-muted ${isExpanded ? 'bg-surface-subtle' : ''}`}>
                            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{hist.session}</div>
                            <div className="text-sm text-text-muted">{hist.semester}</div>
                          </div>
                        </div>
                        <div className="hidden sm:block w-px h-8 bg-border-subtle"></div>
                        <div className="hidden sm:block">
                          <div className="text-sm text-text-muted">GPA</div>
                          <div className="font-medium text-foreground">{hist.gpa}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <StatusBadge status={hist.status as any} />
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="border-t border-border-subtle page-transition-enter">
                        <div className="bg-surface-subtle/30 px-6 py-4">
                           <div className="flex justify-between items-end mb-3">
                             <h4 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Course Breakdown</h4>
                             {hist.status === 'approved' && (
                               <Link href={`/results/view?token=mock_token_${hist.id}`} target="_blank" className="text-xs font-medium text-brand hover:underline">
                                 View Parent Portal Render →
                               </Link>
                             )}
                           </div>
                           <table className="min-w-full divide-y divide-border-subtle bg-surface-main border border-border-subtle rounded overflow-hidden">
                             <thead className="bg-surface-subtle/50">
                               <tr>
                                 <th className="px-4 py-2 text-left text-xs font-medium text-text-muted w-24">Code</th>
                                 <th className="px-4 py-2 text-left text-xs font-medium text-text-muted">Title</th>
                                 <th className="px-4 py-2 text-left text-xs font-medium text-text-muted w-16">Units</th>
                                 <th className="px-4 py-2 text-left text-xs font-medium text-text-muted w-16">Grade</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-border-subtle">
                               {hist.courses.map(course => (
                                 <tr key={course.code} className="hover:bg-surface-subtle/20">
                                   <td className="px-4 py-2 text-sm font-mono text-text-muted">{course.code}</td>
                                   <td className="px-4 py-2 text-sm text-foreground">{course.title}</td>
                                   <td className="px-4 py-2 text-sm text-foreground">{course.units}</td>
                                   <td className="px-4 py-2 text-sm font-medium text-foreground">{course.grade}</td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Guardian Contacts (35%) */}
          <div className="lg:w-fit lg:min-w-90 space-y-6 dashboard-section" style={{animationDelay: '150ms'}}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted border-b border-border-subtle pb-2 flex items-center justify-between">
              Guardian Contacts
              <span className="text-xs font-medium bg-surface-subtle py-0.5 px-2 rounded-full text-text-muted">2 assigned</span>
            </h2>

            <div className="space-y-4">
              <div className="rounded-xl border border-border-subtle bg-surface-main p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-serif text-lg text-foreground">Mrs. Folake Adeyemi</h3>
                    <p className="text-sm text-text-muted">Mother · Primary Contact</p>
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-text-muted" />
                    <span className="text-foreground font-mono">+234 801 234 5678</span>
                    <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ml-auto flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> WhatsApp
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-text-muted" />
                      <span className="text-foreground font-mono">folake@gmail.com</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-border-subtle">
                  <div className="flex items-center gap-2 text-sm">
                    NDPR Consent:
                    <div className="flex items-center gap-1 text-status-success font-medium bg-status-success/10 px-2 py-0.5 rounded">
                      <CheckCircle2 className="h-4 w-4" /> Valid (12 Aug 2021)
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border-subtle bg-surface-main p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-serif text-lg text-foreground">Mr. Tunde Adeyemi</h3>
                    <p className="text-sm text-text-muted">Father · Secondary Contact</p>
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-text-muted" />
                    <span className="text-foreground font-mono">+234 802 345 6789</span>
                  </div>
                   <div className="flex items-center gap-3 text-sm text-status-warning">
                     <Mail className="h-4 w-4" />
                    <span className="italic">No email provided</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-border-subtle">
                  <div className="flex items-center gap-2 text-sm">
                    NDPR Consent:
                    <div className="flex items-center gap-1 text-status-danger font-medium bg-status-danger/10 px-2 py-0.5 rounded">
                      <XCircle className="h-4 w-4" /> Missing
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 rounded border border-border-subtle border-dashed bg-surface-subtle/30 px-4 py-3 text-sm font-medium text-text-muted hover:bg-surface-subtle hover:text-foreground transition-colors">
                <Plus className="h-4 w-4" />
                Add Guardian
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const mockHistory = [
  {
    id: "2024-1",
    session: "2024/2025",
    semester: "First Semester",
    gpa: "4.21",
    status: "approved",
    courses: [
      { code: "CSC401", title: "Artificial Intelligence", units: 3, grade: "A" },
      { code: "CSC403", title: "Software Engineering", units: 3, grade: "B" },
      { code: "CSC405", title: "Compiler Construction", units: 3, grade: "A" }
    ]
  },
  {
    id: "2023-2",
    session: "2023/2024",
    semester: "Second Semester",
    gpa: "3.85",
    status: "dispatched",
    courses: [
      { code: "CSC302", title: "Object Oriented Programming", units: 3, grade: "B" },
      { code: "CSC304", title: "Data Management", units: 3, grade: "B" },
      { code: "CSC306", title: "Theory of Computing", units: 3, grade: "C" }
    ]
  },
  {
    id: "2023-1",
    session: "2023/2024",
    semester: "First Semester",
    gpa: "4.05",
    status: "dispatched",
    courses: [
      { code: "CSC301", title: "Automata Theory", units: 3, grade: "A" },
      { code: "CSC303", title: "Data Structures", units: 3, grade: "B" },
      { code: "CSC305", title: "Database Systems", units: 3, grade: "A" }
    ]
  }
];
