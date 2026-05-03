# HOD Portal & Multi-Program Results Management – Implementation Plan

**Date Created:** May 3, 2026  
**Project:** ECHELON Educational Results Management System  
**Status:** Planning Phase  
**Version:** 1.0 (Department → Program Hierarchy)

---

## Executive Summary

This document details a comprehensive expansion of the ECHELON results management system to support **Head of Department (HOD) uploads** with **multi-program hierarchies**. The system currently allows only super-admins to upload results centrally. The enhancement enables:

- **Department-scoped HOD portals** (`/hod/*` routes) where HODs upload results for specific programs within their department
- **Program-level result management**: Departments contain multiple programs (e.g., CSM dept has CS, SWE, Cybersecurity, Data Science)
- **Level-aware batching**: Each program can have independent batches per level (100, 200, 300, 400)
- **Enhanced admin portal**: System admins review, approve, and reject batches with department/program/level filtering
- **Duplicate prevention**: Blocks re-uploads of same program+level+semester unless explicitly replaced by HOD

---

## System Context

### Current State (Pre-Enhancement)

**Technology Stack:**

- **Framework:** Next.js 14+ with TypeScript
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** next-auth with JWT sessions, email/password provider
- **Data Models:**
  - `User` (super_admin role only, email/password auth)
  - `Student` (matricNumber, fullName, department: String, faculty, level: Int)
  - `ResultBatch` (session, semester, department: String, status, uploadedBy, approvedBy)
  - `StudentResult` (batchId, studentId, courses: JSON, gpa, cgpa, status)
  - `NotificationDispatch` (sends results to guardians via email/WhatsApp/SMS)

**Current Upload Flow:**

1. Super-admin → `/admin/batches/upload`
2. Upload CSV/PDF for department + semester
3. Results auto-dispatch OR pending admin approval
4. Guardians notified with portal link

**Current Role Model:**

- Only `super_admin` role exists
- All admins have full system access

---

## Requirements & Design Decisions

### Operational Structure

**Question: How are HODs organized?**

- **Answer:** HODs manage full departments, which contain multiple programs
  - Example: CSM (Computer Science & Mathematics) Department
    - Program 1: Computer Science (CS)
    - Program 2: Software Engineering (SWE)
    - Program 3: Cybersecurity (CYB)
    - Program 4: Data Science (DS)

**Question: What do HODs upload?**

- **Answer:** Results for specific program at specific level, each upload
  - Selection required: Program + Level (100/200/300/400)
  - Not department-wide; per-program per-level

**Question: How is student program tracked?**

- **Answer:** Not stored on Student model; HOD specifies program when uploading
  - CSV doesn't need program column; HOD selects in form
  - Program is stored in ResultBatch.programId

**Question: Who approves?**

- **Answer:** Per-program approval by super_admin
  - Each program's batch reviewed independently
  - No department-wide approval workflow

---

## Architecture Design

### New Data Model: Department → Program → Level Hierarchy

```
Institution
  ├── Department
  │   ├── code: "CSM"
  │   ├── name: "Computer Science & Mathematics"
  │   ├── programs: [Program]
  │   └── users: [User] (HODs assigned here)
  │
  ├── Program
  │   ├── code: "CS"
  │   ├── name: "Computer Science"
  │   ├── departmentId: "CSM"
  │   └── resultBatches: [ResultBatch]
  │
  ├── User (role=hod)
  │   ├── email, name, passwordHash
  │   ├── role: "hod"
  │   └── departmentId: "CSM" (HOD for full dept, can upload for all programs)
  │
  └── ResultBatch
      ├── programId: "CS" (NOT department string)
      ├── level: 200 (NEW field)
      ├── session, semester
      ├── unique constraint: (programId, session, semester, level)
      └── uploadedById, approvedById
```

### Authentication & Authorization

**Roles:**

- `super_admin`: Full system access, can create HODs, approve batches
- `hod`: Department-scoped, can upload for programs in their dept, view own batches

**Session:**

```typescript
// Session structure for both roles
{
  user: {
    id: string
    email: string
    role: "super_admin" | "hod"
    departmentId?: string  // present only for HOD
  }
}
```

