import { Timestamp } from 'firebase/firestore';

export type GenderOption = 'Female' | 'Male' | 'Non-Binary' | 'Prefer Not to Say';
export type ApplyingGrade = 'Grade 9' | 'Grade 10' | 'Grade 11' | 'Grade 12';
export type EnrollmentType = 'Day Student' | 'Boarding Student';
export type AcademicTrack =
  | 'STEM & Research Honors'
  | 'Classical Humanities & Law'
  | 'Visual & Performing Arts'
  | 'Global Economics & Leadership';
export type DecisionStatus = 'pending' | 'approved' | 'waitlisted' | 'rejected';

export interface ApplicationFormInput {
  studentFirstName: string;
  studentLastName: string;
  dateOfBirth: string;
  gender: GenderOption;
  applyingGrade: ApplyingGrade;
  enrollmentType: EnrollmentType;
  academicTrack: AcademicTrack;
  previousSchool: string;
  gpa: string;
  extracurriculars: string;
  guardianName: string;
  guardianRelationship: string;
  guardianEmail: string;
  guardianPhone: string;
  residentialAddress: string;
  personalStatement: string;
}

export interface ApplicationRecord extends ApplicationFormInput {
  referenceId: string;
  status: DecisionStatus;
  adminNotes: string;
  reviewedBy: string;
  applicantUid: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface ApplicationStatusPublicRecord {
  referenceId: string;
  studentInitials: string;
  applyingGrade: ApplyingGrade;
  enrollmentType: EnrollmentType;
  academicTrack: AcademicTrack;
  status: DecisionStatus;
  decisionSummary: string;
  applicantUid: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

/**
 * Verbatim schema limits synced with firebase-blueprint.json and firestore.rules
 */
export const BLUEPRINT_CONSTRAINTS = {
  referenceId: { minLength: 5, maxLength: 32, pattern: /^[a-zA-Z0-9_-]+$/ },
  studentFirstName: { minLength: 1, maxLength: 80 },
  studentLastName: { minLength: 1, maxLength: 80 },
  dateOfBirth: { minLength: 8, maxLength: 16 },
  previousSchool: { minLength: 2, maxLength: 120 },
  gpa: { minLength: 1, maxLength: 10 },
  extracurriculars: { minLength: 0, maxLength: 600 },
  guardianName: { minLength: 2, maxLength: 100 },
  guardianRelationship: { minLength: 2, maxLength: 50 },
  guardianEmail: { minLength: 5, maxLength: 120 },
  guardianPhone: { minLength: 7, maxLength: 30 },
  residentialAddress: { minLength: 5, maxLength: 250 },
  personalStatement: { minLength: 20, maxLength: 2000 },
  adminNotes: { minLength: 0, maxLength: 1000 },
} as const;

export const ACADEMIC_TRACK_DETAILS: {
  id: AcademicTrack;
  subtitle: string;
  curriculumFocus: string;
  capstoneRequirement: string;
  facultyRatio: string;
}[] = [
  {
    id: 'STEM & Research Honors',
    subtitle: 'Applied Mathematics, Molecular Biology, Quantum Computing & Robotics',
    curriculumFocus: 'Multivariable Calculus, Organic Chemistry Lab, Autonomous Systems Engineering',
    capstoneRequirement: 'Senior Independent Laboratory Thesis & Symposium Defense',
    facultyRatio: '7:1 Lab Seminar Ratio',
  },
  {
    id: 'Classical Humanities & Law',
    subtitle: 'Rhetoric, Constitutional Jurisprudence, Philosophy & Ancient Languages',
    curriculumFocus: 'Comparative Constitutional Law, Latin/Greek Seminar, Moral Philosophy',
    capstoneRequirement: 'Appellate Moot Court Brief & 40-Page Archival Monograph',
    facultyRatio: '8:1 Harkness Table Ratio',
  },
  {
    id: 'Visual & Performing Arts',
    subtitle: 'Conservatory Chamber Music, Architectural Design, Studio Oil & Curatorial Studies',
    curriculumFocus: 'Music Theory & Composition, Architectural Drafting, Gallery Curatorship',
    capstoneRequirement: 'Solo Juried Exhibition or Full-Length Conservatory Recital',
    facultyRatio: '6:1 Studio Mentorship',
  },
  {
    id: 'Global Economics & Leadership',
    subtitle: 'Macroeconomic Policy, Econometrics, Diplomatic History & Civic Enterprise',
    curriculumFocus: 'Applied Econometrics, International Relations, Quantitative Finance',
    capstoneRequirement: 'Global Policy Colloquium & Emerging Markets Case Portfolio',
    facultyRatio: '8:1 Case Seminar Ratio',
  },
];

export function generateReferenceId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CPA-2026-${suffix}`;
}

export function sanitizeString(val: string, maxLength: number): string {
  return val.trim().slice(0, maxLength);
}
