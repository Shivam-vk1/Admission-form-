import React, { useEffect, useMemo, useState } from 'react';
import { signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Search,
  Download,
  LogOut,
  ShieldCheck,
  Lock,
  Trash2,
  Eye,
  X,
  PlusCircle,
  Save,
} from 'lucide-react';
import {
  ADMIN_EMAIL,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  ApplicationRecord,
  ApplyingGrade,
  BLUEPRINT_CONSTRAINTS,
  DecisionStatus,
  sanitizeString,
} from '../types/admissions';

interface AdminConsoleProps {
  currentUser: User | null;
  authReady: boolean;
}

const DEMO_SEED_RECORDS = [
  {
    referenceId: 'CPA-2026-9041',
    studentFirstName: 'Clara',
    studentLastName: 'lindqvist',
    dateOfBirth: '2011-02-14',
    gender: 'Female' as const,
    applyingGrade: 'Grade 9' as const,
    enrollmentType: 'Boarding Student' as const,
    academicTrack: 'STEM & Research Honors' as const,
    previousSchool: 'Nordic International Academy',
    gpa: '3.98',
    extracurriculars:
      'National Physics Olympiad Finalist, First Violin in Youth Symphony, Founder of Girls in Coding Workshop.',
    guardianName: 'Henrik Lindqvist',
    guardianRelationship: 'Father',
    guardianEmail: 'h.lindqvist@example.org',
    guardianPhone: '+1 (617) 555-0114',
    residentialAddress: '74 Beacon Street, Boston, MA 02108',
    personalStatement:
      'My research into biodegradable polymer membranes began in my eighth-grade chemistry seminar. At Crestwood Preparatory Academy, I look forward to working in the Integrated Science Pavilion to test sustainable water filtration materials.',
  },
  {
    referenceId: 'CPA-2026-9042',
    studentFirstName: 'Marcus',
    studentLastName: 'Sterling',
    dateOfBirth: '2010-07-29',
    gender: 'Male' as const,
    applyingGrade: 'Grade 10' as const,
    enrollmentType: 'Day Student' as const,
    academicTrack: 'Classical Humanities & Law' as const,
    previousSchool: 'Boston Latin Preparatory',
    gpa: '3.91',
    extracurriculars:
      'New England Parliamentary Debate Champion, Varsity Rowing Coxswain, Archival Fellow at Historical Society.',
    guardianName: 'Evelyn Sterling',
    guardianRelationship: 'Mother',
    guardianEmail: 'evelyn.sterling@example.org',
    guardianPhone: '+1 (617) 555-0183',
    residentialAddress: '290 Marlborough Street, Boston, MA 02116',
    personalStatement:
      'Reading Cicero alongside modern constitutional jurisprudence showed me how enduring legal principles protect civic liberty. I am eager to join Crestwood’s Classical Humanities seminar and contribute to the Moot Court team.',
  },
  {
    referenceId: 'CPA-2026-9043',
    studentFirstName: 'Sora',
    studentLastName: 'Takahashi',
    dateOfBirth: '2009-11-05',
    gender: 'Non-Binary' as const,
    applyingGrade: 'Grade 11' as const,
    enrollmentType: 'Boarding Student' as const,
    academicTrack: 'Visual & Performing Arts' as const,
    previousSchool: 'Kyoto International Fine Arts School',
    gpa: '3.87',
    extracurriculars:
      'Scholastic Art Gold Key Portfolio Winner, Architectural Woodwork Apprentice, Stage Set Designer.',
    guardianName: 'Kenji Takahashi',
    guardianRelationship: 'Father',
    guardianEmail: 'k.takahashi@example.org',
    guardianPhone: '+1 (617) 555-0249',
    residentialAddress: '15 Memorial Drive, Cambridge, MA 02142',
    personalStatement:
      'Architecture exists at the intersection of sculpture and human shelter. Through Crestwood’s Visual & Performing Arts track, I want to study structural timber joinery and curate exhibitions in the Founders Gallery.',
  },
];

// Normalize capitalization
DEMO_SEED_RECORDS[0].studentLastName = 'Lindqvist';

