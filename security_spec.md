# Security Specification — Crestwood Preparatory Academy Admissions

## 1. Data Invariants

1. **PII Isolation & Split-Collection Invariant**: Full admission dossiers in `/applications/{applicationId}` contain Personally Identifiable Information (`guardianEmail`, `guardianPhone`, `residentialAddress`, `personalStatement`). `get` and `list` operations on `/applications` are strictly restricted to the verified administrator (`shivamvk1090@gmail.com` with `email_verified == true` or existing `/admins/$(request.auth.uid)` record) or an authenticated applicant whose `resource.data.applicantUid == request.auth.uid`. Non-PII status projections live in `/application_status/{applicationId}` and support single-document `get` lookup by Reference ID (`isValidId(applicationId)`) while prohibiting public `list` scraping (`allow list: if isAdmin()`).
2. **Atomic Dual-Collection Sync (`existsAfter`)**: Creating a document in `/applications/{applicationId}` requires a synchronous atomic write creating `/application_status/{applicationId}` in the same batch (`existsAfter`), and vice versa.
3. **Initial Submission Integrity**: Newly created applications must initialize with `status == 'pending'`, `adminNotes == ''`, `reviewedBy == ''`, `referenceId == applicationId`, and `createdAt == request.time && updatedAt == request.time`. Applicants cannot self-approve an application at creation time.
4. **Identity & Privilege Escalation Guard**: Only the verified administrator (`isAdmin()`) can update `/applications/{applicationId}` or `/application_status/{applicationId}` to transition `status` (`pending` -> `approved` | `waitlisted` | `rejected`), edit `adminNotes` / `decisionSummary`, or delete records. Immutable fields (`referenceId`, `applicantUid`, `createdAt`, `studentFirstName`, `studentLastName`, `dateOfBirth`) can never be mutated during an update.
5. **Strict Key & Volumetric Boundaries**: Every string field enforces explicit `.size()` bounds matching `firebase-blueprint.json`. Document IDs must match `^[a-zA-Z0-9_\-]+$` and be `<= 128` characters.

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Self-Approval on Create)**: Unauthenticated or standard user creates `/applications/CPA-2026-1001` with `status: "approved"`. -> `PERMISSION_DENIED`.
2. **Payload 2 (Shadow Field Injection on Create)**: Payload includes all required fields plus `isScholarshipWinner: true`. -> `PERMISSION_DENIED` (`hasOnly` check fails).
3. **Payload 3 (Unverified Admin Email Spoof)**: Authenticated user with `email: "shivamvk1090@gmail.com"` but `email_verified: false` attempts to `list` `/applications` or `update` status. -> `PERMISSION_DENIED`.
4. **Payload 4 (Unauthorized PII Read)**: Authenticated user `uid: "user-b"` attempts `get` on `/applications/CPA-2026-1001` owned by `uid: "user-a"`. -> `PERMISSION_DENIED`.
5. **Payload 5 (Public List Scraping on Status Collection)**: Unauthenticated user attempts `list` query on `/application_status`. -> `PERMISSION_DENIED`.
6. **Payload 6 (Orphaned Write Without Atomic Status Doc)**: Client writes to `/applications/CPA-2026-1002` without writing `/application_status/CPA-2026-1002` in the same batch. -> `PERMISSION_DENIED` (`existsAfter` check fails).
7. **Payload 7 (Applicant Self-Update of Status)**: Applicant `uid: "user-a"` attempts `update` on `/applications/CPA-2026-1001` changing `status` to `"approved"`. -> `PERMISSION_DENIED`.
8. **Payload 8 (Admin Update Mutating Immutable `createdAt`)**: Admin updates `/applications/CPA-2026-1001` while modifying `createdAt` or `referenceId`. -> `PERMISSION_DENIED`.
9. **Payload 9 (Timestamp Forgery on Create)**: Client submits `createdAt` set to a past timestamp instead of `request.time`. -> `PERMISSION_DENIED`.
10. **Payload 10 (Denial-of-Wallet Oversized String)**: Client submits `personalStatement` with 5,000 characters (exceeding `maxLength: 2000`). -> `PERMISSION_DENIED`.
11. **Payload 11 (ID Poisoning Attack)**: Client attempts to create `/applications/invalid id with spaces!@#`. -> `PERMISSION_DENIED` (`isValidId` regex fails).
12. **Payload 12 (Self-Assigned Admin Document)**: Regular user attempts to create `/admins/user-a` to grant themselves admin rights. -> `PERMISSION_DENIED`.

## 3. Red Team Audit Summary

- **Shadow Update Test**: Passed. Both `create` and `update` enforce strict `keys().hasAll(...)`, `keys().hasOnly(...)`, and `affectedKeys().hasOnly(...)`.
- **Email Spoofing Test**: Passed. `isAdmin()` requires `request.auth.token.email_verified == true` alongside `request.auth.token.email == 'shivamvk1090@gmail.com'`.
- **PII Blanket Test**: Passed. `/applications/{applicationId}` denies public reads and restricts `get`/`list` to `isAdmin()` or the verified owner `resource.data.applicantUid == request.auth.uid`.
- **Query Trust Test**: Passed. `allow list` on `/applications` explicitly checks `isAdmin() || (isSignedIn() && isVerified() && resource.data.applicantUid == request.auth.uid)`.
- **Value Poisoning Test**: Passed. `allow update` wraps all branches in `isValidApplication(incoming())` and `isValidApplicationStatus(incoming())`.
