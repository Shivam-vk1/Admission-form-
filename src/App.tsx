/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ADMIN_EMAIL, auth } from './lib/firebase';
import { ACADEMIC_TRACK_DETAILS } from './types/admissions';
import { CampusIllustration } from './components/CampusIllustration';
import { AdmissionWizard } from './components/AdmissionWizard';
import { StatusLookup } from './components/StatusLookup';
import { AdminConsole } from './components/AdminConsole';

type ActiveSection = 'apply' | 'tracks' | 'status' | 'admin';

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('apply');
  const [lookupRefId, setLookupRefId] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLookupReference = (refId: string) => {
    setLookupRefId(refId);
    setActiveSection('status');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdminSignedIn =
    Boolean(currentUser) &&
    currentUser?.emailVerified === true &&
    currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-stone-900">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#FBF9F5]/95 backdrop-blur-xs border-b border-stone-200 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-4">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => setActiveSection('apply')}
            className="text-lg sm:text-xl font-serif-display font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Crestwood Preparatory
          </button>

          {/* Zone 2: 4 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
            <button
              type="button"
              onClick={() => setActiveSection('apply')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'apply'
                  ? 'text-slate-900 underline underline-offset-8 decoration-amber-700 decoration-2 font-semibold'
                  : ''
              }`}
            >
              Admission Form
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('tracks')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'tracks'
                  ? 'text-slate-900 underline underline-offset-8 decoration-amber-700 decoration-2 font-semibold'
                  : ''
              }`}
            >
              Academic Tracks
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('status')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'status'
                  ? 'text-slate-900 underline underline-offset-8 decoration-amber-700 decoration-2 font-semibold'
                  : ''
              }`}
            >
              Check Status
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('admin')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'admin'
                  ? 'text-slate-900 underline underline-offset-8 decoration-amber-700 decoration-2 font-semibold'
                  : ''
              }`}
            >
              Admin Portal
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() =>
                setActiveSection(activeSection === 'admin' ? 'apply' : 'admin')
              }
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {activeSection === 'admin'
                ? 'Back to Admission Form'
                : isAdminSignedIn
                ? 'Manage Submissions'
                : 'Admin Gmail Login'}
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center justify-around border-t border-stone-200 bg-white px-2 py-2 text-xs font-medium text-stone-600">
          <button
            type="button"
            onClick={() => setActiveSection('apply')}
            className={`px-2 py-1 whitespace-nowrap shrink-0 ${
              activeSection === 'apply' ? 'text-slate-900 font-semibold underline' : ''
            }`}
          >
            Admission Form
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('tracks')}
            className={`px-2 py-1 whitespace-nowrap shrink-0 ${
              activeSection === 'tracks' ? 'text-slate-900 font-semibold underline' : ''
            }`}
          >
            Tracks
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('status')}
            className={`px-2 py-1 whitespace-nowrap shrink-0 ${
              activeSection === 'status' ? 'text-slate-900 font-semibold underline' : ''
            }`}
          >
            Check Status
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('admin')}
            className={`px-2 py-1 whitespace-nowrap shrink-0 ${
              activeSection === 'admin' ? 'text-slate-900 font-semibold underline' : ''
            }`}
          >
            Admin Login
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 sm:py-12 space-y-12">
        {activeSection === 'apply' && (
          <>
            {/* Institutional Hero Split */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch no-print">
              <div className="lg:col-span-7 bg-white border border-stone-200 p-6 sm:p-10 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="text-xs text-stone-500">
                    Grades 9–12 College Preparatory · Day &amp; Boarding · Fall 2026 Enrollment
                  </div>
                  <h1
                    className="text-3xl sm:text-5xl font-serif-display text-stone-900 leading-tight"
                    style={{ textWrap: 'balance' }}
                  >
                    Office of Admissions &amp; Honors Matriculation
                  </h1>
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl">
                    Crestwood Preparatory Academy welcomes applications from curious, principled
                    students entering Grades 9 through 12. Complete the official admission dossier
                    below or sign in to the Admissions Committee portal via Gmail to review and
                    manage candidate decisions.
                  </p>
                </div>

                <div className="pt-8 mt-8 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-stone-500">
                    Early Decision: Nov 15 · Regular Decision: Jan 15 · Rolling Transfers
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveSection('status')}
                      className="px-4 py-2 text-xs font-medium text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Check Application Status
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('admin')}
                      className="px-4 py-2 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Committee Gmail Login
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <CampusIllustration />
              </div>
            </section>

            {/* Admission Form Wizard Section */}
            <section id="admission-form">
              <AdmissionWizard onLookupReference={handleLookupReference} />
            </section>
          </>
        )}

        {activeSection === 'tracks' && (
          <section className="space-y-8">
            <div className="bg-white border border-stone-200 p-6 sm:p-10">
              <p className="text-xs uppercase tracking-widest text-stone-500">
                Upper School Curriculum · Grades 9–12
              </p>
              <h1
                className="text-3xl sm:text-4xl font-serif-display text-stone-900 mt-1"
                style={{ textWrap: 'balance' }}
              >
                Preparatory Honors Tracks &amp; Diploma Pathways
              </h1>
              <p className="text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
                Every candidate selects a primary academic concentration during admission. All
                four tracks fulfill rigorous collegiate matriculation requirements and culminate in
                a defended Senior Thesis or Conservatory Capstone.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {ACADEMIC_TRACK_DETAILS.map((track, idx) => (
                  <div
                    key={track.id}
                    className="border border-stone-200 p-6 bg-[#FBF9F5] flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="text-xs font-mono-tabular text-amber-800 font-semibold">
                        0{idx + 1}. {track.facultyRatio}
                      </div>
                      <h2 className="text-xl font-serif-display text-stone-900">{track.id}</h2>
                      <p className="text-xs text-stone-600 leading-relaxed">{track.subtitle}</p>
                    </div>

                    <dl className="pt-4 border-t border-stone-200 space-y-2 text-xs">
                      <div>
                        <dt className="text-stone-500">Core Seminars:</dt>
                        <dd className="font-medium text-stone-800 mt-0.5">
                          {track.curriculumFocus}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Senior Capstone:</dt>
                        <dd className="font-medium text-stone-800 mt-0.5">
                          {track.capstoneRequirement}
                        </dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-stone-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveSection('apply')}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Proceed to Admission Application
                </button>
              </div>
            </div>
          </section>
        )}

        {activeSection === 'status' && (
          <section>
            <StatusLookup initialReferenceId={lookupRefId} />
          </section>
        )}

        {activeSection === 'admin' && (
          <section>
            <AdminConsole currentUser={currentUser} authReady={authReady} />
          </section>
        )}
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="border-t border-stone-200 bg-white mt-16 no-print">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            Crestwood Preparatory Academy · Office of Secondary Admissions (Grades 9–12)
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveSection('apply')}
              className="hover:text-stone-900 transition-colors cursor-pointer"
            >
              Admission Form
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('status')}
              className="hover:text-stone-900 transition-colors cursor-pointer"
            >
              Status Lookup
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('admin')}
              className="hover:text-stone-900 transition-colors cursor-pointer"
            >
              Admin Gmail Console
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
