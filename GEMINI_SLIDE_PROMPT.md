# GEMINI PROMPT — ECHELON Presentation Slides

---

## INSTRUCTIONS FOR GEMINI

You are a professional presentation designer. I need you to generate a **10–14 slide presentation** for a software project called **ECHELON**. The presentation should be:

- **Audience:** University stakeholders, technical panel, product reviewers
- **Tone:** Professional, modern, clean. Corporate-tech feel.
- **Style:** Each slide should have a **clear headline**, **1–3 bullet point groups**, and optionally a **diagram box or icon suggestion** in the notes
- **Design direction:** Dark navy/slate background with gold or electric-blue accents. Use icons where applicable. Avoid large walls of text — think Apple keynote density.
- **Font pairing:** Bold sans-serif for headings (e.g. Inter or Montserrat), regular for body
- **Every slide content is specified below** — follow the structure exactly, but feel free to make the wording crisper

---

## PROJECT OVERVIEW (Read before designing slides)

**ECHELON** is a production-grade **academic result notification management platform** built for Mountain Top University (MTU). It replaces the old manual/email workflow of releasing student exam results with a fully digital, multi-channel, auditable pipeline.

The tagline is: *"Result notification management with a cleaner, calmer workflow."*

The system is built on:
- **Next.js 16.2.4** (App Router, React Server Components, TypeScript)
- **PostgreSQL** via **Prisma 7.8.0** (hosted on Neon — serverless Postgres)
- **Upstash QStash** — job queue for async notification dispatch
- **UltraMsg** — WhatsApp message delivery
- **BulkSMS Nigeria** — SMS delivery
- **Nodemailer / Resend** — Email delivery
- **pdf-lib** — server-side PDF generation (official result documents)
- **shadcn/ui + Tailwind CSS 4** — UI
- **NextAuth.js** — Role-based authentication (super_admin, hod)

---

## SLIDES — COMPLETE CONTENT SPECIFICATION

---

### SLIDE 1 — TITLE SLIDE

**Headline:** ECHELON

**Subtitle:** Academic Result Notification Management System

**Body / tagline:**
*"A cleaner, calmer workflow for result release and parent notification"*

**Supporting line:**
Built for Mountain Top University — powered by Next.js, PostgreSQL, and multi-channel delivery

**Visual suggestion:**
- Center the ECHELON wordmark in large bold type
- Below it, a slim horizontal accent line in gold
- Background: deep navy gradient
- Bottom-left: University name / institution logo placeholder
- Bottom-right: version tag "v1.0" or current year

---

### SLIDE 2 — THE PROBLEM

**Headline:** The Problem With How Results Are Released Today

**Section A — Manual & Fragmented**
- Results are communicated manually via notice boards, bulk SMS blasts, or informal emails
- No single system tracks whether a parent actually received and viewed their ward's result
- HODs upload data in inconsistent formats — spreadsheets, PDFs, paper sheets

**Section B — No Accountability**
- No audit trail: who approved what result, when, and why a result was withheld — all unknown
- Duplicate or conflicting result uploads go undetected
- No way to re-send or retry if a notification fails

**Section C — Guardian Experience is Poor**
- Parents often hear about results from students secondhand
- No secure, verifiable copy of the official result document
- No expiry or access control on result links

**Visual suggestion:**
A 3-column "pain point" layout with a red/orange warning icon above each column. Or a single illustration of a broken chain.

---

### SLIDE 3 — THE SOLUTION

**Headline:** ECHELON: One Platform, End-to-End

**Intro line:** ECHELON digitises the entire result release pipeline — from HOD upload to guardian notification — with full visibility at every step.

**Three pillars (icon + label + one-liner each):**

1. **Upload & Ingest**
   HODs upload results as CSV or PDF. The system auto-parses, normalises course data, and calculates GPA — no manual entry.

2. **Review & Approve**
   Admins review each student's result before release. Individual results can be approved, withheld (with reason), or flagged. Nothing goes out without sign-off.

