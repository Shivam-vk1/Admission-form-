import React, { useState } from 'react';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import {
  CheckCircle2,
  Copy,
  Check,
  Printer,
  ArrowRight,
  ArrowLeft,
  FileText,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  AcademicTrack,
  ACADEMIC_TRACK_DETAILS,
  ApplicationFormInput,
  ApplyingGrade,
  BLUEPRINT_CONSTRAINTS,
  EnrollmentType,
  GenderOption,
  generateReferenceId,
  sanitizeString,
} from '../types/admissions';

interface AdmissionWizardProps {
  onLookupReference: (refId: string) => void;
}

const INITIAL_FORM: ApplicationFormInput = {
  studentFirstName: '',
  studentLastName: '',
  dateOfBirth: '',
  gender: 'Female',
  applyingGrade: 'Grade 9',
  enrollmentType: 'Day Student',
  academicTrack: 'STEM & Research Honors',
  previousSchool: '',
  gpa: '',
  extracurriculars: '',
  guardianName: '',
  guardianRelationship: 'Parent',
  guardianEmail: '',
  guardianPhone: '',
  residentialAddress: '',
  personalStatement: '',
};

const SAMPLE_APPLICANTS: ApplicationFormInput[] = [
  {
    studentFirstName: 'Eleanor',
    studentLastName: 'Vance',
    dateOfBirth: '2011-04-18',
    gender: 'Female',
    applyingGrade: 'Grade 9',
    enrollmentType: 'Boarding Student',
    academicTrack: 'STEM & Research Honors',
    previousSchool: 'St. Jude Classical Day School',
    gpa: '3.96',
    extracurriculars:
      'First Place Regional Math Olympiad, Captain of Middle School Robotics Team, Cello Section Leader in Youth Chamber Orchestra.',
    guardianName: 'Dr. Arthur Vance',
    guardianRelationship: 'Father',
    guardianEmail: 'arthur.vance@example.org',
    guardianPhone: '+1 (617) 555-0148',
    residentialAddress: '42 Commonwealth Ave, Boston, MA 02116',
    personalStatement:
      'At Crestwood Preparatory Academy, I hope to combine my passion for computational biology and wet-lab genetics inside the Integrated Science Pavilion. Over the past two years, I built an open-source microscope image classifier for local water quality monitoring, and I am eager to pursue a Senior Independent Laboratory Thesis under faculty mentorship.',
  },
  {
    studentFirstName: 'Julian',
    studentLastName: 'Mercer',
    dateOfBirth: '2010-09-12',
    gender: 'Male',
    applyingGrade: 'Grade 10',
    enrollmentType: 'Day Student',
    academicTrack: 'Classical Humanities & Law',
    previousSchool: 'Westfield Latin Academy',
    gpa: '3.89',
    extracurriculars:
      'Varsity Debate Speaker of the Year, Latin Sight-Reading Gold Medalist, Editor of the Student Historical Review.',
    guardianName: 'claire.mercer@example.org',
    guardianRelationship: 'Mother',
    guardianEmail: 'claire.mercer@example.org',
    guardianPhone: '+1 (617) 555-0192',
    residentialAddress: '118 Brattle Street, Cambridge, MA 02138',
    personalStatement:
      'Studying constitutional history and classical rhetoric has taught me that persuasive writing requires both historical rigor and empathy. I am applying to Crestwood Preparatory to participate in the Harkness seminar tables and prepare an Appellate Moot Court brief alongside peers who love primary-source inquiry.',
  },
];

// Fix sample guardianName in second sample
SAMPLE_APPLICANTS[1].guardianName = 'Claire Mercer';

