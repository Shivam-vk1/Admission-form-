# Crestwood Preparatory Academy — Admissions & Management Portal

A full-featured High School and Preparatory Academy admission portal that lets prospective students and families submit structured applications online, while providing an embedded Gmail-authenticated Admissions Admin Console (`shivamvk1090@gmail.com`) to review, approve, waitlist, or reject submitted applications in real time.

## User Review & Critical Decisions

> [!IMPORTANT]
> Please review the confirmed choices from our clarification step and the recommended visual direction below before we provision Firebase and build the application.

- **Confirmed Decision — Institution Type**: **High School & Preparatory Academy (Grades 9–12)**. The admission form is tailored for secondary and college-preparatory applicants, capturing student demographics, entering grade (9th–12th), academic track preference (STEM Honors, Humanities & Classical Studies, Fine Arts, Global Leadership), GPA / previous school history, extracurricular achievements, guardian contact details, and a personal statement.
- **Confirmed Decision — Admin Management Workflow**: **Approve, Reject, or Waitlist Applications with Gmail Sign-In**. Signing in via Google (`shivamvk1090@gmail.com`) unlocks the Admissions Committee Dashboard to inspect full application dossiers, transition application statuses (`Pending Review` → `Approved`, `Waitlisted`, or `Rejected`), filter by grade or status, search applicants, and export records to CSV.
- **Recommended Default — Visual Theme**: **Prestigious Academic (Archival Alabaster, Deep Lapis Navy, and Warm Bronze/Gold)** combining institutional editorial authority for the public admission experience with high-density tabular clarity in the admin management workspace.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Public Admission Portal**: Guides prospective High School & Preparatory Academy students and parents through a structured 4-step admission form (Student Profile, Academic History & Track Selection, Guardian & Emergency Contact, Personal Essay & Declaration) with instant validation and a printable confirmation receipt with a unique Application Reference Number.
  2. **Applicant Status Lookup**: Allows applicants to check their live admission decision status (`Pending Review`, `Approved`, `Waitlisted`, `Rejected`) using their Application Reference ID or registered email.
  3. **Embedded Gmail Admin Console**: Features a dedicated "Admin Login" view inside the portal where the school administrator signs in with their Google/Gmail account (`shivamvk1090@gmail.com`) via Firebase Authentication (`signInWithPopup`) to view all submitted applications in real time, inspect individual applicant drawers, and execute one-click status decisions (`Approve`, `Waitlist`, `Reject`), add reviewer remarks, filter/search records, or export to CSV.
- **Target Audience / Persona**:
  - **Prospective Families & Students (Grades 9–12)**: Seeking a trustworthy, clear, and prestigious admission application experience.
  - **School Admissions Administrator (`shivamvk1090@gmail.com`)**: Needs immediate, secure access via Gmail to review incoming applications and manage admission decisions without leaving the application.
- **Key Value**: Eliminates paper and spreadsheet fragmentation by uniting a validation-hardened student admission form with a real-time, role-protected Gmail administration console backed by Cloud Firestore.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Prospective Student Application Flow**:
   - **Landing & Program Overview**: Prospective families arrive at the Crestwood Preparatory Academy portal featuring an institutional hero banner, key admissions dates strip (`Early Decision · Regular Decision · Financial Aid Deadline`), and academic track highlights.
   - **Multi-Step Application Form**:
     - *Step 1 — Student Identity*: Full legal name, date of birth, gender, applying grade level (`Grade 9 Freshman`, `Grade 10 Sophomore`, `Grade 11 Junior`, `Grade 12 Senior`), and boarding/day preference.
     - *Step 2 — Academic Background & Honors Track*: Current school name, cumulative GPA (0.00–4.00 scale), preferred academic track (`STEM & Research Honors`, `Classical Humanities & Law`, `Visual & Performing Arts`, `Global Economics & Leadership`), and primary honours/extracurricular interests.
     - *Step 3 — Parent / Guardian Information*: Primary guardian full name, relationship, email address, phone number, and residential address.
     - *Step 4 — Personal Statement & Submission*: Applicant personal statement (with live character counter), academic integrity pledge checkbox, and review summary before final submission.
   - **Confirmation & Reference Receipt**: Upon submission, the applicant receives a formatted Admission Receipt with their generated Application ID (e.g., `CPA-2026-8492`), submission timestamp, and a button to print or copy the reference number.
