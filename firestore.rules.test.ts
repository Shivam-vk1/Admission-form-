/**
 * Firestore Security Rules Test Suite — Dirty Dozen Verification
 */

export interface TestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const dirtyDozenTests: TestCase[] = [
  {
    id: 1,
    name: 'Self-Approval on Create',
    operation: 'create',
    path: '/applications/CPA-2026-1001',
    auth: null,
    payload: { referenceId: 'CPA-2026-1001', status: 'approved' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Shadow Field Injection on Create',
    operation: 'create',
    path: '/applications/CPA-2026-1001',
    auth: null,
    payload: { referenceId: 'CPA-2026-1001', status: 'pending', isScholarshipWinner: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified Admin Email Spoof',
    operation: 'list',
    path: '/applications',
    auth: { uid: 'spoof-1', email: 'shivamvk1090@gmail.com', email_verified: false },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Unauthorized PII Read by Non-Owner',
    operation: 'get',
    path: '/applications/CPA-2026-1001',
    auth: { uid: 'user-b', email: 'other@gmail.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Public List Scraping on Status Collection',
    operation: 'list',
    path: '/application_status',
    auth: null,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Orphaned Write Without Atomic Status Document',
    operation: 'create',
    path: '/applications/CPA-2026-1002',
    auth: null,
    payload: { referenceId: 'CPA-2026-1002', status: 'pending' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Applicant Self-Update of Decision Status',
    operation: 'update',
    path: '/applications/CPA-2026-1001',
    auth: { uid: 'user-a', email: 'applicant@gmail.com', email_verified: true },
    payload: { status: 'approved' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Admin Update Mutating Immutable createdAt',
    operation: 'update',
    path: '/applications/CPA-2026-1001',
    auth: { uid: 'admin-1', email: 'shivamvk1090@gmail.com', email_verified: true },
    payload: { status: 'approved', createdAt: '2020-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Timestamp Forgery on Create',
    operation: 'create',
    path: '/applications/CPA-2026-1003',
    auth: null,
    payload: { referenceId: 'CPA-2026-1003', createdAt: '1999-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Denial-of-Wallet Oversized Essay String',
    operation: 'create',
    path: '/applications/CPA-2026-1004',
    auth: null,
    payload: { referenceId: 'CPA-2026-1004', personalStatement: 'A'.repeat(5000) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'ID Poisoning Attack',
    operation: 'create',
    path: '/applications/invalid id!@#',
    auth: null,
    payload: { referenceId: 'invalid id!@#' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Self-Assigned Admin Document Creation',
    operation: 'create',
    path: '/admins/user-a',
    auth: { uid: 'user-a', email: 'attacker@gmail.com', email_verified: true },
    payload: { email: 'attacker@gmail.com', role: 'admin' },
    expectedResult: 'PERMISSION_DENIED',
  },
];