3. **Notify & Deliver**
   On dispatch, every guardian receives the result via Email, WhatsApp, and SMS simultaneously — with a secure link to a digitally generated PDF result document.

**Visual suggestion:**
A left-to-right horizontal flow diagram: [Upload] → [Review] → [Approve] → [Dispatch] → [Notify] → [View PDF]
Each node as a rounded box with an icon. Arrow connectors between them.

---

### SLIDE 4 — SYSTEM ARCHITECTURE

**Headline:** How It's Built — Architecture Overview

**Layer 1 — Frontend (Browser)**
- Next.js 16 App Router with React Server Components
- shadcn/ui + Tailwind CSS 4 — full admin dashboard, HOD portal, public result viewer
- Role-based routing: `/admin/*` (super admin), `/hod/*` (department heads), `/results/view` (public)

**Layer 2 — API (Next.js API Routes)**
- 30+ REST endpoints for batches, approvals, dispatch, delivery logs, users, audit
- Server Actions for form submissions
- QStash webhook: `POST /api/workers/notify`

**Layer 3 — Data (Prisma + PostgreSQL)**
- Hosted on **Neon** (serverless Postgres)
- 12 database models: Institution, User, Student, Guardian, StudentResult, ResultBatch, PortalToken, NotificationDispatch, NotificationLog, AuditLog, Department, Program

**Layer 4 — Async Queue (Upstash QStash)**
- Dispatch jobs are enqueued per student result
- QStash invokes the worker webhook reliably with retries
- Decouples dispatch trigger from actual message delivery

**Layer 5 — Notification Providers**
- Email: Nodemailer (SMTP/Gmail) or Resend API
- WhatsApp: UltraMsg API
- SMS: BulkSMS Nigeria API

**Visual suggestion:**
A layered architecture diagram (5 horizontal bands stacked). Each band labelled and colour-coded. Arrows showing data flow downward and callbacks upward.

---

### SLIDE 5 — DATABASE DESIGN

**Headline:** Data Model — What Gets Stored

**Core entities and their relationships (describe as a mini ERD or bulleted hierarchy):**

**Institution** (root)
  ↳ has many **Department**
       ↳ has many **Program**
            ↳ has many **ResultBatch** (per session/semester/level)
                 ↳ has many **StudentResult**
                      ↳ belongs to **Student**
                           ↳ has many **Guardian** (parents)
                      ↳ has many **PortalToken** (secure links)

**NotificationDispatch** (1 per batch dispatch event)
  ↳ has many **NotificationLog** (1 per channel per student per dispatch)

**AuditLog** (1 per action, actor + entity + metadata)

**Key fields to highlight:**
- `StudentResult.courses` — JSON array: `[{code, title, unit, grade, score}]`
- `StudentResult.status` — PENDING / APPROVED / WITHHELD
- `ResultBatch.status` — PENDING → IN_REVIEW → APPROVED → DISPATCHED
- `PortalToken.expiresAt` — configurable (default 30 days), invalidatable
- `NotificationLog.channel` — WHATSAPP / EMAIL / SMS
- `NotificationLog.status` — QUEUED / SENT / FAILED

**Visual suggestion:**
A simplified ERD diagram with 6–7 boxes (Institution, ResultBatch, StudentResult, Student, Guardian, PortalToken, NotificationLog). Lines showing relationships with crow's-foot notation.

---

### SLIDE 6 — RESULT LIFECYCLE

**Headline:** The Result Lifecycle — From Upload to Parent's Hands

**Step 1 — HOD Uploads**
HOD logs in, selects department, program, session, semester, and uploads a CSV or PDF. The system parses courses, calculates GPA, and creates a ResultBatch in `PENDING` status.

**Step 2 — Admin Reviews**
Super admin opens the batch, reviews every student's result. Approves or withholds individual records. Approved records move to `APPROVED` status.

**Step 3 — Batch Approved & Dispatched**
Admin approves the entire batch. This creates a `NotificationDispatch` record in `QUEUED` status and enqueues one QStash job per student result.

