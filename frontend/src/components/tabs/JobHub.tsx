import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { fetchJobs, saveToTracker, FrontendJob } from '../../utils/api';
import { Dashboard } from '../Dashboard';

const REFRESH_MS = 45 * 60 * 1000; // 45 minutes
const PAGE_SIZE  = 8;

const SCORE_COLOR = (s: number) =>
  s >= 80 ? '#10b981' : s >= 65 ? '#f59e0b' : s >= 50 ? '#6366f1' : '#5f6580';

const SOURCE_BADGE: Record<string, string> = {
  Indeed: '#06b6d4', Adzuna: '#6366f1', WebSearch: '#a855f7',
  LinkedIn: '#0077b5', Glassdoor: '#0caa41',
};

// ─── Academic heuristic (Pooja) ───────────────────────────────────────────────
const ACADEMIC_KEYWORDS = [
  'postdoc', 'postdoctoral', 'faculty', 'professor', 'research fellow',
  'core facility', 'principal investigator', ' pi ', 'visiting scientist',
  'research associate', 'scientist i ', 'scientist ii ',
];
function isAcademicJob(job: FrontendJob): boolean {
  const text = (job.title + ' ' + job.snippet).toLowerCase();
  return ACADEMIC_KEYWORDS.some(k => text.includes(k));
}

// ─── DJ Filters ───────────────────────────────────────────────────────────────
type DJFilter    = 'all' | 'remote' | 'torrance';

// ─── Pooja Filters ───────────────────────────────────────────────────────────
type PoojaTrack  = 'all' | 'academic' | 'industry';
type PoojaRegion = 'all' | 'US' | 'Europe' | 'India';