export const AdminConsole: React.FC<AdminConsoleProps> = ({ currentUser, authReady }) => {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState<boolean>(false);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | DecisionStatus>('all');
  const [gradeFilter, setGradeFilter] = useState<'all' | ApplyingGrade>('all');

  // Selected Drawer State
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [drawerNotes, setDrawerNotes] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [seeding, setSeeding] = useState<boolean>(false);

  const isAuthorizedAdmin =
    Boolean(currentUser) &&
    currentUser?.emailVerified === true &&
    currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  useEffect(() => {
    if (!authReady || !isAuthorizedAdmin) {
      setApplications([]);
      return;
    }

    setLoadingData(true);
    const colRef = collection(db, 'applications');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const docs: ApplicationRecord[] = snapshot.docs.map(
          (d) => d.data() as ApplicationRecord
        );
        docs.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        setApplications(docs);
        setLoadingData(false);
      },
      (error) => {
        setLoadingData(false);
        handleFirestoreError(error, OperationType.LIST, 'applications');
      }
    );

    return () => unsubscribe();
  }, [authReady, isAuthorizedAdmin]);

  const selectedApplication = useMemo(
    () => applications.find((a) => a.referenceId === selectedAppId) || null,
    [applications, selectedAppId]
  );

  useEffect(() => {
    if (selectedApplication) {
      setDrawerNotes(selectedApplication.adminNotes || '');
    }
  }, [selectedApplication?.referenceId]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Google Sign-In was cancelled or blocked by the browser.'
      );
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setSelectedAppId(null);
    await signOut(auth);
  };

  const handleDecisionUpdate = async (
    app: ApplicationRecord,
    newStatus: DecisionStatus,
    customNotes?: string
  ) => {
    if (!currentUser?.email) return;
    setUpdatingId(app.referenceId);

    const cleanNotes = sanitizeString(
      customNotes !== undefined ? customNotes : app.adminNotes,
      BLUEPRINT_CONSTRAINTS.adminNotes.maxLength
    );
    const cleanReviewer = sanitizeString(currentUser.email, 120);

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'applications', app.referenceId), {
        status: newStatus,
        adminNotes: cleanNotes,
        reviewedBy: cleanReviewer,
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'application_status', app.referenceId), {
        status: newStatus,
        decisionSummary: cleanNotes,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      showToast(
        `Updated ${app.studentFirstName} ${app.studentLastName} (${app.referenceId}) to ${newStatus.toUpperCase()}.`
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${app.referenceId}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteApplication = async (app: ApplicationRecord) => {
    setUpdatingId(app.referenceId);
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'applications', app.referenceId));
      batch.delete(doc(db, 'application_status', app.referenceId));
      await batch.commit();
      if (selectedAppId === app.referenceId) {
        setSelectedAppId(null);
      }
      showToast(`Deleted application ${app.referenceId}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `applications/${app.referenceId}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSeedDemoApplications = async () => {
    if (!currentUser) return;
    setSeeding(true);
    try {
      for (const item of DEMO_SEED_RECORDS) {
        const batch = writeBatch(db);
        batch.set(doc(db, 'applications', item.referenceId), {
          ...item,
          status: 'pending',
          adminNotes: '',
          reviewedBy: '',
          applicantUid: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        batch.set(doc(db, 'application_status', item.referenceId), {
          referenceId: item.referenceId,
          studentInitials: `${item.studentFirstName} ${item.studentLastName.charAt(0)}.`,
          applyingGrade: item.applyingGrade,
          enrollmentType: item.enrollmentType,
          academicTrack: item.academicTrack,
          status: 'pending',
          decisionSummary: '',
          applicantUid: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
      }
      showToast('Loaded 3 sample candidate applications for committee review.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'applications');
    } finally {
      setSeeding(false);
    }
  };

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;
      if (gradeFilter !== 'all' && app.applyingGrade !== gradeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = `${app.studentFirstName} ${app.studentLastName}`
          .toLowerCase()
          .includes(q);
        const matchRef = app.referenceId.toLowerCase().includes(q);
        const matchEmail = app.guardianEmail.toLowerCase().includes(q);
        const matchSchool = app.previousSchool.toLowerCase().includes(q);
        if (!matchName && !matchRef && !matchEmail && !matchSchool) return false;
      }
      return true;
    });
  }, [applications, statusFilter, gradeFilter, searchQuery]);

  const metrics = useMemo(() => {
    return {
      total: applications.length,
      pending: applications.filter((a) => a.status === 'pending').length,
      approved: applications.filter((a) => a.status === 'approved').length,
      waitlisted: applications.filter((a) => a.status === 'waitlisted').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
    };
  }, [applications]);

  const handleExportCsv = () => {
    if (filteredApplications.length === 0) return;
    const headers = [
      'Reference ID',
      'First Name',
      'Last Name',
      'DOB',
      'Gender',
      'Applying Grade',
      'Enrollment Type',
      'Academic Track',
      'Previous School',
      'GPA',
      'Guardian Name',
      'Guardian Email',
      'Guardian Phone',
      'Status',
      'Reviewed By',
      'Admin Notes',
    ];
    const escapeCsv = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = filteredApplications.map((a) =>
      [
        a.referenceId,
        a.studentFirstName,
        a.studentLastName,
        a.dateOfBirth,
        a.gender,
        a.applyingGrade,
        a.enrollmentType,
        a.academicTrack,
        a.previousSchool,
        a.gpa,
        a.guardianName,
        a.guardianEmail,
        a.guardianPhone,
        a.status,
        a.reviewedBy,
        a.adminNotes,
      ]
        .map(escapeCsv)
        .join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `crestwood_admissions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. GMAIL LOGIN GATE WHEN NOT AUTHENTICATED AS ADMIN
  if (!authReady) {
    return (
      <div className="max-w-md mx-auto bg-white border border-stone-200 p-8 text-center">
        <p className="text-xs text-stone-500">Verifying Admissions Committee session...</p>
      </div>
    );
  }

  if (!currentUser || !isAuthorizedAdmin) {
    return (
      <div className="max-w-lg mx-auto bg-white border border-stone-200 p-6 sm:p-10">
        <div className="w-10 h-10 bg-slate-900 text-amber-400 flex items-center justify-center mb-5">
          <Lock className="w-5 h-5" />
        </div>

        <p className="text-xs uppercase tracking-widest text-stone-500">
          Admissions Committee Portal
        </p>
        <h2 className="text-2xl font-serif-display text-stone-900 mt-1">
          Administrator Gmail Sign-In
        </h2>
        <p className="text-sm text-stone-600 mt-2 leading-relaxed">
          Sign in with your authorized administrator Gmail account to view submitted student
          dossiers and approve, waitlist, or reject admission applications.
        </p>

        <div className="mt-5 p-4 bg-stone-50 border border-stone-200 text-xs space-y-1">
          <div className="text-stone-500">Authorized Admissions Director Account:</div>
          <div className="font-mono-tabular font-semibold text-slate-900">{ADMIN_EMAIL}</div>
        </div>

        {currentUser && !isAuthorizedAdmin && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="font-semibold">
              Signed in as {currentUser.email} (Unauthorized for Admin Console)
            </div>
            <p>
              This account does not have Admissions Committee privileges. Please switch to{' '}
              <strong className="font-mono-tabular">{ADMIN_EMAIL}</strong>.
            </p>
          </div>
        )}

        {authError && (
          <div className="mt-4 p-3.5 bg-red-50 border border-red-200 text-xs text-red-800">
            {authError}
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full px-5 py-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            {signingIn
              ? 'Opening Google Sign-In...'
              : currentUser
              ? 'Switch Gmail Account'
              : 'Sign in with Google (Gmail)'}
          </button>

          {currentUser && (
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full sm:w-auto px-4 py-3 text-xs font-medium text-stone-700 border border-stone-300 hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="bg-slate-900 text-white px-4 py-3 text-xs flex items-center justify-between border border-slate-700">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-white ml-4 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Admin Identity Header Bar */}
      <div className="bg-white border border-stone-200 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-700 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Verified Gmail Administrator · {currentUser.email}
          </p>
          <h2 className="text-2xl font-serif-display text-stone-900 mt-1">
            Admissions Committee Review &amp; Decision Console
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSeedDemoApplications}
            disabled={seeding}
            className="px-3.5 py-2 text-xs font-medium text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-800" />
            {seeding ? 'Loading Sample Records...' : 'Load Sample Candidates'}
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredApplications.length === 0}
            className="px-3.5 py-2 text-xs font-medium text-stone-800 bg-white hover:bg-stone-50 border border-stone-300 disabled:opacity-40 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download CSV
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="px-3.5 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 bg-white border border-stone-200 divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
        <div className="p-5">
          <span className="text-xs text-stone-500 block">Total Submissions</span>
          <span className="text-2xl font-mono-tabular font-bold text-slate-900 mt-1 block">
            {metrics.total}
          </span>
        </div>
        <div className="p-5">
          <span className="text-xs text-stone-500 block">Pending Review</span>
          <span className="text-2xl font-mono-tabular font-bold text-stone-800 mt-1 block">
            {metrics.pending}
          </span>
        </div>
        <div className="p-5">
          <span className="text-xs text-emerald-700 block">Approved</span>
          <span className="text-2xl font-mono-tabular font-bold text-emerald-700 mt-1 block">
            {metrics.approved}
          </span>
        </div>
        <div className="p-5">
          <span className="text-xs text-amber-700 block">Waitlisted</span>
          <span className="text-2xl font-mono-tabular font-bold text-amber-700 mt-1 block">
            {metrics.waitlisted}
          </span>
        </div>
        <div className="p-5 col-span-2 sm:col-span-1">
          <span className="text-xs text-red-700 block">Rejected</span>
          <span className="text-2xl font-mono-tabular font-bold text-red-700 mt-1 block">
            {metrics.rejected}
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-stone-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Segmented Decision Filter Controls */}
        <div className="flex flex-wrap items-center gap-1 bg-stone-100 p-1">
          {(
            [
              { id: 'all', label: `All (${metrics.total})` },
              { id: 'pending', label: `Pending (${metrics.pending})` },
              { id: 'approved', label: `Approved (${metrics.approved})` },
              { id: 'waitlisted', label: `Waitlisted (${metrics.waitlisted})` },
              { id: 'rejected', label: `Rejected (${metrics.rejected})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value as 'all' | ApplyingGrade)}
            className="px-3 py-2 text-xs bg-white border border-stone-300 text-stone-800 focus:border-slate-900 focus:outline-none"
          >
            <option value="all">All Entering Grades</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
          </select>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, ID, school..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-stone-300 focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main High-Density Data Table */}
      <div className="bg-white border border-stone-200 overflow-x-auto">
        {loadingData ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-10 bg-stone-100 animate-pulse" />
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-medium text-stone-800">
              No student admission applications match the current view.
            </p>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Submit a new candidate via the Admission Form or load sample preparatory academy
              candidates to test committee approval, waitlisting, and rejection workflows.
            </p>
            {applications.length === 0 && (
              <button
                type="button"
                onClick={handleSeedDemoApplications}
                disabled={seeding}
                className="mt-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {seeding ? 'Loading Sample Candidates...' : 'Load Sample Candidates'}
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-xs text-stone-500 font-medium">
                <th className="py-3 px-4">Reference ID</th>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Grade &amp; Track</th>
                <th className="py-3 px-4 text-right">GPA</th>
                <th className="py-3 px-4">Guardian Contact</th>
                <th className="py-3 px-4">Decision Status</th>
                <th className="py-3 px-4 text-right">Committee Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-xs">
              {filteredApplications.map((app) => {
                const isBusy = updatingId === app.referenceId;
                return (
                  <tr
                    key={app.referenceId}
                    className="hover:bg-stone-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono-tabular font-semibold text-slate-900 whitespace-nowrap">
                      {app.referenceId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-900">
                        {app.studentFirstName} {app.studentLastName}
                      </div>
                      <div className="text-stone-500 mt-0.5">
                        {app.previousSchool} · {app.enrollmentType}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-stone-800">{app.applyingGrade}</div>
                      <div className="text-stone-500 mt-0.5">{app.academicTrack}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-stone-900">
                      {app.gpa}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-stone-800">{app.guardianName}</div>
                      <div className="text-stone-500 mt-0.5">{app.guardianEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {app.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approved
                        </span>
                      )}
                      {app.status === 'waitlisted' && (
                        <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Waitlisted
                        </span>
                      )}
                      {app.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 text-red-700 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          Rejected
                        </span>
                      )}
                      {app.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 text-stone-600 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={isBusy || app.status === 'approved'}
                          onClick={() => handleDecisionUpdate(app, 'approved')}
                          className={`px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                            app.status === 'approved'
                              ? 'bg-emerald-700 text-white border-emerald-700 opacity-60 cursor-default'
                              : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                          }`}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={isBusy || app.status === 'waitlisted'}
                          onClick={() => handleDecisionUpdate(app, 'waitlisted')}
                          className={`px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                            app.status === 'waitlisted'
                              ? 'bg-amber-700 text-white border-amber-700 opacity-60 cursor-default'
                              : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
                          }`}
                        >
                          Waitlist
                        </button>
                        <button
                          type="button"
                          disabled={isBusy || app.status === 'rejected'}
                          onClick={() => handleDecisionUpdate(app, 'rejected')}
                          className={`px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                            app.status === 'rejected'
                              ? 'bg-red-700 text-white border-red-700 opacity-60 cursor-default'
                              : 'bg-white text-red-800 border-red-300 hover:bg-red-50'
                          }`}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedAppId(app.referenceId)}
                          className="px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          Dossier
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Candidate Full Dossier Inspection Panel */}
      {selectedApplication && (
        <div className="bg-white border border-slate-900 p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
            <div>
              <p className="text-xs font-mono-tabular text-stone-500">
                Dossier Reference: {selectedApplication.referenceId} · DOB{' '}
                {selectedApplication.dateOfBirth} · {selectedApplication.gender}
              </p>
              <h3 className="text-2xl font-serif-display text-stone-900 mt-1">
                {selectedApplication.studentFirstName} {selectedApplication.studentLastName}
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                {selectedApplication.applyingGrade} · {selectedApplication.enrollmentType} ·{' '}
                {selectedApplication.academicTrack}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedAppId(null)}
              className="p-2 text-stone-500 hover:text-stone-900 border border-stone-200 hover:bg-stone-100 cursor-pointer"
              aria-label="Close dossier"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-2">
                  Candidate Personal Essay
                </h4>
                <div className="p-4 bg-stone-50 border border-stone-200 text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
                  {selectedApplication.personalStatement}
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-2">
                  Extracurricular Distinctions &amp; Honors
                </h4>
                <div className="p-4 bg-stone-50 border border-stone-200 text-xs text-stone-700 leading-relaxed">
                  {selectedApplication.extracurriculars || 'None listed.'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-200 text-xs">
                <div>
                  <span className="text-stone-500 block">Current School &amp; Cumulative GPA</span>
                  <span className="font-semibold text-stone-900 font-mono-tabular mt-0.5 block">
                    {selectedApplication.previousSchool} · GPA {selectedApplication.gpa}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">Primary Guardian &amp; Relationship</span>
                  <span className="font-semibold text-stone-900 mt-0.5 block">
                    {selectedApplication.guardianName} ({selectedApplication.guardianRelationship})
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">Guardian Email &amp; Telephone</span>
                  <span className="font-mono-tabular text-stone-900 mt-0.5 block">
                    {selectedApplication.guardianEmail} · {selectedApplication.guardianPhone}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">Residential Address</span>
                  <span className="text-stone-900 mt-0.5 block">
                    {selectedApplication.residentialAddress}
                  </span>
                </div>
              </div>
            </div>

            {/* Committee Decision & Remarks Column */}
            <div className="bg-stone-50 border border-stone-200 p-5 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-stone-500 font-semibold block">
                    Committee Decision Control
                  </span>
                  <p className="text-xs text-stone-500 mt-1">
                    Select an official status and record committee remarks visible on the
                    applicant’s Status Lookup receipt.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    Official Committee Remarks / Decision Note
                  </label>
                  <textarea
                    rows={4}
                    maxLength={BLUEPRINT_CONSTRAINTS.adminNotes.maxLength}
                    value={drawerNotes}
                    onChange={(e) => setDrawerNotes(e.target.value)}
                    placeholder="Enter scholarship note, waitlist instructions, or reviewer feedback..."
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    disabled={updatingId === selectedApplication.referenceId}
                    onClick={() =>
                      handleDecisionUpdate(selectedApplication, 'approved', drawerNotes)
                    }
                    className="w-full px-4 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Application
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === selectedApplication.referenceId}
                    onClick={() =>
                      handleDecisionUpdate(selectedApplication, 'waitlisted', drawerNotes)
                    }
                    className="w-full px-4 py-2.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Place on Waitlist
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === selectedApplication.referenceId}
                    onClick={() =>
                      handleDecisionUpdate(selectedApplication, 'rejected', drawerNotes)
                    }
                    className="w-full px-4 py-2.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Application
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === selectedApplication.referenceId}
                    onClick={() =>
                      handleDecisionUpdate(
                        selectedApplication,
                        selectedApplication.status,
                        drawerNotes
                      )
                    }
                    className="w-full px-4 py-2 text-xs font-medium text-stone-800 bg-white border border-stone-300 hover:bg-stone-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Note Only
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                <span className="text-xs text-stone-500">
                  {selectedApplication.reviewedBy
                    ? `Reviewed by ${selectedApplication.reviewedBy}`
                    : 'Not yet reviewed'}
                </span>
                <button
                  type="button"
                  disabled={updatingId === selectedApplication.referenceId}
                  onClick={() => handleDeleteApplication(selectedApplication)}
                  className="px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