**Step 4 — Async Worker Processes Jobs**
For each job, the worker: (a) generates a secure 30-day portal token, (b) constructs the personalised message, (c) fires Email + WhatsApp + SMS to all registered guardians simultaneously.

**Step 5 — Guardian Receives Notification**
Each message contains the student name, matric number, semester, and a unique portal link: `https://echelon.app/results/view?token=XXXX`

**Step 6 — Guardian Views Result**
The portal validates the token (not expired, not invalidated), generates the official MTU-format PDF on the fly using `pdf-lib`, and renders it in the browser. No login required.

**Visual suggestion:**
A numbered vertical flow chart (6 steps) with an icon per step. Or a timeline-style horizontal strip. Colour-code each step.

---

### SLIDE 7 — MULTI-CHANNEL NOTIFICATION ENGINE

**Headline:** Reaching Every Parent — Three Channels, One Dispatch

**Overview line:**
Every dispatch fires all three channels simultaneously. Each attempt is individually logged. Failures are retried without resending successful ones.

**Channel 1 — Email**
- Provider: Nodemailer (SMTP/Gmail) with IPv4 enforcement, or Resend API as alternative
- Content: Plain-text with student name, matric, semester, portal link
- Fallback: Resend API if SMTP unconfigured

**Channel 2 — WhatsApp**
- Provider: UltraMsg API (third-party WhatsApp Business wrapper)
- No recipient opt-in required
- Nigerian phone number normalisation: `0xxxxxxxxxx → +234xxxxxxxxxx`
- Message: Personalised plain text with embedded portal link

**Channel 3 — SMS**
- Provider: BulkSMS Nigeria API
- Sender ID: "Echelon" (registered and approved)
- Covers DND-exempt routes and standard delivery

**Delivery Tracking:**
- Every attempt logged to `NotificationLog`: channel, status, providerMessageId, failureReason, timestamp
- Dispatch dashboard shows per-channel breakdown: Total / Sent / Failed
- Failed deliveries highlighted in admin dashboard with one-click retry

**Visual suggestion:**
A central "Dispatch Engine" node branching into three icons: Email envelope, WhatsApp logo, SMS message bubble. Below each, a small checklist: sent ✓ / logged ✓ / retryable ✓

---

### SLIDE 8 — ADMIN DASHBOARD

**Headline:** Admin Control Centre — Full Operational Visibility

**Metrics Panel (top of dashboard):**
- Pending Review Count — how many results awaiting admin sign-off
- Approved Results — total approved and ready to dispatch
- Notifications Sent (rolling 30-day window)
- Delivery Failure Count (with alert badge)

**Dispatch Queue Panel:**
- Live list of the 3 most recent dispatch events
- Per-dispatch: batch name, session/semester, total students, sent/failed counts, progress bar
- Status badge: QUEUED / PROCESSING / COMPLETE / PARTIAL_FAILURE

**Channel Breakdown Panel:**
- Donut or bar chart: Email / WhatsApp / SMS with sent vs failed per channel
- Identifies which channel has the worst delivery rate

**Recent Activity Feed:**
- Chronological audit log of all admin/HOD actions
- Actor name, action type, affected entity, timestamp

**Alert Banners:**
- Yellow: batches awaiting review
- Red: failed delivery events needing retry

**Visual suggestion:**
A mock screenshot layout / wireframe of the dashboard with labelled panels. Show the 4 metric cards across the top, dispatch list below left, channel chart below right, activity feed at bottom.

---

### SLIDE 9 — HOD PORTAL

**Headline:** Department Heads — Upload, Track, Done

**Who is an HOD?**
A Head of Department (HOD) is a lower-privilege user scoped to their department only. They cannot approve results or trigger dispatches — only upload and monitor.

**HOD Upload Flow:**
1. Select program, session, semester, level
2. Drag-and-drop CSV or PDF file
3. System validates, parses, deduplicates courses, calculates GPA
4. Batch created in PENDING status — awaits admin review