**Route Guards:**

- `/admin/*` – requires role=super_admin
- `/hod/*` – requires role=hod AND departmentId present in session
- `/sign-in` – public

---

## Implementation Plan (3 Phases)

### Phase 1: Foundation – Schema & Authentication (Weeks 1-2)

**Goal:** Establish database relationships, HOD role support, session layer

#### 1.1: Prisma Schema Migration

**New Models:**

```prisma
model Department {
  id            String      @id @default(cuid())
  institutionId String
  institution   Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)
  code          String      // "CSM"
  name          String      // "Computer Science & Mathematics"
  programs      Program[]
  users         User[]      // HODs
  createdAt     DateTime    @default(now())

  @@unique([institutionId, code])
  @@index([institutionId])
}

model Program {
  id            String      @id @default(cuid())
  departmentId  String
  department    Department  @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  code          String      // "CS", "SWE", etc.
  name          String      // "Computer Science", "Software Engineering"
  resultBatches ResultBatch[]
  createdAt     DateTime    @default(now())

  @@unique([departmentId, code])
  @@index([departmentId])
}
```

**Updated Models:**

```prisma
// User model
model User {
  // ... existing fields ...
  role          String      @default("super_admin")  // change: allow "hod"
  departmentId  String?     // NEW: nullable, set for HOD
  department    Department? @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  // ... rest unchanged ...

  @@index([institutionId, role, departmentId])
}

// ResultBatch model
model ResultBatch {
  id            String      @id @default(cuid())
  institutionId String
  institution   Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)

  // CHANGED: department: String → programId: String
  programId     String      // NEW: FK to Program
  program       Program     @relation(fields: [programId], references: [id], onDelete: Restrict)

  session       String
  semester      Semester
  level         Int         // NEW: 100, 200, 300, 400
  status        BatchStatus @default(PENDING)
  uploadedById  String
  uploadedBy    User        @relation("UploadedBy", fields: [uploadedById], references: [id], onDelete: Restrict)
  uploadedAt    DateTime    @default(now())
  approvedById  String?
  approvedBy    User?       @relation("ApprovedBy", fields: [approvedById], references: [id], onDelete: SetNull)
  approvedAt    DateTime?
  // ... rest unchanged ...

  @@unique([programId, session, semester, level])  // CHANGED: per-program uniqueness
  @@index([institutionId, status])
  @@index([uploadedAt])
  @@index([programId, status])
}
```

**Migration Steps:**

1. Create Department and Program tables
2. Add departmentId to User, add FK
3. Add programId to ResultBatch (initially nullable), add FK
4. Add level to ResultBatch (nullable initially)
5. Seed initial departments and programs
6. Backfill ResultBatch.programId (manual assignment or infer from metadata)
7. Make programId and level NOT NULL, drop old department column

#### 1.2: Authentication Enhancements

**File: `src/types/next-auth.d.ts`**

```typescript
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "super_admin" | "hod";
      departmentId?: string; // present if role=hod
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "super_admin" | "hod";
    departmentId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "super_admin" | "hod";
    departmentId?: string;
  }
}
```

**File: `src/lib/auth.ts` (update authorize callback)**

```typescript
async authorize(credentials) {
  const parsed = credentialsSchema.safeParse(credentials);
  if (!parsed.success) return null;

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,      // "super_admin" or "hod"
      departmentId: true,
      passwordHash: true,
    },
  });

  if (!user) return null;  // removed: role !== "super_admin" check

  const isValidPassword = await bcrypt.compare(
    parsed.data.password,
    user.passwordHash,
  );
  if (!isValidPassword) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,  // "super_admin" or "hod"
    departmentId: user.departmentId ?? undefined,
  };
}
```

#### 1.3: HOD Session Helpers

**New File: `src/lib/hod-session.ts`**

