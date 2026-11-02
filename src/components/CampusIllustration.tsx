import React from 'react';

export const CampusIllustration: React.FC = () => {
  return (
    <div className="relative w-full h-full min-h-[320px] bg-slate-900 overflow-hidden flex flex-col justify-between p-6 sm:p-8 text-stone-100 border border-stone-800">
      {/* Architectural SVG Backdrop */}
      <svg
        viewBox="0 0 800 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="65%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="goldGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#B45309" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <rect width="800" height="500" fill="url(#skyGrad)" />
        <circle cx="650" cy="110" r="95" fill="url(#goldGlow)" />

        {/* Subtle Architectural Grid Lines */}
        <line x1="0" y1="390" x2="800" y2="390" stroke="#94A3B8" strokeOpacity="0.3" strokeWidth="1" />
        <line x1="0" y1="430" x2="800" y2="430" stroke="#94A3B8" strokeOpacity="0.18" strokeWidth="1" />

        {/* Left Classical Limestone Wing */}
        <rect x="60" y="220" width="210" height="170" fill="#1E293B" stroke="#94A3B8" strokeWidth="1.5" />
        <polygon points="50,220 165,160 280,220" fill="#0F172A" stroke="#CBD5E1" strokeWidth="1.5" />
        {/* Columns */}
        <line x1="95" y1="220" x2="95" y2="390" stroke="#94A3B8" strokeWidth="2" />
        <line x1="130" y1="220" x2="130" y2="390" stroke="#94A3B8" strokeWidth="2" />
        <line x1="165" y1="220" x2="165" y2="390" stroke="#94A3B8" strokeWidth="2" />
        <line x1="200" y1="220" x2="200" y2="390" stroke="#94A3B8" strokeWidth="2" />
        <line x1="235" y1="220" x2="235" y2="390" stroke="#94A3B8" strokeWidth="2" />

        {/* Central Founders Clock Tower */}
        <rect x="330" y="110" width="140" height="280" fill="#0F172A" stroke="#E2E8F0" strokeWidth="1.75" />
        <polygon points="320,110 400,38 480,110" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.5" />
        <line x1="400" y1="15" x2="400" y2="38" stroke="#F59E0B" strokeWidth="2" />
        {/* Clock Face */}
        <circle cx="400" cy="155" r="24" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.75" />
        <line x1="400" y1="155" x2="400" y2="140" stroke="#FCD34D" strokeWidth="1.75" />
        <line x1="400" y1="155" x2="413" y2="155" stroke="#FCD34D" strokeWidth="1.75" />
        {/* Archway Entrance */}
        <path d="M370 390 V315 A30 30 0 0 1 430 315 V390 Z" fill="#F59E0B" fillOpacity="0.22" stroke="#F59E0B" strokeWidth="1.5" />
        {/* Tower Windows */}
        <rect x="355" y="205" width="22" height="42" stroke="#CBD5E1" strokeWidth="1.2" fill="#F59E0B" fillOpacity="0.12" />
        <rect x="423" y="205" width="22" height="42" stroke="#CBD5E1" strokeWidth="1.2" fill="#F59E0B" fillOpacity="0.12" />
        <rect x="355" y="260" width="22" height="35" stroke="#CBD5E1" strokeWidth="1.2" />
        <rect x="423" y="260" width="22" height="35" stroke="#CBD5E1" strokeWidth="1.2" />

        {/* Right Modern Glass Science Pavilion */}
        <rect x="510" y="240" width="230" height="150" fill="#0F172A" fillOpacity="0.8" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="510" y1="290" x2="740" y2="290" stroke="#64748B" strokeWidth="1" />
        <line x1="510" y1="340" x2="740" y2="340" stroke="#64748B" strokeWidth="1" />
        <line x1="565" y1="240" x2="565" y2="390" stroke="#64748B" strokeWidth="1" />
        <line x1="625" y1="240" x2="625" y2="390" stroke="#64748B" strokeWidth="1" />
        <line x1="685" y1="240" x2="685" y2="390" stroke="#64748B" strokeWidth="1" />
      </svg>

      {/* Top Institutional Crest & Provenance */}
      <div className="relative z-10 flex items-start justify-between gap-4 border-b border-stone-700/80 pb-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-400 font-medium">
            Chartered 1894 · New England Association of Schools
          </p>
          <h3 className="text-xl sm:text-2xl font-serif-display text-white mt-1">
            Founders Quadrangle &amp; Honors Collegium
          </h3>
        </div>
        <div className="w-11 h-11 border border-amber-500/60 bg-slate-950/80 flex items-center justify-center shrink-0">
          <span className="font-serif-display text-amber-400 text-sm font-semibold tracking-wider">
            CPA
          </span>
        </div>
      </div>

      {/* Middle Editorial Quote */}
      <div className="relative z-10 my-auto py-6">
        <blockquote className="font-serif-display italic text-lg sm:text-xl text-stone-100 leading-relaxed max-w-lg">
          &ldquo;Disciplined inquiry, seminar discourse at the Harkness table, and independent laboratory research for Grades 9 through 12.&rdquo;
        </blockquote>
        <p className="text-xs text-stone-400 mt-3">
          Fig. 1 — Architectural elevation of Founders Hall and the Integrated Science Pavilion
        </p>
      </div>

      {/* Bottom Key Institutional Metrics */}
      <div className="relative z-10 grid grid-cols-3 gap-4 pt-5 border-t border-stone-700/80">
        <div>
          <p className="text-xs text-stone-400">Student-to-Faculty</p>
          <p className="text-lg sm:text-xl font-mono-tabular font-semibold text-white mt-0.5">
            7 : 1
          </p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Average Seminar</p>
          <p className="text-lg sm:text-xl font-mono-tabular font-semibold text-white mt-0.5">
            12 Students
          </p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Need-Based Aid</p>
          <p className="text-lg sm:text-xl font-mono-tabular font-semibold text-amber-400 mt-0.5">
            100% Met
          </p>
        </div>
      </div>
    </div>
  );
};