**Supported File Formats:**
- **CSV:** Flexible header detection (matric_number / matric / matric_no, etc.). Handles multi-row course aggregation (one row per course, same student across rows).
- **PDF:** 4 detection strategies — Matrix Broadsheet (MTU format), Tabular (traditional class list), Key-Value (per-student page), Single-line header.

**HOD Dashboard:**
- Department-scoped batch history with status tracking
- Upload history: last uploaded batches with row counts, status badges
- Can cancel a batch in PENDING status (before admin reviews it)

**Visual suggestion:**
A split screen: left shows the upload interface (drag zone + file type chips), right shows a batch history table with status badges (PENDING, IN_REVIEW, DISPATCHED).

---

### SLIDE 10 — GUARDIAN RESULT PORTAL

**Headline:** The Guardian Experience — Secure, Simple, Official

**What the guardian receives:**
A notification (Email / WhatsApp / SMS) containing:
> *"Hello Mrs. Adewale, the First Semester result for Adewale Tolu (MTU/21/0042) is now available. View result: https://echelon.mtu.edu.ng/results/view?token=a9f3c..."*

**Portal Token System:**
- Token: cryptographically random 32-byte hex string
- Expiry: configurable (default 30 days)
- One-time view tracking: `viewedAt` timestamp recorded on first open
- Can be invalidated if result is withheld after dispatch

**Result PDF (generated on the fly by pdf-lib):**
- Official MTU examination result format — A4 landscape
- University header with crest/logo
- College, Department, Programme, Session, Semester, Level
- Course table: code, type (C/E), units, score, grade
- Current semester summary: units taken, units passed, grade points, GPA, CGPA
- Previous semester summary, remarks (mode of entry, academic standing)
- Watermark: "Not to be taken as Official Result"
- Signatures: Ag. HOD, Dean, Vice Chancellor

**Security:**
- No authentication required — token IS the credential
- Token invalidated if student result is withheld
- Token expires after configured days
- Distinct token per student per dispatch

**Visual suggestion:**
Left side: a phone mockup showing the WhatsApp notification message. Right side: a thumbnail preview of the generated PDF result document.

---

### SLIDE 11 — SECURITY & AUDIT TRAIL

**Headline:** Built for Accountability — Every Action Recorded

**Authentication & Authorisation:**
- **NextAuth.js** — JWT sessions, credentials provider (email + bcrypt password)
- **Role-based access control:**
  - `super_admin` — full access to all routes, all departments
  - `hod` — scoped to own department only
  - Public — can only access `/results/view` with a valid token
- Admin and HOD routes protected server-side; no client-side bypass possible

**Portal Token Security:**
- Generated with `crypto.randomBytes(32)` — cryptographically secure
- 30-day expiry enforced on every request (not just first access)
- Invalidatable: if a result is later withheld, token access is blocked
- viewedAt tracked so admins can confirm guardian engagement

**Audit Logging:**
Every significant action records:
- Who did it (actor: name, role, userId)
- What action (batch_uploaded, result_approved, dispatch_triggered, user_created, etc.)
- What was affected (entity type + entity ID)
- Metadata (batch IDs, result counts, notes)
- Timestamp
- IP address (when available)

Audit logs are exportable as CSV for compliance and institutional reporting.

**QStash Webhook Security:**
- Worker endpoint verifies `WORKER_SHARED_SECRET` header before processing any job
- Prevents unauthenticated triggering of notification dispatch

**Visual suggestion:**
A shield icon in the centre. Four quadrants around it: Role-Based Auth, Token Cryptography, Audit Trail, Webhook Security. Each with a small icon and 2-line descriptor.

---

### SLIDE 12 — TECH STACK DEEP DIVE

**Headline:** Technology Choices & Why