export const AdmissionWizard: React.FC<AdmissionWizardProps> = ({ onLookupReference }) => {
  const [step, setStep] = useState<number>(1);
  const [form, setForm] = useState<ApplicationFormInput>(INITIAL_FORM);
  const [honorCodeAccepted, setHonorCodeAccepted] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedRefId, setSubmittedRefId] = useState<string | null>(null);
  const [submittedTimestamp, setSubmittedTimestamp] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [sampleIndex, setSampleIndex] = useState<number>(0);

  const updateField = <K extends keyof ApplicationFormInput>(
    field: K,
    value: ApplicationFormInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (validationError) setValidationError(null);
  };

  const handleAutofillSample = () => {
    const sample = SAMPLE_APPLICANTS[sampleIndex % SAMPLE_APPLICANTS.length];
    setSampleIndex((prev) => prev + 1);
    setForm(sample);
    setHonorCodeAccepted(true);
    setValidationError(null);
  };

  const validateStep = (currentStep: number): string | null => {
    if (currentStep === 1) {
      if (form.studentFirstName.trim().length < BLUEPRINT_CONSTRAINTS.studentFirstName.minLength) {
        return 'Please enter the student’s legal first name.';
      }
      if (form.studentLastName.trim().length < BLUEPRINT_CONSTRAINTS.studentLastName.minLength) {
        return 'Please enter the student’s legal last name.';
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth.trim())) {
        return 'Please select a valid date of birth (YYYY-MM-DD).';
      }
    } else if (currentStep === 2) {
      if (form.previousSchool.trim().length < BLUEPRINT_CONSTRAINTS.previousSchool.minLength) {
        return 'Please enter the student’s current or previous school name (at least 2 characters).';
      }
      const gpaNum = parseFloat(form.gpa);
      if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4.0) {
        return 'Please enter a valid cumulative unweighted GPA between 0.00 and 4.00.';
      }
    } else if (currentStep === 3) {
      if (form.guardianName.trim().length < BLUEPRINT_CONSTRAINTS.guardianName.minLength) {
        return 'Please enter the primary parent or legal guardian’s full name.';
      }
      if (
        form.guardianRelationship.trim().length <
        BLUEPRINT_CONSTRAINTS.guardianRelationship.minLength
      ) {
        return 'Please specify the guardian’s relationship to the applicant.';
      }
      if (
        form.guardianEmail.trim().length < BLUEPRINT_CONSTRAINTS.guardianEmail.minLength ||
        !form.guardianEmail.includes('@')
      ) {
        return 'Please enter a valid parent/guardian email address.';
      }
      if (form.guardianPhone.trim().length < BLUEPRINT_CONSTRAINTS.guardianPhone.minLength) {
        return 'Please enter a valid contact telephone number (at least 7 digits).';
      }
      if (
        form.residentialAddress.trim().length < BLUEPRINT_CONSTRAINTS.residentialAddress.minLength
      ) {
        return 'Please enter the full family residential address.';
      }
    } else if (currentStep === 4) {
      const statementLen = form.personalStatement.trim().length;
      if (statementLen < BLUEPRINT_CONSTRAINTS.personalStatement.minLength) {
        return `Personal statement must be at least ${BLUEPRINT_CONSTRAINTS.personalStatement.minLength} characters (currently ${statementLen}).`;
      }
      if (statementLen > BLUEPRINT_CONSTRAINTS.personalStatement.maxLength) {
        return `Personal statement cannot exceed ${BLUEPRINT_CONSTRAINTS.personalStatement.maxLength} characters.`;
      }
      if (!honorCodeAccepted) {
        return 'Please confirm the Academic Integrity & Admission Declaration before submitting.';
      }
    }
    return null;
  };

  const handleNextStep = () => {
    const err = validateStep(step);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setValidationError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    for (let s = 1; s <= 4; s++) {
      const err = validateStep(s);
      if (err) {
        setStep(s);
        setValidationError(err);
        return;
      }
    }

    setIsSubmitting(true);
    setValidationError(null);

    const referenceId = generateReferenceId();
    const currentUser = auth.currentUser;
    // Firestore rules require verified email if using authenticated UID, otherwise 'public'
    const applicantUid =
      currentUser && currentUser.emailVerified ? currentUser.uid : 'public';

    const cleanFirstName = sanitizeString(
      form.studentFirstName,
      BLUEPRINT_CONSTRAINTS.studentFirstName.maxLength
    );
    const cleanLastName = sanitizeString(
      form.studentLastName,
      BLUEPRINT_CONSTRAINTS.studentLastName.maxLength
    );
    const formattedGpa = parseFloat(form.gpa).toFixed(2);

    const applicationPayload = {
      referenceId,
      studentFirstName: cleanFirstName,
      studentLastName: cleanLastName,
      dateOfBirth: sanitizeString(form.dateOfBirth, BLUEPRINT_CONSTRAINTS.dateOfBirth.maxLength),
      gender: form.gender,
      applyingGrade: form.applyingGrade,
      enrollmentType: form.enrollmentType,
      academicTrack: form.academicTrack,
      previousSchool: sanitizeString(
        form.previousSchool,
        BLUEPRINT_CONSTRAINTS.previousSchool.maxLength
      ),
      gpa: sanitizeString(formattedGpa, BLUEPRINT_CONSTRAINTS.gpa.maxLength),
      extracurriculars: sanitizeString(
        form.extracurriculars,
        BLUEPRINT_CONSTRAINTS.extracurriculars.maxLength
      ),
      guardianName: sanitizeString(form.guardianName, BLUEPRINT_CONSTRAINTS.guardianName.maxLength),
      guardianRelationship: sanitizeString(
        form.guardianRelationship,
        BLUEPRINT_CONSTRAINTS.guardianRelationship.maxLength
      ),
      guardianEmail: sanitizeString(
        form.guardianEmail,
        BLUEPRINT_CONSTRAINTS.guardianEmail.maxLength
      ),
      guardianPhone: sanitizeString(
        form.guardianPhone,
        BLUEPRINT_CONSTRAINTS.guardianPhone.maxLength
      ),
      residentialAddress: sanitizeString(
        form.residentialAddress,
        BLUEPRINT_CONSTRAINTS.residentialAddress.maxLength
      ),
      personalStatement: sanitizeString(
        form.personalStatement,
        BLUEPRINT_CONSTRAINTS.personalStatement.maxLength
      ),
      status: 'pending' as const,
      adminNotes: '',
      reviewedBy: '',
      applicantUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const statusPayload = {
      referenceId,
      studentInitials: `${cleanFirstName} ${cleanLastName.charAt(0).toUpperCase()}.`,
      applyingGrade: form.applyingGrade,
      enrollmentType: form.enrollmentType,
      academicTrack: form.academicTrack,
      status: 'pending' as const,
      decisionSummary: '',
      applicantUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'applications', referenceId), applicationPayload);
      batch.set(doc(db, 'application_status', referenceId), statusPayload);
      await batch.commit();

      setSubmittedRefId(referenceId);
      setSubmittedTimestamp(
        new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch (error) {
      setIsSubmitting(false);
      handleFirestoreError(error, OperationType.CREATE, `applications/${referenceId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    if (!submittedRefId) return;
    navigator.clipboard.writeText(submittedRefId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetNewApplication = () => {
    setSubmittedRefId(null);
    setForm(INITIAL_FORM);
    setHonorCodeAccepted(false);
    setStep(1);
    setValidationError(null);
  };

  if (submittedRefId) {
    return (
      <div className="bg-white border border-stone-200 p-6 sm:p-10 max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <p className="text-xs uppercase tracking-widest text-emerald-700 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Official Admission Dossier Recorded
            </p>
            <h2 className="text-2xl sm:text-3xl font-serif-display text-stone-900 mt-1">
              Application Confirmation Receipt
            </h2>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-stone-500 block">Reference Number</span>
            <span className="text-lg font-mono-tabular font-semibold text-slate-900">
              {submittedRefId}
            </span>
          </div>
        </div>

        <div className="py-6 space-y-6">
          <p className="text-sm text-stone-600 leading-relaxed">
            Thank you for submitting an application for{' '}
            <strong className="text-stone-900 font-semibold">
              {form.studentFirstName} {form.studentLastName}
            </strong>{' '}
            to Crestwood Preparatory Academy. Please save your Application Reference ID below to
            track real-time committee decisions.
          </p>

          <div className="bg-stone-50 border border-stone-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-stone-500 block">
                Application Reference ID
              </span>
              <span className="text-2xl font-mono-tabular font-bold text-slate-900 tracking-tight mt-0.5 block">
                {submittedRefId}
              </span>
              <span className="text-xs text-stone-500 mt-1 block">
                Submitted {submittedTimestamp} · Status: Pending Committee Review
              </span>
            </div>
            <div className="flex items-center gap-2 no-print">
              <button
                type="button"
                onClick={handleCopyRef}
                className="px-3.5 py-2 text-xs font-medium bg-white border border-stone-300 text-stone-800 hover:bg-stone-100 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    Copied ID
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Reference ID
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 text-xs font-medium bg-white border border-stone-300 text-stone-800 hover:bg-stone-100 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm border-t border-stone-200 pt-6">
            <div>
              <dt className="text-xs text-stone-500">Candidate Name</dt>
              <dd className="font-medium text-stone-900 mt-0.5">
                {form.studentFirstName} {form.studentLastName}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Entering Grade &amp; Program</dt>
              <dd className="font-medium text-stone-900 mt-0.5">
                {form.applyingGrade} · {form.enrollmentType}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Honors Academic Track</dt>
              <dd className="font-medium text-stone-900 mt-0.5">{form.academicTrack}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Current School &amp; GPA</dt>
              <dd className="font-medium text-stone-900 mt-0.5 font-mono-tabular">
                {form.previousSchool} · GPA {parseFloat(form.gpa).toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Primary Guardian</dt>
              <dd className="font-medium text-stone-900 mt-0.5">
                {form.guardianName} ({form.guardianRelationship})
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Guardian Contact</dt>
              <dd className="font-medium text-stone-900 mt-0.5">{form.guardianEmail}</dd>
            </div>
          </dl>
        </div>

        <div className="pt-6 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4 no-print">
          <button
            type="button"
            onClick={handleResetNewApplication}
            className="px-4 py-2 text-xs font-medium text-stone-700 border border-stone-300 hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Submit Another Application
          </button>
          <button
            type="button"
            onClick={() => onLookupReference(submittedRefId)}
            className="px-5 py-2.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Check Live Application Status
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { num: 1, title: '01. Student Identity' },
    { num: 2, title: '02. Academic History' },
    { num: 3, title: '03. Guardian Contact' },
    { num: 4, title: '04. Essay & Declaration' },
  ];

  return (
    <div className="bg-white border border-stone-200">
      {/* Wizard Header & Quick Sample Fill */}
      <div className="px-6 py-5 sm:px-8 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-stone-500">
            2026–2027 Academic Year · Grades 9–12
          </p>
          <h2 className="text-xl sm:text-2xl font-serif-display text-stone-900 mt-0.5">
            Candidate Admission Application
          </h2>
        </div>
        <button
          type="button"
          onClick={handleAutofillSample}
          className="px-3.5 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 transition-colors flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          Fill Sample Candidate
        </button>
      </div>

      {/* Step Progress Rail */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-stone-200 bg-stone-50/70">
        {steps.map((s) => {
          const isActive = step === s.num;
          const isCompleted = step > s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num < step) {
                  setValidationError(null);
                  setStep(s.num);
                }
              }}
              className={`px-4 py-3.5 text-left border-r last:border-r-0 border-stone-200 transition-colors ${
                isActive
                  ? 'bg-white text-slate-900 font-semibold border-b-2 border-b-amber-700'
                  : isCompleted
                  ? 'text-stone-700 hover:bg-stone-100 cursor-pointer'
                  : 'text-stone-400 cursor-default'
              }`}
            >
              <span className="text-xs block truncate">{s.title}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmitApplication} className="p-6 sm:p-8 space-y-6">
        {validationError && (
          <div
            role="alert"
            className="p-4 bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* STEP 1: STUDENT IDENTITY */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Student Legal First Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={BLUEPRINT_CONSTRAINTS.studentFirstName.maxLength}
                  value={form.studentFirstName}
                  onChange={(e) => updateField('studentFirstName', e.target.value)}
                  placeholder="e.g., Eleanor"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Student Legal Last Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={BLUEPRINT_CONSTRAINTS.studentLastName.maxLength}
                  value={form.studentLastName}
                  onChange={(e) => updateField('studentLastName', e.target.value)}
                  placeholder="e.g., Vance"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  required
                  value={form.dateOfBirth}
                  onChange={(e) => updateField('dateOfBirth', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono-tabular bg-white border border-stone-300 focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Gender *
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => updateField('gender', e.target.value as GenderOption)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 focus:border-slate-900 focus:outline-none"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer Not to Say">Prefer Not to Say</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-2">
                  Applying Grade Level (High School) *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'] as ApplyingGrade[]).map(
                    (grade) => (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => updateField('applyingGrade', grade)}
                        className={`px-3.5 py-2.5 text-xs font-medium border text-left transition-colors cursor-pointer ${
                          form.applyingGrade === grade
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {grade}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-2">
                  Residency &amp; Enrollment Preference *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['Day Student', 'Boarding Student'] as EnrollmentType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateField('enrollmentType', type)}
                      className={`px-3.5 py-2.5 text-xs font-medium border text-left transition-colors cursor-pointer ${
                        form.enrollmentType === type
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ACADEMIC HISTORY & TRACK */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-2">
                Select Preparatory Academic Track *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ACADEMIC_TRACK_DETAILS.map((track) => {
                  const selected = form.academicTrack === track.id;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => updateField('academicTrack', track.id as AcademicTrack)}
                      className={`p-4 border text-left transition-colors cursor-pointer ${
                        selected
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <div className="text-sm font-semibold">{track.id}</div>
                      <div
                        className={`text-xs mt-1 leading-relaxed ${
                          selected ? 'text-stone-300' : 'text-stone-500'
                        }`}
                      >
                        {track.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Current / Most Recent School Attended *
                </label>
                <input
                  type="text"
                  required
                  maxLength={BLUEPRINT_CONSTRAINTS.previousSchool.maxLength}
                  value={form.previousSchool}
                  onChange={(e) => updateField('previousSchool', e.target.value)}
                  placeholder="e.g., St. Jude Classical Day School"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Unweighted GPA (4.00 Scale) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.0"
                  required
                  value={form.gpa}
                  onChange={(e) => updateField('gpa', e.target.value)}
                  placeholder="e.g., 3.92"
                  className="w-full px-3.5 py-2.5 text-sm font-mono-tabular bg-white border border-stone-300 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-stone-700">
                  Honors, Extracurricular Activities &amp; Athletic / Artistic Distinctions
                </label>
                <span className="text-xs font-mono-tabular text-stone-400">
                  {form.extracurriculars.length}/{BLUEPRINT_CONSTRAINTS.extracurriculars.maxLength}
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={BLUEPRINT_CONSTRAINTS.extracurriculars.maxLength}
                value={form.extracurriculars}
                onChange={(e) => updateField('extracurriculars', e.target.value)}
                placeholder="Summarize academic competitions, musical instruments, varsity athletics, or community leadership roles..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 3: GUARDIAN CONTACT */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Parent or Legal Guardian Full Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={BLUEPRINT_CONSTRAINTS.guardianName.maxLength}
                  value={form.guardianName}
                  onChange={(e) => updateField('guardianName', e.target.value)}
                  placeholder="e.g., Dr. Arthur Vance"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Relationship to Applicant *
                </label>
                <input
                  type="text"
                  required
                  maxLength={BLUEPRINT_CONSTRAINTS.guardianRelationship.maxLength}
                  value={form.guardianRelationship}
                  onChange={(e) => updateField('guardianRelationship', e.target.value)}
                  placeholder="e.g., Father, Mother, Legal Guardian"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Guardian Email Address (For Admissions Notifications) *
                </label>
                <input
                  type="email"
                  required
                  maxLength={BLUEPRINT_CONSTRAINTS.guardianEmail.maxLength}
                  value={form.guardianEmail}
                  onChange={(e) => updateField('guardianEmail', e.target.value)}
                  placeholder="parent@example.org"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Primary Contact Telephone *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={BLUEPRINT_CONSTRAINTS.guardianPhone.maxLength}
                  value={form.guardianPhone}
                  onChange={(e) => updateField('guardianPhone', e.target.value)}
                  placeholder="+1 (617) 555-0148"
                  className="w-full px-3.5 py-2.5 text-sm font-mono-tabular bg-white border border-stone-300 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Current Family Residential Address *
              </label>
              <input
                type="text"
                required
                maxLength={BLUEPRINT_CONSTRAINTS.residentialAddress.maxLength}
                value={form.residentialAddress}
                onChange={(e) => updateField('residentialAddress', e.target.value)}
                placeholder="Street Address, City, State / Province, Postal Code"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 4: PERSONAL STATEMENT & DECLARATION */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-stone-700">
                  Candidate Personal Essay (Minimum 20 characters) *
                </label>
                <span className="text-xs font-mono-tabular text-stone-500">
                  {form.personalStatement.trim().length} /{' '}
                  {BLUEPRINT_CONSTRAINTS.personalStatement.maxLength} chars
                </span>
              </div>
              <p className="text-xs text-stone-500 mb-2">
                Describe an intellectual question, creative work, or leadership challenge that has
                shaped your academic ambitions at Crestwood Preparatory Academy.
              </p>
              <textarea
                rows={5}
                required
                maxLength={BLUEPRINT_CONSTRAINTS.personalStatement.maxLength}
                value={form.personalStatement}
                onChange={(e) => updateField('personalStatement', e.target.value)}
                placeholder="Write your personal statement here..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 focus:border-slate-900 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Summary Verification Table */}
            <div className="bg-stone-50 border border-stone-200 p-4 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Dossier Verification Summary
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700 pt-1">
                <div>
                  <span className="text-stone-500">Applicant:</span>{' '}
                  <strong className="font-medium text-stone-900">
                    {form.studentFirstName || '—'} {form.studentLastName || ''}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-500">Program:</span>{' '}
                  <strong className="font-medium text-stone-900">
                    {form.applyingGrade} · {form.enrollmentType}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-500">Honors Track:</span>{' '}
                  <strong className="font-medium text-stone-900">{form.academicTrack}</strong>
                </div>
                <div>
                  <span className="text-stone-500">Previous School &amp; GPA:</span>{' '}
                  <strong className="font-medium text-stone-900 font-mono-tabular">
                    {form.previousSchool || '—'} ({form.gpa || '—'})
                  </strong>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={honorCodeAccepted}
                onChange={(e) => {
                  setHonorCodeAccepted(e.target.checked);
                  if (validationError) setValidationError(null);
                }}
                className="mt-1 w-4 h-4 accent-slate-900"
              />
              <span className="text-xs text-stone-600 leading-relaxed">
                I certify that all information submitted in this admission application, including
                academic records and the personal essay, is accurate and the original work of the
                candidate.
              </span>
            </label>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="pt-6 border-t border-stone-200 flex items-center justify-between gap-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous Step
            </button>
          ) : (
            <div className="text-xs text-stone-500">Step 1 of 4 · All fields marked * required</div>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Continue to Step {step + 1}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 disabled:opacity-50 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isSubmitting ? 'Recording Application Dossier...' : 'Submit Official Application'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
