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
    <div className="min-h-screen bg-[var(--color-bg)] font-sans text-[var(--color-text-primary)]">
      {/* Header */}
      <header className="bg-[var(--color-accent)] px-4 py-6 border-b-4 border-[var(--color-accent-hover)]">
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
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--color-text-primary)]">John Ola Adeyemi</h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-sm text-[var(--color-text-muted)] font-medium">
            <span className="font-mono text-[var(--color-text-secondary)]">CSC/2021/001</span>
            <span className="hidden sm:inline">·</span>
            <span>Computer Science</span>
            <span className="hidden sm:inline">·</span>
            <span>Level 400</span>
          </div>
          <div className="text-sm font-medium text-[var(--color-text-primary)] mt-1">
            2024/2025 Session · First Semester
          </div>
        </div>

        {/* Senate Badge */}
        <div className="rounded-xl border border-[var(--color-success)]/40 bg-[var(--color-success)]/5 px-6 py-4 flex items-start sm:items-center gap-4 page-transition-enter shadow-sm" style={{animationDelay: '100ms'}}>
          <CheckCircle2 className="h-6 w-6 text-[var(--color-success)] shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <div className="font-medium text-[var(--color-text-primary)]">Officially approved by University Senate</div>
            <div className="text-sm text-[var(--color-text-muted)] mt-0.5">Published on 14 January 2025</div>
          </div>
        </div>

        {/* Results Table (Desktop) / Cards (Mobile) */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md overflow-hidden page-transition-enter" style={{animationDelay: '150ms'}}>
          {/* Header row (hidden on mobile) */}
          <div className="hidden sm:grid grid-cols-[1fr_2fr_1fr_1fr_1fr] bg-[var(--color-surface-2)]/50 px-6 py-3 border-b border-[var(--color-border)] text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            <div>Course Code</div>
            <div>Course Title</div>
            <div className="text-center">Units</div>
            <div className="text-center">Grade</div>
            <div className="text-right">Score</div>
          </div>

          <div className="divide-y divide-[var(--color-border)]">
            {mockCourses.map((course) => (
              <div key={course.code} className="sm:grid sm:grid-cols-[1fr_2fr_1fr_1fr_1fr] flex flex-col sm:items-center px-4 sm:px-6 py-4 sm:py-3 hover:bg-[var(--color-surface-2)]/20 transition-colors">
                
                {/* Mobile: Top Row (Code + Score) */}
                <div className="flex sm:hidden justify-between items-center mb-1">
                  <div className="font-mono text-sm font-medium text-[var(--color-accent)]">{course.code}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Score: <span className="font-mono text-[var(--color-text-primary)] font-medium text-sm">{course.score}</span></div>
                </div>

                {/* Mobile: Middle Row (Title) */}
                <div className="sm:hidden text-sm text-[var(--color-text-primary)] font-medium mb-3 leading-snug">
                  {course.title}
                </div>

                {/* Mobile: Bottom Row (Units + Grade) */}
                <div className="flex sm:hidden justify-between items-center bg-[var(--color-surface-2)]/30 rounded p-2 border border-[var(--color-border)]">
                   <div className="text-xs text-[var(--color-text-muted)]">Units: <span className="text-[var(--color-text-primary)] font-medium">{course.units}</span></div>
                   <div className="text-xs text-[var(--color-text-muted)]">Grade: <span className="text-[var(--color-text-primary)] font-medium text-sm">{course.grade}</span></div>
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:block font-mono text-sm font-medium text-[var(--color-accent)]">{course.code}</div>
                <div className="hidden sm:block text-sm text-[var(--color-text-primary)]">{course.title}</div>
                <div className="hidden sm:block text-sm text-[var(--color-text-primary)] text-center">{course.units}</div>
                <div className="hidden sm:block text-sm font-semibold text-[var(--color-text-primary)] text-center">{course.grade}</div>
                <div className="hidden sm:block text-sm font-mono text-[var(--color-text-secondary)] text-right">{course.score}</div>
              </div>
            ))}
          </div>

          {/* Summary Row */}
          <div className="bg-[var(--color-surface-2)] border-t border-[var(--color-border)] px-4 sm:px-6 py-4 flex flex-wrap justify-between items-center gap-4">
             <div className="text-sm font-medium text-[var(--color-text-primary)]">
               Total Units: <span className="font-mono ml-1">14</span>
             </div>
             <div className="flex gap-6">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mr-2">Semester GPA</span>
                  <span className="font-serif text-2xl text-[var(--color-accent)] font-medium">4.21</span>
                </div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 pb-4 text-center space-y-1 page-transition-enter" style={{animationDelay: '200ms'}}>
          <p className="text-xs text-[var(--color-text-muted)]">
            This result was officially released by University Registry.
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            This link automatically expires on <span className="font-medium text-[var(--color-text-secondary)]">14 April 2025</span>. For queries, contact <a href="mailto:registry@university.edu.ng" className="text-[var(--color-accent)] hover:underline">registry@university.edu.ng</a>.
          </p>
        </div>

      </main>
    </div>
  );
}

function ErrorState({ type }: { type: 'expired' | 'not_found' }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-xl page-transition-enter">
          <div className="mx-auto w-16 h-16 rounded-full bg-[var(--color-danger-soft)] flex items-center justify-center mb-6">
            {type === 'expired' ? <AlertCircle className="h-8 w-8 text-[var(--color-danger)]" /> : <XCircle className="h-8 w-8 text-[var(--color-danger)]" />}
          </div>
          
          <h1 className="font-serif text-2xl text-[var(--color-text-primary)] mb-2">
            {type === 'expired' ? "This result link has expired" : "Invalid result link"}
          </h1>
          
          <p className="text-[var(--color-text-secondary)] text-sm mb-8">
            {type === 'expired' 
              ? "For security reasons, result notification links expire after 90 days. Please contact the Registry office for assistance if you still need access." 
              : "This link does not exist, is malformed, or access has been revoked by the institution."}
          </p>
          
          <button className="w-full py-3 rounded border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors">
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
