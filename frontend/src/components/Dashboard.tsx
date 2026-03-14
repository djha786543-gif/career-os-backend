/**
 * Dashboard.tsx — At-a-Glance Summary Panel
 * Rendered at the top of JobHub. Profile-aware: DJ sees geographic sniper
 * stats; Pooja sees academic/industry market sentiment and global hits.
 */

import React from 'react';
import { FrontendJob } from '../utils/api';

// Re-used from JobHub — must stay in sync with the same keyword list
const ACADEMIC_KEYWORDS = [
  'postdoc', 'postdoctoral', 'faculty', 'professor', 'research fellow',
  'core facility', 'principal investigator', ' pi ', 'visiting scientist',
  'research associate', 'scientist i ', 'scientist ii ',
];
function isAcademicJob(job: FrontendJob): boolean {
  const text = (job.title + ' ' + job.snippet).toLowerCase();
  return ACADEMIC_KEYWORDS.some(k => text.includes(k));
}

// ─────────────────────────────────────────────────────────────────────────────

interface DashboardProps {
  activeId:    'dj' | 'pj';
  jobs:        FrontendJob[];
  nextRefresh: number; // ms remaining
  theme:       { glow: string; dim: string; border: string };
}

interface StatCardProps {
  label:    string;
  value:    string | number;
  sub?:     string;
  color:    string;
  icon:     string;
}

function StatCard({ label, value, sub, color, icon }: StatCardProps) {
  return (
    <div style={{
      flex: 1,
      minWidth: 160,
      padding: '14px 18px',
      borderRadius: 12,
      background: color + '0d',
      border: `1px solid ${color}30`,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ fontSize: 18 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color, opacity: .85, letterSpacing: '.04em' }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DJ view — Geographic Sniper stats
// ─────────────────────────────────────────────────────────────────────────────

function DJDashboard({ jobs, nextRefresh, theme }: Omit<DashboardProps, 'activeId'>) {
  const remoteLeads     = jobs.filter(j => j.isRemote && j.fitScore >= 90).length;
  const torranceLeads   = jobs.filter(j => j.location?.toLowerCase().includes('torrance')).length;
  const topScore        = jobs.length > 0 ? Math.max(...jobs.map(j => j.fitScore)) : 0;
  const mins = Math.floor(nextRefresh / 60000);
  const secs = Math.floor((nextRefresh % 60000) / 1000);

  return (
    <div style={s.panel}>
      <div style={{ ...s.panelLabel, color: theme.glow }}>DJ · SNIPER DASHBOARD</div>
      <div style={s.cards}>
        <StatCard
          icon="🎯"
          value={remoteLeads}
          label="REMOTE LEADS 90+"
          sub="Remote roles scoring ≥ 90 pts"
          color="#22d3ee"
        />
        <StatCard
          icon="📍"
          value={torranceLeads}
          label="TORRANCE HITS"
          sub="Within 15mi of home base"
          color="#10b981"
        />
        <StatCard
          icon="⚡"
          value={`${topScore}%`}
          label="TOP MATCH SCORE"
          sub="Best-fit role this cycle"
          color="#f59e0b"
        />
        <StatCard
          icon="⏱"
          value={`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`}
          label="NEXT AUTO-REFRESH"
          sub="Indeed + Adzuna sync"
          color="#6366f1"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pooja view — Market Sentiment + Global Hits
// ─────────────────────────────────────────────────────────────────────────────

const REGION_LABELS: Record<string, string> = { US: '🇺🇸', Europe: '🇪🇺', India: '🇮🇳' };

function PoojaDashboard({ jobs, theme }: Omit<DashboardProps, 'activeId' | 'nextRefresh'> & { nextRefresh: number }) {
  const academic  = jobs.filter(isAcademicJob);
  const industry  = jobs.filter(j => !isAcademicJob(j));
  const total     = jobs.length || 1;
  const acadPct   = Math.round((academic.length / total) * 100);
  const indPct    = 100 - acadPct;
  const topHits   = [...jobs].sort((a, b) => b.fitScore - a.fitScore).slice(0, 3);

  return (
    <div style={s.panel}>
      <div style={{ ...s.panelLabel, color: theme.glow }}>POOJA · RESEARCH INTELLIGENCE</div>
      <div style={s.cards}>
        {/* Market sentiment bar */}
        <div style={{ flex: 2, minWidth: 260, padding: '14px 18px', borderRadius: 12, background: '#f472b60d', border: '1px solid #f472b630' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#f472b6', letterSpacing: '.06em', marginBottom: 10 }}>
            MARKET SENTIMENT
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#a855f7', fontWeight: 700, width: 80 }}>🎓 Academic</span>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
              <div style={{ width: `${acadPct}%`, height: '100%', background: '#a855f7', borderRadius: 4, transition: 'width .5s' }} />
            </div>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#a855f7', width: 34, textAlign: 'right' }}>{acadPct}%</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#06b6d4', fontWeight: 700, width: 80 }}>🏭 Industry</span>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
              <div style={{ width: `${indPct}%`, height: '100%', background: '#06b6d4', borderRadius: 4, transition: 'width .5s' }} />
            </div>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#06b6d4', width: 34, textAlign: 'right' }}>{indPct}%</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
            {academic.length} academic · {industry.length} industry · {jobs.length} total
          </div>
        </div>

        {/* Latest global hits */}
        <div style={{ flex: 3, minWidth: 300, padding: '14px 18px', borderRadius: 12, background: '#f472b60d', border: '1px solid #f472b630' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#f472b6', letterSpacing: '.06em', marginBottom: 10 }}>
            LATEST GLOBAL HITS
          </div>
          {topHits.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No results yet — click Refresh Now</div>
          )}
          {topHits.map((job, i) => (
            <div key={job.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < topHits.length - 1 ? 8 : 0 }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#f472b6', background: '#f472b620', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
                {job.fitScore}%
              </span>
              <span style={{ fontSize: 10 }}>{REGION_LABELS[job.region] ?? '🌍'}</span>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {job.title}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{job.company}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export function Dashboard(props: DashboardProps) {
  if (props.activeId === 'dj') return <DJDashboard {...props} />;
  return <PoojaDashboard {...props} />;
}

const s: Record<string, React.CSSProperties> = {
  panel:      { marginBottom: 24 },
  panelLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 10 },
  cards:      { display: 'flex', gap: 10, flexWrap: 'wrap' },
};