```typescript
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { getAuthSession } from "@/lib/auth";

export type HodSession = Session & {
  user: NonNullable<Session["user"]> & {
    id: string;
    role: "hod";
    departmentId: string; // always present for HOD
  };
};

export async function getHodSession(): Promise<HodSession | null> {
  const session = await getAuthSession();
  if (
    !session?.user ||
    session.user.role !== "hod" ||
    !session.user.departmentId
  ) {
    return null;
  }
  return session as HodSession;
}

export async function requireHodSession(): Promise<HodSession> {
  const session = await getHodSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}

export type AdminSession = Session & {
  user: NonNullable<Session["user"]> & {
    id: string;
    role: "super_admin";
  };
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "super_admin") {
    return null;
  }
  return session as AdminSession;
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}
```

#### 1.4: Role-Based Query Filters

**New File: `src/lib/query-filters.ts`**

```typescript
import type { Session } from "next-auth";
import { Prisma } from "@prisma/client";

export function filterBatchesByUserRole(user: Session["user"]) {
  if (user.role === "super_admin") {
    // No filter; super_admin sees all
    return {};
  }

  if (user.role === "hod" && user.departmentId) {
    // HOD sees only batches from programs in their department
    return {
      program: {
        departmentId: user.departmentId,
      },
    };
  }

  // Fallback: no access
  return { programId: "INVALID" };
}

export function filterProgramsByUserRole(user: Session["user"]) {
  if (user.role === "super_admin") {
    return {}; // All programs
  }

  if (user.role === "hod" && user.departmentId) {
    return { departmentId: user.departmentId };
  }

  return { id: "INVALID" };
}
```

#### 1.5: Middleware (Route Guards)

**Update: `proxy.ts`** (or create new `src/middleware-hod.ts`)

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const path = request.nextUrl.pathname;

  // /admin/* requires super_admin
  if (path.startsWith("/admin")) {
    if (!token || token.role !== "super_admin") {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(signInUrl);
    }
  }

  // /hod/* requires hod role AND departmentId
  if (path.startsWith("/hod")) {
    if (!token || token.role !== "hod" || !token.departmentId) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/hod/:path*"],
};
```

---

### Phase 2: HOD Portal – Upload & Batch Management (Weeks 3-5)

**Goal:** Build HOD-facing pages and APIs

#### 2.1: Directory Structure

```
src/app/hod/
  layout.tsx
  dashboard/
    page.tsx
  batches/
    page.tsx
    upload/
      page.tsx
    [batchId]/
      page.tsx

src/app/api/hod/
  batches/
    upload/route.ts
    [batchId]/
      cancel/route.ts

src/components/
  layout/
    hod-sidebar.tsx
  features/
    hod/
      batch-upload-form.tsx
      level-duplicate-check.tsx
      hod-batch-card.tsx
```

#### 2.2: Validation Utilities

**New File: `src/lib/hod-upload-validation.ts`**

```typescript
import { prisma } from "@/lib/db";

export async function validateLevelConsistency(
  studentRows: Array<{ level: number }>,
): Promise<{ valid: boolean; message?: string }> {
  if (studentRows.length === 0) {
    return { valid: false, message: "No student records found" };
  }

  const levels = new Set(studentRows.map((row) => row.level));
  if (levels.size > 1) {
    return {
      valid: false,
      message: `Mixed levels detected: ${Array.from(levels).join(", ")}. All students must be at the same level.`,
    };
  }

  return { valid: true };
}

export async function checkDuplicateBatch(
  programId: string,
  session: string,
  semester: string,
  level: number,
) {
  const existing = await prisma.resultBatch.findFirst({
    where: { programId, session, semester, level },
    select: { id: true, uploadedAt: true, status: true },
  });

  return existing;
}

export async function getProgramsForHod(departmentId: string) {
  return prisma.program.findMany({
    where: { departmentId },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });
}
```

#### 2.3: HOD Upload API

**New File: `src/app/api/hod/batches/upload/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHodSession } from "@/lib/hod-session";
import {
  parseStudentRowsFromCsv,
  parseStudentRowsFromPdf,
} from "@/lib/result-import";
import {
  validateLevelConsistency,
  checkDuplicateBatch,
  getProgramsForHod,
} from "@/lib/hod-upload-validation";

