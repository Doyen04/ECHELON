"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Building2, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

export default function PublicResultViewPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Mock token validation
  if (!token) {
    return <ErrorState type="not_found" />;
  }

  if (token === "expired") {
    return <ErrorState type="expired" />;
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header */}
      <header className="bg-brand px-4 py-6 border-b-4 border-brand-hover">
        <div className="max-w-[680px] mx-auto flex items-center justify-center gap-3 page-transition-enter">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-white/10 shrink-0">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <span className="font-serif text-xl tracking-wide text-white">
            University Registry
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[680px] mx-auto p-4 sm:p-6 md:p-8 space-y-6 pb-20">
        
        {/* Identity Block */}
        <div className="text-center space-y-2 py-4 page-transition-enter" style={{animationDelay: '50ms'}}>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground">John Ola Adeyemi</h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-sm text-text-muted font-medium">
            <span className="font-mono text-text-muted">CSC/2021/001</span>
            <span className="hidden sm:inline">Â·</span>
            <span>Computer Science</span>
            <span className="hidden sm:inline">Â·</span>
            <span>Level 400</span>
          </div>
          <div className="text-sm font-medium text-foreground mt-1">
            2024/2025 Session Â· First Semester
          </div>
        </div>

        {/* Senate Badge */}
        <div className="rounded-xl border border-status-success/40 bg-status-success/5 px-6 py-4 flex items-start sm:items-center gap-4 page-transition-enter shadow-sm" style={{animationDelay: '100ms'}}>
          <CheckCircle2 className="h-6 w-6 text-status-success shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <div className="font-medium text-foreground">Officially approved by University Senate</div>
            <div className="text-sm text-text-muted mt-0.5">Published on 14 January 2025</div>
          </div>
        </div>

        {/* Results Table (Desktop) / Cards (Mobile) */}
        <div className="rounded-xl border border-border-subtle bg-surface-main shadow-md overflow-hidden page-transition-enter" style={{animationDelay: '150ms'}}>
          {/* Header row (hidden on mobile) */}
          <div className="hidden sm:grid grid-cols-[1fr_2fr_1fr_1fr_1fr] bg-surface-subtle/50 px-6 py-3 border-b border-border-subtle text-xs font-semibold uppercase tracking-wider text-text-muted">
            <div>Course Code</div>
            <div>Course Title</div>
            <div className="text-center">Units</div>
            <div className="text-center">Grade</div>
            <div className="text-right">Score</div>
          </div>

          <div className="divide-y divide-border-subtle">
            {mockCourses.map((course) => (
              <div key={course.code} className="sm:grid sm:grid-cols-[1fr_2fr_1fr_1fr_1fr] flex flex-col sm:items-center px-4 sm:px-6 py-4 sm:py-3 hover:bg-surface-subtle/20 transition-colors">
                
                {/* Mobile: Top Row (Code + Score) */}
                <div className="flex sm:hidden justify-between items-center mb-1">
                  <div className="font-mono text-sm font-medium text-brand">{course.code}</div>
                  <div className="text-xs text-text-muted">Score: <span className="font-mono text-foreground font-medium text-sm">{course.score}</span></div>
                </div>

                {/* Mobile: Middle Row (Title) */}
                <div className="sm:hidden text-sm text-foreground font-medium mb-3 leading-snug">
                  {course.title}
                </div>

                {/* Mobile: Bottom Row (Units + Grade) */}
                <div className="flex sm:hidden justify-between items-center bg-surface-subtle/30 rounded p-2 border border-border-subtle">
                   <div className="text-xs text-text-muted">Units: <span className="text-foreground font-medium">{course.units}</span></div>
                   <div className="text-xs text-text-muted">Grade: <span className="text-foreground font-medium text-sm">{course.grade}</span></div>
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:block font-mono text-sm font-medium text-brand">{course.code}</div>
                <div className="hidden sm:block text-sm text-foreground">{course.title}</div>
                <div className="hidden sm:block text-sm text-foreground text-center">{course.units}</div>
                <div className="hidden sm:block text-sm font-semibold text-foreground text-center">{course.grade}</div>
                <div className="hidden sm:block text-sm font-mono text-text-muted text-right">{course.score}</div>
              </div>
            ))}
          </div>

          {/* Summary Row */}
          <div className="bg-surface-subtle border-t border-border-subtle px-4 sm:px-6 py-4 flex flex-wrap justify-between items-center gap-4">
             <div className="text-sm font-medium text-foreground">
               Total Units: <span className="font-mono ml-1">14</span>
             </div>
             <div className="flex gap-6">
                <div>
                  <span className="text-xs uppercase tracking-widest text-text-muted mr-2">Semester GPA</span>
                  <span className="font-serif text-2xl text-brand font-medium">4.21</span>
                </div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 pb-4 text-center space-y-1 page-transition-enter" style={{animationDelay: '200ms'}}>
          <p className="text-xs text-text-muted">
            This result was officially released by University Registry.
          </p>
          <p className="text-xs text-text-muted">
            This link automatically expires on <span className="font-medium text-text-muted">14 April 2025</span>. For queries, contact <a href="mailto:registry@university.edu.ng" className="text-brand hover:underline">registry@university.edu.ng</a>.
          </p>
        </div>

      </main>
    </div>
  );
}

function ErrorState({ type }: { type: 'expired' | 'not_found' }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-border-subtle bg-surface-main p-8 text-center shadow-xl page-transition-enter">
          <div className="mx-auto w-16 h-16 rounded-full bg-status-danger-soft flex items-center justify-center mb-6">
            {type === 'expired' ? <AlertCircle className="h-8 w-8 text-status-danger" /> : <XCircle className="h-8 w-8 text-status-danger" />}
          </div>
          
          <h1 className="font-serif text-2xl text-foreground mb-2">
            {type === 'expired' ? "This result link has expired" : "Invalid result link"}
          </h1>
          
          <p className="text-text-muted text-sm mb-8">
            {type === 'expired' 
              ? "For security reasons, result notification links expire after 90 days. Please contact the Registry office for assistance if you still need access." 
              : "This link does not exist, is malformed, or access has been revoked by the institution."}
          </p>
          
          <button className="w-full py-3 rounded border border-border-subtle bg-surface-subtle/50 text-sm font-medium text-foreground hover:bg-surface-subtle transition-colors">
            Return Home
          </button>
        </div>
    </div>
  )
}

const mockCourses = [
  { code: "CSC401", title: "Artificial Intelligence", units: 3, grade: "A", score: 78 },
  { code: "CSC403", title: "Software Engineering", units: 3, grade: "B", score: 65 },
  { code: "CSC405", title: "Compiler Construction", units: 3, grade: "A", score: 82 },
  { code: "CSC413", title: "Systems Programming", units: 3, grade: "A", score: 71 },
  { code: "GST401", title: "Entrepreneurship", units: 2, grade: "B", score: 60 }
];