export function JobHub() {
  const { activeId, profile, theme } = useProfile();

  const [jobs,     setJobs]     = useState<FrontendJob[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(0);
  const [saved,    setSaved]    = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [nextRefresh, setNextRefresh] = useState(REFRESH_MS);

  // DJ quick filters
  const [djFilter, setDjFilter] = useState<DJFilter>('all');

  // Pooja quick filters
  const [poojaTrack,  setPoojaTrack]  = useState<PoojaTrack>('all');
  const [poojaRegion, setPoojaRegion] = useState<PoojaRegion>('all');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setPage(0);
    try {
      const res = await fetchJobs(activeId);
      setJobs(res.jobs);
    } catch (e) {
      console.error('[JobHub] fetch failed:', e);
    } finally {
      setLoading(false);
      setNextRefresh(REFRESH_MS);
    }
  }, [activeId]);

  // Reset filters on profile change
  useEffect(() => {
    setDjFilter('all');
    setPoojaTrack('all');
    setPoojaRegion('all');
  }, [activeId]);

  useEffect(() => { load(); }, [load]);

  // 45-min auto-refresh
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countRef.current) clearInterval(countRef.current);
    timerRef.current = setInterval(load, REFRESH_MS);
    countRef.current = setInterval(() => {
      setNextRefresh(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countRef.current) clearInterval(countRef.current);
    };
  }, [load]);

  const handleSave = async (job: FrontendJob) => {
    if (saved.has(job.id) || savingId) return;
    setSavingId(job.id);
    try {
      const dbProfileId = activeId === 'dj' ? 'dj' : 'pooja';
      await saveToTracker({
        profile_id:  dbProfileId as any,
        job_id:      job.id,
        title:       job.title,
        company:     job.company,
        apply_url:   job.applyUrl,
        match_score: job.fitScore,
        stage:       'wishlist',
      });
      setSaved(prev => new Set(prev).add(job.id));
    } catch (e) {
      console.error('[JobHub] save failed:', e);
    } finally {
      setSavingId(null);
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredJobs = jobs.filter(job => {
    if (activeId === 'dj') {
      if (djFilter === 'remote')   return job.isRemote;
      if (djFilter === 'torrance') return job.location?.toLowerCase().includes('torrance');
      return true; // 'all'
    } else {
      // Pooja — track filter (data safety: never applied to DJ)
      if (poojaTrack === 'academic' && !isAcademicJob(job)) return false;
      if (poojaTrack === 'industry' &&  isAcademicJob(job)) return false;
      // Pooja — region filter
      if (poojaRegion !== 'all' && job.region !== poojaRegion) return false;
      return true;
    }
  });

  const mins       = Math.floor(nextRefresh / 60000);
  const secs       = Math.floor((nextRefresh % 60000) / 1000);
  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE);
  const pageJobs   = filteredJobs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      {/* ── At-a-Glance Dashboard ── */}
      {!loading && jobs.length > 0 && (
        <Dashboard
          activeId={activeId}
          jobs={jobs}
          nextRefresh={nextRefresh}
          theme={theme}
        />
      )}

      {/* ── Header row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={s.secLabel}>JOB AGGREGATOR</div>
          <div style={s.secTitle}>Job Hub</div>
          <div style={s.secSub}>{filteredJobs.length} of {jobs.length} listings · {profile.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ ...s.pill, background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.2)' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 6 }}>REFRESH IN</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent-indigo)' }}>
              {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
            </span>
          </div>
          <button onClick={load} style={{ ...s.btn, background: theme.dim, color: theme.glow, border: `1px solid ${theme.border}` }}>
            ↻ Refresh Now
          </button>
        </div>
      </div>

      {/* ── Quick Filters ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {activeId === 'dj' ? (
          /* DJ: Geographic Sniper filters */
          <>
            <span style={s.filterLabel}>QUICK FILTER</span>
            {(['all', 'remote', 'torrance'] as DJFilter[]).map(f => {
              const labels = { all: 'All Results', remote: '🌐 Remote Only', torrance: '📍 Torrance (15mi)' };
              return (
                <button key={f} onClick={() => { setDjFilter(f); setPage(0); }}
                  style={{ ...s.filterChip, background: djFilter === f ? theme.dim : 'var(--bg-secondary)', color: djFilter === f ? theme.glow : 'var(--text-muted)', border: `1px solid ${djFilter === f ? theme.border : 'var(--border-subtle)'}` }}>
                  {labels[f]}
                </button>
              );
            })}
          </>
        ) : (
          /* Pooja: Academic/Industry + Country Selector */
          <>
            <span style={s.filterLabel}>TRACK</span>
            {(['all', 'academic', 'industry'] as PoojaTrack[]).map(t => {
              const labels = { all: 'All', academic: '🎓 Academic', industry: '🏭 Industry' };
              return (
                <button key={t} onClick={() => { setPoojaTrack(t); setPage(0); }}
                  style={{ ...s.filterChip, background: poojaTrack === t ? theme.dim : 'var(--bg-secondary)', color: poojaTrack === t ? theme.glow : 'var(--text-muted)', border: `1px solid ${poojaTrack === t ? theme.border : 'var(--border-subtle)'}` }}>
                  {labels[t]}
                </button>
              );
            })}
            <span style={{ ...s.filterLabel, marginLeft: 8 }}>REGION</span>
            {(['all', 'US', 'Europe', 'India'] as PoojaRegion[]).map(r => (
              <button key={r} onClick={() => { setPoojaRegion(r); setPage(0); }}
                style={{ ...s.filterChip, background: poojaRegion === r ? theme.dim : 'var(--bg-secondary)', color: poojaRegion === r ? theme.glow : 'var(--text-muted)', border: `1px solid ${poojaRegion === r ? theme.border : 'var(--border-subtle)'}` }}>
                {r === 'all' ? '🌍 All Regions' : r}
              </button>
            ))}
          </>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
          {activeId === 'dj' ? 'Aggregating jobs from Indeed + Adzuna…' : 'Searching academic & industry databases…'}
        </div>
      )}

      {/* ── Job grid ── */}
      {!loading && (
        <>
          <div style={s.grid}>
            {pageJobs.map(job => (
              <div key={job.id} className="glass" style={s.card}>
                {/* Score badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ ...s.scoreBadge, background: SCORE_COLOR(job.fitScore) + '22', color: SCORE_COLOR(job.fitScore), border: `1px solid ${SCORE_COLOR(job.fitScore)}44` }}>
                    {job.fitScore}% match
                  </span>
                  <span style={{ ...s.sourceBadge, background: (SOURCE_BADGE[job.source] || '#5f6580') + '22', color: SOURCE_BADGE[job.source] || '#5f6580' }}>
                    {job.source}
                  </span>
                </div>

                {/* Title + company */}
                <h3 style={s.jobTitle}>{job.title}</h3>
                <div style={s.company}>{job.company}</div>
                <div style={s.meta}>
                  <span>📍 {job.location}</span>
                  <span>💼 {job.workMode}</span>
                  {job.salary && job.salary !== 'Market Rate' && <span>💰 {job.salary}</span>}
                  {activeId === 'pj' && <span style={{ color: isAcademicJob(job) ? '#a855f7' : '#06b6d4', fontWeight: 600 }}>{isAcademicJob(job) ? '🎓 Academic' : '🏭 Industry'}</span>}
                </div>

                {/* Snippet */}
                <p style={s.snippet}>{job.snippet}</p>

                {/* Skills */}
                <div style={s.skillsRow}>
                  {job.keySkills.map(sk => (
                    <span key={sk} style={s.skillChip}>{sk}</span>
                  ))}
                </div>

                {/* Fit reason */}
                <div style={s.fitReason}>{job.fitReason}</div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <a href={job.applyUrl} target="_blank" rel="noopener noreferrer"
                    style={{ ...s.btnApply, background: theme.dim, color: theme.glow, border: `1px solid ${theme.border}` }}>
                    Quick Apply →
                  </a>
                  <button onClick={() => handleSave(job)} disabled={saved.has(job.id) || savingId === job.id}
                    style={{ ...s.btnSave, opacity: saved.has(job.id) ? 0.5 : 1, background: saved.has(job.id) ? 'rgba(16,185,129,.1)' : 'rgba(99,102,241,.1)', color: saved.has(job.id) ? '#10b981' : 'var(--text-secondary)', border: `1px solid ${saved.has(job.id) ? 'rgba(16,185,129,.3)' : 'var(--border-subtle)'}` }}>
                    {saved.has(job.id) ? '✓ Saved' : savingId === job.id ? '…' : '+ Tracker'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={s.pageBtn}>← Prev</button>
              <span style={s.pageInfo}>{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} style={s.pageBtn}>Next →</button>
            </div>
          )}

          {filteredJobs.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              {jobs.length === 0
                ? 'No jobs found. Click Refresh Now to fetch live results.'
                : 'No jobs match the current filters. Try a different combination.'}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  secLabel:    { fontSize: 10, fontWeight: 700, letterSpacing: '.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 },
  secTitle:    { fontSize: 22, fontWeight: 800, marginBottom: 4 },
  secSub:      { fontSize: 13, color: 'var(--text-secondary)' },
  pill:        { display: 'flex', alignItems: 'center', padding: '6px 12px', borderRadius: 8 },
  btn:         { padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' },
  filterLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-muted)', textTransform: 'uppercase', alignSelf: 'center' },
  filterChip:  { padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 },
  card:        { padding: 20, display: 'flex', flexDirection: 'column', transition: 'transform .2s', cursor: 'default' },
  scoreBadge:  { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, fontFamily: 'var(--font-mono)' },
  sourceBadge: { fontSize: 10, fontWeight: 700, padding: '3px 8px',  borderRadius: 5, letterSpacing: '.04em' },
  jobTitle:    { fontSize: 15, fontWeight: 700, marginBottom: 4, lineHeight: 1.3 },
  company:     { fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 },
  meta:        { display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 },
  snippet:     { fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12, flexGrow: 1 },
  skillsRow:   { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  skillChip:   { fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(99,102,241,.1)', color: 'var(--accent-indigo)', border: '1px solid rgba(99,102,241,.2)' },
  fitReason:   { fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginTop: 'auto' },
  btnApply:    { padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 6, flexGrow: 1, justifyContent: 'center' },
  btnSave:     { padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' },
  pageBtn:     { padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', cursor: 'pointer' },
  pageInfo:    { padding: '6px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' },
};