export async function POST(request: Request) {
  const session = await getHodSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { error: "Invalid multipart payload." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  const programId = String(formData.get("programId") ?? "").trim();
  const sessionLabel = String(formData.get("session") ?? "").trim();
  const semester = String(formData.get("semester") ?? "")
    .trim()
    .toUpperCase();
  const levelStr = String(formData.get("level") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Result file (CSV or PDF) is required." },
      { status: 400 },
    );
  }

  const level = parseInt(levelStr, 10);
  if (!programId || !sessionLabel || !semester || isNaN(level)) {
    return NextResponse.json(
      {
        error: "programId, session, semester, and level are required.",
      },
      { status: 400 },
    );
  }

  // Verify program belongs to HOD's department
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { departmentId: true, code: true, name: true },
  });

  if (!program || program.departmentId !== session.user.departmentId) {
    return NextResponse.json(
      { error: "Program not found or unauthorized." },
      { status: 403 },
    );
  }

  // Parse file
  const isPdf = file.name.toLowerCase().endsWith(".pdf");
  let studentRows: any[] = [];
  try {
    if (isPdf) {
      const buffer = Buffer.from(await file.arrayBuffer());
      studentRows = await parseStudentRowsFromPdf(buffer, program.name);
    } else {
      const text = await file.text();
      studentRows = await parseStudentRowsFromCsv(text, program.name);
    }
  } catch (error) {
    console.error("[HOD upload] Parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse file. Check CSV/PDF format." },
      { status: 422 },
    );
  }

  if (studentRows.length === 0) {
    return NextResponse.json(
      { error: "No valid student records extracted from file." },
      { status: 422 },
    );
  }

  // Validate level consistency
  const levelCheck = await validateLevelConsistency(studentRows);
  if (!levelCheck.valid) {
    return NextResponse.json({ error: levelCheck.message }, { status: 422 });
  }

  // Check duplicate
  const duplicate = await checkDuplicateBatch(
    programId,
    sessionLabel,
    semester,
    level,
  );

  if (duplicate) {
    return NextResponse.json(
      {
        batchId: null,
        isDuplicate: true,
        existingBatchId: duplicate.id,
        existingStatus: duplicate.status,
        existingUploadDate: duplicate.uploadedAt,
        message: `A batch already exists for ${program.name} Level ${level} in ${semester} ${sessionLabel}.`,
        studentCount: studentRows.length,
      },
      { status: 409 },
    );
  }

  // Create batch
  const db = prisma as any;
  const actor = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, institutionId: true },
  });

  if (!actor) {
    return NextResponse.json(
      { error: "Authenticated user not found." },
      { status: 404 },
    );
  }

  const batch = await db.$transaction(
    async (tx: any) => {
      const createdBatch = await tx.resultBatch.create({
        data: {
          institutionId: actor.institutionId,
          programId,
          session: sessionLabel,
          semester,
          level,
          status: "PENDING",
          uploadedById: actor.id,
          source: isPdf ? "pdf" : "csv",
          rawFileUrl: null,
        },
      });

      // Process students (same as admin upload)
      for (const row of studentRows) {
        const student = await tx.student.upsert({
          where: { matricNumber: row.matricNumber },
          update: {
            fullName: row.studentName,
            department: row.department, // Keep for compatibility
            faculty: row.faculty,
            level: row.level,
          },
          create: {
            institutionId: actor.institutionId,
            matricNumber: row.matricNumber,
            fullName: row.studentName,
            department: row.department,
            faculty: row.faculty,
            level: row.level,
          },
        });

        // Update or create guardian
        const guardian = await tx.guardian.findFirst({
          where: { studentId: student.id },
        });

        if (guardian) {
          await tx.guardian.update({
            where: { id: guardian.id },
            data: {
              name: row.parentName ?? guardian.name,
              relationship: row.relationship,
              email: row.parentEmail ?? guardian.email,
              phone: row.parentPhone ?? guardian.phone,
            },
          });
        } else {
          await tx.guardian.create({
            data: {
              studentId: student.id,
              name: row.parentName ?? `${row.studentName} Guardian`,
              relationship: row.relationship,
              email: row.parentEmail,
              phone: row.parentPhone,
            },
          });
        }

        // Create result
        await tx.studentResult.create({
          data: {
            batchId: createdBatch.id,
            studentId: student.id,
            courses: row.courses,
            gpa: row.gpa,
            cgpa: row.cgpa ?? null,
            status: "PENDING",
          },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          institutionId: actor.institutionId,
          actorId: actor.id,
          action: "batch.uploaded",
          entityType: "result_batch",
          entityId: createdBatch.id,
          metadata: {
            filename: file.name,
            studentCount: studentRows.length,
            programId,
            level,
            uploadedByRole: "hod",
          },
        },
      });

      return createdBatch;
    },
    { timeout: 60000 },
  );

  return NextResponse.json({
    batchId: batch.id,
    programId,
    level,
    uploadedRows: studentRows.length,
    isDuplicate: false,
  });
}
```

#### 2.4: HOD Pages

**New File: `src/app/hod/layout.tsx`**

```typescript
import type { ReactNode } from "react";
import { requireHodSession } from "@/lib/hod-session";
import { HodSidebar } from "@/components/layout/hod-sidebar";
import { SidebarProvider } from "@/providers/sidebar-provider";