| Category | Technology | Why |
|---|---|---|
| Framework | Next.js 16.2 App Router | RSC for fast server rendering, file-based routing, API routes co-located |
| Language | TypeScript | Type safety across full stack, Prisma type generation |
| Database | PostgreSQL on Neon | Serverless, auto-scaling, free cold-start tier, Prisma adapter-pg |
| ORM | Prisma 7.8 | Type-safe queries, migration system, Neon adapter |
| Auth | NextAuth.js 4 | JWT sessions, role support, credentials provider |
| UI | shadcn/ui + Tailwind 4 | Accessible Radix components, utility CSS, dark mode ready |
| PDF | pdf-lib | Server-side PDF generation, full coordinate control, no headless browser |
| Queue | Upstash QStash | Serverless-friendly HTTP push queue, built-in retries, no Redis needed |
| WhatsApp | UltraMsg | Business WhatsApp without recipient opt-in, Nigerian number support |
| SMS | BulkSMS Nigeria | DND-exempt Nigerian routes, registered sender ID support |
| Email | Nodemailer + Resend | SMTP fallback + managed API; IPv4-forced to avoid EHOSTUNREACH |
| Charts | Recharts | React-native charting for dashboard analytics |
| Validation | Zod | Runtime + compile-time schema validation for API inputs |

**Visual suggestion:**
A grid of logo tiles (like a "Built With" wall). Group by category. Highlight Next.js, Prisma, QStash, UltraMsg, BulkSMS Nigeria, pdf-lib.

---

### SLIDE 13 — KEY FEATURES SUMMARY

**Headline:** Everything ECHELON Does — At a Glance

**Column 1 — For HODs**
- CSV and PDF batch upload (4 PDF parser strategies)
- Smart course aggregation and GPA calculation
- Upload history and batch status tracking
- Cancel uploads before admin review

**Column 2 — For Admins**
- Multi-batch result management across all departments
- Per-student approve / withhold (with notes)
- Dispatch trigger with QStash async queuing
- Delivery analytics: per-channel success rates
- One-click retry for failed notifications
- User management (create HOD/admin accounts)
- Bulk guardian contact import (CSV)
- Full audit log with CSV export

**Column 3 — For Guardians**
- Instant multi-channel notification (Email + WhatsApp + SMS)
- Secure portal link — no account needed
- Official MTU-format PDF result document
- 30-day access window
- Accessible on any device

**Visual suggestion:**
Three-column card layout. Each column has a header icon (computer monitor for HOD, gear for Admin, parent figure for Guardian), a role label, and the bullet points in smaller text.

---

### SLIDE 14 — CLOSING SLIDE

**Headline:** ECHELON — Bringing Clarity to Result Management

**Summary line:**
ECHELON transforms a manual, fragmented, untrackable process into a single digital workflow — with institutional oversight, guardian trust, and delivery accountability baked in.

**Impact statement (3 numbers, make them prominent):**
- **3 channels** — Email, WhatsApp, SMS in every dispatch
- **30-day** secure result access for every guardian
- **100% logged** — every action, every notification attempt, fully auditable

**Stack line:**
Built with Next.js · PostgreSQL · Prisma · QStash · UltraMsg · BulkSMS Nigeria · pdf-lib

**Call to action / closing line:**
*"From upload to parent notification — ECHELON handles everything in between."*

**Visual suggestion:**
Clean closing card. Large ECHELON wordmark centred. Tagline below. Tech stack logos as small icons in a single row at the bottom. Dark navy background, gold accent line under title.

---

## DESIGN NOTES (apply globally across all slides)

- **Colour palette:** Deep navy (#0F172A) background, white (#FFFFFF) primary text, gold/amber (#F59E0B) accent for headings and highlights, slate-grey (#334155) for secondary text
- **Every slide should have a slide number** (bottom right corner)
- **Logo/crest placeholder** in top-right corner of all slides (small, consistent)
- **Max 5–6 bullet points per column** — never overflow
- **Use icons** (Lucide / Heroicons style) next to every section label
- **Diagrams beat walls of text** — wherever a flow or relationship is described, render it as a simple diagram or flowchart box
- **Avoid all-caps sentences** except for slide headlines
- **Data highlights** (numbers, names of technologies, proper nouns) should be **bolded** in every bullet

---

*End of prompt. Generate all 14 slides as specified.*