2. **Application Status Check Flow**:
   - Applicants or parents switch to the **Check Application Status** view and enter their Application Reference ID to view real-time status updates and official admissions committee remarks.
3. **Gmail Admin Authentication & Management Flow**:
   - Clicking **Admin Portal** in the top navigation bar opens the embedded Gmail Login gate.
   - Clicking **Sign in with Google (Gmail)** triggers Firebase Google OAuth popup authentication.
   - Once verified as the authorized administrator (`shivamvk1090@gmail.com`), the view transitions into the **Admissions Management Console**:
     - **KPI Summary Strip**: Total Applications, Pending Review, Approved, Waitlisted, and Rejected counts rendered with aligned tabular numerals.
     - **Filter & Search Toolbar**: Live search by student name, email, or Reference ID; segmented filters by Status (`All`, `Pending`, `Approved`, `Waitlisted`, `Rejected`) and Grade (`Grades 9–12`); plus a one-click **Export CSV** action.
     - **High-Density Applications Table & Detail Drawer**: Clicking any applicant row opens a comprehensive slide-over dossier showing their academic background, GPA, guardian contact info, and personal statement, with direct action buttons (`Approve Application`, `Place on Waitlist`, `Reject Application`, and `Save Reviewer Note`).

### Visual Identity & Theme
- **Aesthetic Direction**: Institutional Editorial meets High-Density SaaS Workspace — combining the heritage authority of a preparatory academy monograph with crisp, zero-clutter administrative tooling.
- **Color Palette & Mood (60-30-10 Distribution)**:
  - **60% Dominant Neutral Canvas**: Archival warm paper (`#FBF9F5` / `bg-stone-50`) for the public admission experience and crisp structural white (`#FFFFFF`) with subtle stone dividers (`border-stone-200`) for form and table surfaces.
  - **30% Structural Surfaces & Ink**: Deep charcoal ink (`#1C1917` / `text-stone-900`) for primary typography, muted stone (`#57534E` / `text-stone-600`) for secondary prose, and Deep Lapis Navy (`#0F172A` / `bg-slate-900`) for the institutional header and primary interactive controls.
  - **10% Curatorial & Semantic Accents**:
    - *Primary Brand Accent*: Warm Academic Bronze/Gold (`#B45309` / `amber-700`) for step indicators and active focus states.
    - *Semantic Decision States* (always paired with explicit text labels and icons): Emerald (`#15803D`) for `Approved`, Amber (`#D97706`) for `Waitlisted` / `Pending Review`, and Crimson (`#B91C1C`) for `Rejected`.
- **Typography & Hierarchy (2+1 Font Rule)**:
  - **Display & Institutional Headings**: `Fraunces` (or `Playfair Display`) serif for academy titles, section headers, and admission certificates, balanced with `text-wrap: balance`.
  - **Body Prose & Form Controls**: `Plus Jakarta Sans` for crisp legibility across form labels, inputs, and review drawers.
  - **Tabular Metrics & Reference IDs**: `JetBrains Mono` with `tabular-nums` for Application IDs (`CPA-2026-XXXX`), GPAs (`3.92`), submission timestamps, and dashboard counters.
- **Component Styling & Layout**:
  - **Top Bar Contract**: Strict single-row, three-zone header separated by `gap-8`:
    1. *Brand Wordmark*: `Crestwood Preparatory` (single-line display wordmark).
    2. *Navigation Links*: `Admission Form`, `Academic Tracks`, `Check Status`, `Admin Portal` (single-line text links with subtle hover underlines).
    3. *Primary Action*: `Apply Now` (or `Signed in: Gmail` / `Sign Out` when in Admin view).
  - **Zero-Pill Metadata Discipline**: Dates, grade levels, and track labels in cards and lists use clean inline typography separated by middle dots (`Grade 10 · STEM Honors · GPA 3.95`) rather than cluttered badge sandwiches.
  - **Single-Elevation Depth**: Flat containers with `1px solid` hairline borders (`border-stone-200`) and generous internal padding (`p-6` to `p-8`), avoiding nested cards-within-cards or thick left accent borders.

