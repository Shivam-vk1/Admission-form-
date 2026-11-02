import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Search, CheckCircle2, Clock, XCircle, AlertTriangle, FileSearch } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  ApplicationStatusPublicRecord,
  BLUEPRINT_CONSTRAINTS,
  DecisionStatus,
} from '../types/admissions';

interface StatusLookupProps {
  initialReferenceId?: string;
}

export const StatusLookup: React.FC<StatusLookupProps> = ({ initialReferenceId = '' }) => {
  const [referenceInput, setReferenceInput] = useState<string>(initialReferenceId);
  const [loading, setLoading] = useState<boolean>(false);
  const [record, setRecord] = useState<ApplicationStatusPublicRecord | null>(null);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);

  const performLookup = async (refIdRaw: string) => {
    const cleanRef = refIdRaw.trim().toUpperCase();
    if (!cleanRef) {
      setNotFoundError('Please enter your Application Reference Number (e.g., CPA-2026-8492).');
      return;
    }
    if (
      cleanRef.length < BLUEPRINT_CONSTRAINTS.referenceId.minLength ||
      cleanRef.length > BLUEPRINT_CONSTRAINTS.referenceId.maxLength ||
      !BLUEPRINT_CONSTRAINTS.referenceId.pattern.test(cleanRef)
    ) {
      setNotFoundError(
        'Invalid Reference Number format. Reference IDs use letters, numbers, and hyphens (e.g., CPA-2026-8492).'
      );
      return;
    }

    setLoading(true);
    setNotFoundError(null);
    setRecord(null);

    try {
      const snap = await getDoc(doc(db, 'application_status', cleanRef));
      if (!snap.exists()) {
        setNotFoundError(
          `No admission record found matching Reference ID "${cleanRef}". Please verify the code on your receipt.`
        );
      } else {
        setRecord(snap.data() as ApplicationStatusPublicRecord);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `application_status/${cleanRef}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialReferenceId) {
      setReferenceInput(initialReferenceId);
      performLookup(initialReferenceId);
    }
  }, [initialReferenceId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(referenceInput);
  };

  const renderStatusMeta = (status: DecisionStatus) => {
    switch (status) {
      case 'approved':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-700" />,
          label: 'Approved for Admission',
          colorText: 'text-emerald-800',
          bannerBg: 'bg-emerald-50 border-emerald-200',
          explanation:
            'Congratulations! The Admissions Committee has approved this candidate for enrollment at Crestwood Preparatory Academy.',
        };
      case 'waitlisted':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-700" />,
          label: 'Placed on Honors Waitlist',
          colorText: 'text-amber-800',
          bannerBg: 'bg-amber-50 border-amber-200',
          explanation:
            'The Committee recognized strong academic merit and has placed this application on the priority waitlist pending seat availability.',
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-5 h-5 text-red-700" />,
          label: 'Admission Declined',
          colorText: 'text-red-800',
          bannerBg: 'bg-red-50 border-red-200',
          explanation:
            'After careful holistic evaluation, the Admissions Committee is unable to offer placement for the upcoming academic term.',
        };
      default:
        return {
          icon: <Clock className="w-5 h-5 text-stone-700" />,
          label: 'Pending Committee Review',
          colorText: 'text-stone-800',
          bannerBg: 'bg-stone-100 border-stone-300',
          explanation:
            'Your admission dossier has been received and is currently queued for review by the Faculty Admissions Committee.',
        };
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-stone-200 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-widest text-stone-500">
          Candidate Decision Portal
        </p>
        <h2 className="text-2xl font-serif-display text-stone-900 mt-1">
          Check Application Decision Status
        </h2>
        <p className="text-sm text-stone-600 mt-1.5 leading-relaxed">
          Enter the Application Reference ID generated upon submission (for example,{' '}
          <span className="font-mono-tabular text-stone-800">CPA-2026-8492</span>) to view real-time
          Admissions Committee updates.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={referenceInput}
              onChange={(e) => setReferenceInput(e.target.value.toUpperCase())}
              placeholder="CPA-2026-XXXXX"
              maxLength={32}
              className="w-full pl-10 pr-4 py-2.5 text-sm font-mono-tabular uppercase bg-white border border-stone-300 focus:border-slate-900 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {loading ? 'Searching Records...' : 'Check Status'}
          </button>
        </form>

        {notFoundError && (
          <div className="mt-5 p-4 bg-stone-50 border border-stone-200 text-xs text-stone-700 flex items-center gap-2.5">
            <FileSearch className="w-4 h-4 text-stone-500 shrink-0" />
            <span>{notFoundError}</span>
          </div>
        )}
      </div>

      {record && (
        <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6">
          {(() => {
            const meta = renderStatusMeta(record.status);
            return (
              <>
                <div
                  className={`p-5 border ${meta.bannerBg} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{meta.icon}</div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-stone-500 block">
                        Official Decision Status
                      </span>
                      <h3 className={`text-lg font-serif-display font-semibold ${meta.colorText}`}>
                        {meta.label}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        {meta.explanation}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-xs text-stone-500 block">Reference ID</span>
                    <span className="text-base font-mono-tabular font-bold text-slate-900">
                      {record.referenceId}
                    </span>
                  </div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm pt-2">
                  <div>
                    <dt className="text-xs text-stone-500">Candidate Identifier</dt>
                    <dd className="font-medium text-stone-900 mt-0.5">{record.studentInitials}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-stone-500">Grade &amp; Enrollment</dt>
                    <dd className="font-medium text-stone-900 mt-0.5">
                      {record.applyingGrade} · {record.enrollmentType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-stone-500">Selected Academic Track</dt>
                    <dd className="font-medium text-stone-900 mt-0.5">{record.academicTrack}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-stone-500">Last Updated</dt>
                    <dd className="font-mono-tabular text-stone-900 mt-0.5">
                      {record.updatedAt?.toDate
                        ? record.updatedAt.toDate().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Just now'}
                    </dd>
                  </div>
                </dl>

                {record.decisionSummary && (
                  <div className="pt-4 border-t border-stone-200">
                    <span className="text-xs uppercase tracking-wider text-stone-500 block mb-1.5">
                      Admissions Committee Remarks
                    </span>
                    <p className="text-sm text-stone-800 bg-stone-50 border border-stone-200 p-4 leading-relaxed">
                      {record.decisionSummary}
                    </p>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