type HodLayoutProps = {
  children: ReactNode;
};

export default async function HodLayout({ children }: HodLayoutProps) {
  const session = await requireHodSession();

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <HodSidebar
          email={session.user.email}
          name={session.user.name}
          departmentId={session.user.departmentId}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
```

**New File: `src/app/hod/batches/upload/page.tsx`** (similar to admin upload, but with program field)

**New File: `src/app/hod/batches/page.tsx`** (list HOD's own batches)

**New File: `src/app/hod/batches/[batchId]/page.tsx`** (detail view, can cancel/resubmit)

#### 2.5: Components

**New File: `src/components/features/hod/batch-upload-form.tsx`**

- Form fields: Session, Semester, **Program dropdown** (loads from `/api/hod/programs`), **Level**
- File upload
- Duplicate warning modal
- Call `/api/hod/batches/upload`

---

### Phase 3: Admin Portal Enhancements (Weeks 6-8)

**Goal:** Admin features for HOD management and enhanced batch approval

#### 3.1: Admin User Management

**New File: `src/app/admin/settings/users/page.tsx`**

- List users (super_admin, hod)
- Create new HOD:
  - Form: name, email, password, department (dropdown)
  - POST `/api/admin/users/create`
- Edit HOD: change department, deactivate

**New File: `src/app/api/admin/users/create/route.ts`**

```typescript
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/hod-session";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  departmentId: z.string().optional(), // null for super_admin
  role: z.enum(["super_admin", "hod"]),
});

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { name, email, password, departmentId, role } = parsed.data;

  // Verify email is unique
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 },
    );
  }

  // If role=hod, verify departmentId
  if (role === "hod" && !departmentId) {
    return NextResponse.json(
      { error: "Department required for HOD role" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      institutionId: session.user.institutionId,
      name,
      email,
      passwordHash,
      role,
      departmentId: role === "hod" ? departmentId : null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
```

#### 3.2: Enhanced Admin Batch List

**Update: `src/app/admin/batches/page.tsx`**

- Add filter dropdowns: Department → Program (cascading) → Level
- Load programs via `/api/admin/programs/[deptId]/list`

**New File: `src/app/api/admin/programs/[departmentId]/list/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/hod-session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ departmentId: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { departmentId } = await params;

  const programs = await prisma.program.findMany({
    where: { departmentId },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(programs);
}
```

#### 3.3: Batch Rejection Workflow

**New File: `src/app/api/batches/[batchId]/reject/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/hod-session";
import { sendEmail } from "@/lib/notifications/email-provider";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const reason = body?.reason ?? "Batch does not meet approval criteria.";

  const { batchId } = await params;

  const batch = await prisma.resultBatch.findUnique({
    where: { id: batchId },
    include: {
      uploadedBy: { select: { email: true, name: true } },
      program: { select: { name: true, code: true } },
    },
  });

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  // Update batch status
  await prisma.resultBatch.update({
    where: { id: batchId },
    data: {
      status: "REJECTED",
      // Store reason in metadata or new field
    },
  });

  // Send email to HOD
  await sendEmail({
    to: batch.uploadedBy.email,
    subject: `Batch Rejected: ${batch.program.name} Level ${batch.level}`,
    text: `Your batch for ${batch.program.name} Level ${batch.level} (${batch.session} ${batch.semester}) has been rejected.\n\nReason: ${reason}\n\nPlease review and resubmit.`,
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      institutionId: batch.institutionId,
      actorId: session.user.id,
      action: "batch.rejected",
      entityType: "result_batch",
      entityId: batchId,
      metadata: { reason },
    },
  });

  return NextResponse.json({
    batchId,
    status: "REJECTED",
    message: "Batch rejected and HOD notified.",
  });
}
```

---

## Data Flow Examples

### Scenario 1: HOD Uploads for Software Engineering Level 200

```
1. HOD logs into /hod/batches/upload
2. Form loads programs: [Computer Science, Software Engineering, Cybersecurity, Data Science]
3. Selects:
   - Session: 2024/2025
   - Semester: First
   - Program: Software Engineering
   - Level: 200
4. Uploads CSV with SWE students, all at Level 200
5. API validates:
   ✓ Program belongs to HOD's dept (CSM)
   ✓ All students are Level 200
   ✗ No duplicate (programId=SWE, level=200, semester=First, session=2024/2025)
6. Batch created: status=PENDING, programId=SWE, level=200
7. HOD sees batch in /hod/batches list with status "Pending Admin Review"
8. Admin logs in, filters: Dept=CSM, Program=SWE, Level=200
9. Sees HOD's batch, clicks to open detail
10. Reviews students, clicks "Approve & Dispatch"
11. Batch status → APPROVED, dispatch queued
12. HOD receives email: "Your SWE Level 200 batch has been approved"
```

### Scenario 2: Multiple Programs in Same Department

```
1. HOD for CSM has programs: [CS, SWE, CYB, DS]
2. Uploads CS Level 200 → batch created, programId=CS
3. Uploads SWE Level 200 → batch created, programId=SWE (no conflict!)
4. Admin filters: Dept=CSM → sees both batches
5. Admin can approve CS first, SWE later
6. Each program's batch is independent
```

### Scenario 3: Duplicate Upload Prevention

```
1. HOD uploads: SWE Level 200, Semester 1, 2024/2025
2. Later, tries same upload
3. API detects duplicate (same programId, level, semester, session)
4. Returns: { isDuplicate: true, existingBatchId: "...", message: "..." }
5. Frontend shows modal: "Batch exists for SWE Level 200. Replace?"
6. If HOD confirms, old batch marked archived, new one created
7. Only new batch visible in HOD's batch list
```

---

## Database Seed Data

**Initial Setup (migration should include):**

```sql
-- Create Institution (assuming exists)
-- INSERT INTO "Institution" (id, name) VALUES (...);

-- Create Departments
INSERT INTO "Department" (id, "institutionId", code, name)
VALUES
  ('dept-csm', 'inst-mtu', 'CSM', 'Computer Science & Mathematics'),
  ('dept-eng', 'inst-mtu', 'ENG', 'Engineering'),
  ('dept-lib', 'inst-mtu', 'LIB', 'Liberal Arts');

-- Create Programs
INSERT INTO "Program" (id, "departmentId", code, name)
VALUES
  ('prog-cs', 'dept-csm', 'CS', 'Computer Science'),
  ('prog-swe', 'dept-csm', 'SWE', 'Software Engineering'),
  ('prog-cyb', 'dept-csm', 'CYB', 'Cybersecurity'),
  ('prog-ds', 'dept-csm', 'DS', 'Data Science'),
  ('prog-ce', 'dept-eng', 'CE', 'Civil Engineering'),
  ('prog-ee', 'dept-eng', 'EE', 'Electrical Engineering');

-- Create HOD user
INSERT INTO "User" (id, "institutionId", role, "departmentId", name, email, "passwordHash")
VALUES
  ('user-hod-csm', 'inst-mtu', 'hod', 'dept-csm', 'Dr. Jane Smith', 'jane.smith@mtu.edu', '<hashed>');
```

---

## Verification Checklist

### Phase 1 Verification

- [ ] **Prisma Migration**
  - [ ] Department table created with correct schema
  - [ ] Program table created with FK to Department
  - [ ] User.departmentId added, nullable
  - [ ] ResultBatch.programId added, FK to Program
  - [ ] ResultBatch.level added as Int
  - [ ] Unique constraint on (programId, session, semester, level) works
  - [ ] Seed data inserted (3 depts, 6 programs)

- [ ] **Auth**
  - [ ] Super_admin login works, session.role = "super_admin"
  - [ ] HOD login works, session.role = "hod", session.departmentId set
  - [ ] JWT includes role and departmentId

- [ ] **Middleware**
  - [ ] /admin/\* blocks if role ≠ super_admin
  - [ ] /hod/\* blocks if role ≠ hod or no departmentId
  - [ ] Redirects to /sign-in with callbackUrl

### Phase 2 Verification

- [ ] **HOD Upload**
  - [ ] Form loads programs from HOD's department
  - [ ] Level dropdown shows [100, 200, 300, 400]
  - [ ] File upload triggers validation
  - [ ] Level consistency check passes/fails correctly
  - [ ] Duplicate detection warns HOD
  - [ ] Batch created with correct programId and level

- [ ] **HOD Batch List**
  - [ ] Shows only HOD's own batches
  - [ ] Status badges show PENDING, APPROVED, DISPATCHED
  - [ ] Links to batch detail

- [ ] **HOD Batch Detail**
  - [ ] Shows program name, level, student count
  - [ ] Lists students with GPA/CGPA
  - [ ] Cancel button works
  - [ ] Resubmit button available if rejected

### Phase 3 Verification

- [ ] **Admin User Management**
  - [ ] Super_admin can create new HOD
  - [ ] Department dropdown populated
  - [ ] Password hashed correctly
  - [ ] Created HOD can login, departmentId in session

- [ ] **Admin Batch Filters**
  - [ ] Department dropdown populated from DB
  - [ ] Program dropdown cascades (loads on dept select)
  - [ ] Level dropdown shows unique levels
  - [ ] Filters work together

- [ ] **Admin Batch Detail**
  - [ ] Shows program and level prominently
  - [ ] Student table with all columns visible
  - [ ] Approve button works
  - [ ] Reject button opens modal, sends email
  - [ ] Approval email sent to HOD

---

## Potential Risks & Mitigations

| Risk                                                          | Impact                    | Mitigation                                                                        |
| ------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------- |
| Backfill migration fails (existing batches missing programId) | Data loss, broken batches | Test migration on copy first; manual program assignment if needed                 |
| Program dropdown slow with many programs                      | UX degradation            | Lazy-load programs; pagination on dropdown                                        |
| HOD uploads wrong program                                     | Wrong batch created       | Validate programId belongs to HOD's dept; clear UI with program name confirmation |
| Duplicate uniqueness broken by old data                       | Constraint conflicts      | Data cleanup before adding constraint                                             |
| Large batch causes pagination issues                          | Performance               | Implement cursor-based pagination; limit initial load to 50 students              |
| HOD forgets which programs they manage                        | User confusion            | Show program list in dashboard; sidebar displays program count                    |

---

## Implementation Sequence & Dependencies

### Critical Path

1. **Prisma migration** (foundation)
2. **Auth updates** (enable HOD role)
3. **Session helpers** (route guards)
4. **HOD upload API** (core logic)
5. **HOD UI pages** (UX layer)
6. **Admin user mgmt** (enable HOD creation)
7. **Admin batch filters** (operational workflow)
8. **Batch rejection** (quality control)

### Parallelizable Tasks

- HOD sidebar + layout can be built while upload API finalizes
- Admin filter enhancements can start after batch list API confirmed
- Seed data scripts can be prepared while schema is finalized

---

## Decisions & Trade-offs

1. **Department → Program hierarchy**
   - Supports operational reality (departments have multiple programs)
   - Enables per-program batch management
   - Trade: Slight schema complexity vs. operational clarity

2. **HOD assigned at department level (not program level)**
   - Simpler: one HOD per dept manages all programs
   - Trade: Can't restrict HOD to single program; future enhancement possible

3. **No auto-dispatch for HODs**
   - Ensures admin review before sending to guardians
   - Trade: Slower workflow, adds human bottleneck

4. **Program selection in form (not inferred from CSV)**
   - Explicit; prevents ambiguity
   - Trade: One upload per program; HOD can't batch multiple programs

5. **Duplicate detection per program (not department)**
   - Multiple programs can have same level without conflict
   - Trade: More complex uniqueness logic, but more flexible

6. **Separate /hod route vs. /admin**
   - Clear separation of concerns; different UX for each role
   - Trade: Code duplication in some components (sidebar, layout)

---

## Future Considerations (Out of Scope)

1. **Program-scoped HODs**: Allow HOD to manage single program only
2. **Coordinator role**: Review-only access for each program
3. **Batch versioning**: Track all uploads; allow rollback
4. **Scheduled uploads**: HODs schedule uploads for specific dates
5. **Bulk HOD creation**: CSV import for initial setup
6. **Analytics per program**: Upload frequency, approval rates, delivery success
7. **Program settings**: Course requirements, prerequisites, graduation rules
8. **Approval hierarchy**: Dean reviews dept-wide approvals before final dispatch

---

## File Inventory

### Schema & Migrations

- `prisma/schema.prisma` (MODIFY)
- `prisma/migrations/[timestamp]_add_program_hierarchy/migration.sql` (NEW)
- `prisma/seeds/departments-programs.ts` (NEW, optional)

### Authentication & Session

- `src/lib/hod-session.ts` (NEW)
- `src/lib/query-filters.ts` (NEW)
- `src/types/next-auth.d.ts` (MODIFY)
- `src/lib/auth.ts` (MODIFY)
- `proxy.ts` or middleware configuration (MODIFY)

### HOD Portal

- `src/app/hod/layout.tsx` (NEW)
- `src/app/hod/dashboard/page.tsx` (NEW)
- `src/app/hod/batches/page.tsx` (NEW)
- `src/app/hod/batches/upload/page.tsx` (NEW)
- `src/app/hod/batches/[batchId]/page.tsx` (NEW)
- `src/app/api/hod/batches/upload/route.ts` (NEW)
- `src/app/api/hod/batches/[batchId]/cancel/route.ts` (NEW)
- `src/app/api/hod/programs/route.ts` (NEW)

### Admin Portal Enhancements

- `src/app/admin/settings/users/page.tsx` (NEW)
- `src/app/api/admin/users/create/route.ts` (NEW)
- `src/app/api/admin/users/[userId]/update/route.ts` (NEW)
- `src/app/api/admin/programs/[departmentId]/list/route.ts` (NEW)
- `src/app/api/batches/[batchId]/reject/route.ts` (NEW)
- `src/app/admin/batches/page.tsx` (MODIFY – add filters)
- `src/app/admin/batches/[batchId]/page.tsx` (MODIFY – enhanced detail)

### Components

- `src/components/layout/hod-sidebar.tsx` (NEW)
- `src/components/features/hod/batch-upload-form.tsx` (NEW)
- `src/components/features/hod/level-duplicate-check.tsx` (NEW)
- `src/components/features/hod/hod-batch-card.tsx` (NEW)

### Utilities

- `src/lib/hod-upload-validation.ts` (NEW)

---

## Getting Help Later

When sharing this plan with another AI, provide:

1. **This entire document** as context
2. **Current schema** from `prisma/schema.prisma`
3. **Existing auth setup** from `src/lib/auth.ts`
4. **Existing upload flow** from `src/app/api/batches/upload/route.ts`
5. **Codebase structure** from workspace explorer

Key context to communicate:

- Current system has only super_admin role; HOD role is new
- Department/Program hierarchy is new; currently departments are strings
- Level field on ResultBatch is new
- Duplicate prevention based on (programId, session, semester, level) is new

---

**Version History:**

- **1.0** (May 3, 2026): Initial plan with Department → Program hierarchy, HOD portal, admin enhancements