### Interactive Feedback & Motion
- Smooth `< 200ms` transitions between form steps with real-time field validation feedback, skeleton loading placeholders when querying Firestore, confirmation toast notifications on status updates (`Approved`, `Waitlisted`, `Rejected`), and an instant print-friendly view for submitted admission receipts.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Real Firebase Authentication (Google OAuth) & Cloud Firestore Persistence**
  - *Chosen Approach*: Provision a dedicated Firebase project with Google Sign-In (`signInWithPopup`) and Cloud Firestore backed by zero-trust security rules (`firestore.rules`).
  - *Why*: Ensures submitted student applications persist reliably across sessions and devices, and guarantees that only the authenticated Gmail administrator (`shivamvk1090@gmail.com` with `email_verified == true`) can list all applications or change admission statuses (`Approved`, `Waitlisted`, `Rejected`).
  - *Alternatives Considered*: LocalStorage or in-memory state was rejected because submitted applications would not be visible across users or protected by real Gmail authentication.
- **Decision 2: Public Application Submission + Public Reference Lookup vs. Admin-Only Full Listing**
  - *Chosen Approach*: Prospective students can submit an application without needing an account (or while signed in) and look up their individual application by its Reference ID (`get`), while `list` and `update` operations on the `/applications` collection are strictly locked to the verified administrator (`shivamvk1090@gmail.com`) and the applicant who created the record.
  - *Why*: Removes friction for parents and students filling out the school admission form while protecting student Personally Identifiable Information (PII) from unauthorized browsing.
- **Decision 3: Multi-Step Guided Admission Form with Step-Level Validation**
  - *Chosen Approach*: Break the High School & Preparatory Academy form into 4 focused steps with client-side schema validation matching the exact Firestore security rule bounds (`maxLength`, `pattern`, GPA range, required keys).
  - *Why*: Prevents form fatigue, catches formatting errors immediately before submission, and guarantees 100% compatibility with hardened Firestore security rules.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Top Navigation Bar (3-Zone)                           │
│  [Crestwood Preparatory]   [Admission Form · Tracks · Status · Admin]  [CTA] │
└───────────────┬─────────────────────────────┬────────────────────────┬───────┘
                │                             │                        │
                ▼                             ▼                        ▼
┌───────────────────────────────┐ ┌───────────────────────┐ ┌──────────────────┐
│    Public Admission View      │ │  Status Lookup View   │ │ Admin Login Gate │
│ ┌───────────────────────────┐ │ │ ┌───────────────────┐ │ │ ┌──────────────┐ │
│ │ Hero & Admissions Ribbon  │ │ │ │ Reference ID Input│ │ │ │ Google OAuth │ │
│ └─────────────┬─────────────┘ │ │ └─────────┬─────────┘ │ │ │ Popup SignIn │ │
│               ▼               │ │           ▼           │ │ └──────┬───────┘ │
│ ┌───────────────────────────┐ │ │ ┌───────────────────┐ │ └────────┼─────────┘
│ │ 4-Step Admission Wizard   │ │ │ │ Live Status Card  │ │          │
│ │ 1. Student Identity       │ │ │ │ & Decision Notes  │ │          ▼
│ │ 2. Academics & Track      │ │ │ └───────────────────┘ │ ┌──────────────────┐
│ │ 3. Guardian Contact       │ │ └───────────▲───────────┘ │ Admin Console    │
│ │ 4. Essay & Pledge         │ │             │             │ (Gmail Verified) │
│ └─────────────┬─────────────┘ │             │             │ ┌──────────────┐ │
│               ▼               │             │             │ │ KPI Metrics  │ │
│ ┌───────────────────────────┐ │             │             │ ├──────────────┤ │
│ │ Confirmation Receipt Card │ │             │             │ │ Filter/Search│ │
│ └─────────────┬─────────────┘ │             │             │ │ & CSV Export │ │
│               │               │             │             │ ├──────────────┤ │
└───────────────┼───────────────┘             │             │ │ Applications │ │
                │                             │             │ │ Data Grid &  │ │
                │  create (setDoc)            │ get (doc)   │ │ Review Drawer│ │
                ▼                             │             │ └──────┬───────┘ │
┌─────────────────────────────────────────────┴─────────────┴────────┼─────────┘
│                     Firebase SDK & Error Boundary Layer            │
│       handleFirestoreError() · Schema Sanitizer · Auth Listener    │
└─────────────────────────────────────────────┬──────────────────────┘
                                              │
                                              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                  Cloud Firestore & Zero-Trust Security Rules                 │
│  Collection: /applications/{applicationId}                                   │
│  Collection: /admins/{adminUid}  +  Bootstrapped Admin: shivamvk1090@gmail.com│
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **Primary Firestore Collection (`/applications/{applicationId}`)**:
  - `referenceId` (string, immutable, e.g., `CPA-2026-8492`, matches document ID)
  - `studentFirstName`, `studentLastName` (string, 1–80 chars)
  - `dateOfBirth` (string, `YYYY-MM-DD`), `gender` (enum: `Female`, `Male`, `Non-Binary`, `Prefer Not to Say`)
  - `applyingGrade` (enum: `Grade 9`, `Grade 10`, `Grade 11`, `Grade 12`)
  - `enrollmentType` (enum: `Day Student`, `Boarding Student`)
  - `academicTrack` (enum: `STEM & Research Honors`, `Classical Humanities & Law`, `Visual & Performing Arts`, `Global Economics & Leadership`)
  - `previousSchool` (string, 2–120 chars), `gpa` (string formatted `0.00`–`4.00`, 1–10 chars)
  - `extracurriculars` (string, 0–600 chars)
  - `guardianName` (string, 2–100 chars), `guardianRelationship` (string, 2–50 chars)
  - `guardianEmail` (string, email format, 5–120 chars), `guardianPhone` (string, 7–30 chars)
  - `residentialAddress` (string, 5–250 chars)
  - `personalStatement` (string, 50–2000 chars)
  - `status` (enum: `pending`, `approved`, `waitlisted`, `rejected` — defaults to `'pending'` on creation)
  - `adminNotes` (string, 0–1000 chars — empty string on creation, editable by Admin)
  - `reviewedBy` (string, 0–120 chars — updated by Admin on status change)
  - `applicantUid` (string, 0–128 chars — optional UID if signed in, or `'public'`)
  - `createdAt` (server timestamp `request.time`, immutable)
  - `updatedAt` (server timestamp `request.time`)

### Interactive Component & State Mapping
- **Multi-Step Form Wizard**:
  - Validates each step's fields against exact character limits and patterns before advancing.
  - Generates a deterministic-format `referenceId` (`CPA-2026-XXXX` alphanumeric ID) and writes the document to `/applications/{referenceId}` with `serverTimestamp()` for `createdAt` and `updatedAt`.
  - Transitions on success to the Confirmation Receipt view with one-click copy and print support.
- **Status Lookup Component**:
  - Queries `/applications/{referenceId}` directly via `getDoc(doc(db, 'applications', referenceId))` so applicants can check their decision status without exposing the full collection to public `list` queries.
- **Gmail Admin Login & Management Console**:
  - Authenticates via `signInWithPopup(auth, new GoogleAuthProvider())`.
  - Checks if `user.email === 'shivamvk1090@gmail.com'` (or if the user exists in `/admins/{uid}`). If a non-admin Gmail signs in, displays a clear "Unauthorized Account" notice with a button to switch accounts or return to the student portal.
  - Subscribes via `onSnapshot` to `/applications` ordered by submission time when authenticated as admin.
  - Clicking `Approve`, `Waitlist`, or `Reject` inside the table or detail drawer executes an atomic `updateDoc` updating `status`, `adminNotes`, `reviewedBy`, and `updatedAt: serverTimestamp()`.
  - Clicking `Export CSV` serializes the currently filtered applications into a downloadable `.csv` file.
