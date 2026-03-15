import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useProfile, NormalizedJob, TrackerCard } from '../../context/ProfileContext';
import { api } from '../../config/api';
import { CP_PROFILES } from '../../data/cpProfiles';

// ── Shared Sub-components ───────────────────────────────────────────────────

const FitScoreRing = ({ score }: { score: number }) => {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#f43f5e';
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  return (
    <div style={{ position: 'relative', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
        <circle cx="22" cy="22" r={radius} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      </svg>
      <span style={{ position: 'absolute', fontSize: 11, fontWeight: 900, color }}>{score}</span>
    </div>
  );
};

const JobCard = ({ job, profileAccent, onSave, isNew }: { job: NormalizedJob, profileAccent: string, onSave: (j: NormalizedJob) => void, isNew: boolean }) => {
  return (
    <div className="glass" style={{ ...s.jobCard, border: isNew ? `1px solid ${profileAccent}` : '1px solid var(--border-subtle)' }}>
      {isNew && <div style={{ ...s.newBadge, background: profileAccent }}>NEW</div>}
      <div style={s.jobHeader}>
        <div style={s.jobTitleRow}>
          <h4 style={s.jobTitle}>{job.title}</h4>
          <FitScoreRing score={job.fitScore} />
        </div>
        <div style={s.jobSub}>{job.company} • {job.location}</div>
      </div>
      
      <div style={s.badgeRow}>
        <span style={{ ...s.modeBadge, color: job.workMode === 'Remote' ? '#22D3EE' : job.workMode === 'Hybrid' ? '#f59e0b' : '#10b981', background: job.workMode === 'Remote' ? 'rgba(34,211,238,0.1)' : job.workMode === 'Hybrid' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)' }}>{job.workMode}</span>
        {job.category && <span style={s.catBadge}>{job.category === 'INDUSTRY' ? '🏭 Industry' : '🎓 Academia'}</span>}
        {job.eyConnection && <span style={s.eyBadge}>⭐ EY Alumni Advantage</span>}
      </div>

      <div style={s.fitReason}>"{job.fitReason}"</div>

      <div style={s.skillRow}>
        {job.keySkills.map(sk => <span key={sk} style={s.skillChip}>{sk}</span>)}
      </div>

      <div style={s.jobFooter}>
        <div style={s.salaryText}>{job.salary || 'Salary hidden'}</div>
        <div style={s.jobActions}>
          <button onClick={() => window.open(job.applyUrl, '_blank')} style={s.applyBtn} disabled={!job.applyUrl}>Apply</button>
          <button onClick={() => onSave(job)} style={{ ...s.saveBtn, color: profileAccent, borderColor: profileAccent }}>Save</button>
        </div>
      </div>
    </div>
  );
};

// ── Main Tab Component ──────────────────────────────────────────────────────

export function JobHub() {
  const { profile, state, setState } = useProfile();
  const [subContext, setSubContext] = useState<'dj' | 'pooja'>(profile);
  const [activePanel, setActivePanel] = useState<'hub' | 'tracker' | 'assist'>('hub');
  
  const [keywords, setKeywords] = useState<string>(CP_PROFILES[subContext].searchKeywordsDefault);
  const [isRemote, setIsRemote] = useState(subContext === 'dj');
  const [country, setCountry] = useState('usa');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeLeft, setTimeLeft] = useState(45 * 60);

  // Tracker State
  const [loadingTracker, setLoadingTracker] = useState(false);

  // AI Assist State
  const [assistJob, setAssistJob] = useState<NormalizedJob | null>(null);
  const [assistMode, setAssistMode] = useState<'coverletter' | 'interview' | 'skillgap'>('coverletter');
  const [assistResult, setAssistResult] = useState<string | null>(null);
  const [loadingAssist, setLoadingAssist] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/jobs?candidate=${subContext}&page=${state.page}&pageSize=8&remote=${isRemote}${subContext === 'pooja' ? `&country=${country}` : ''}`);
      const newJobs: NormalizedJob[] = data.jobs;
      const currentIds = new Set(newJobs.map(j => j.id));
      
      setState({ 
        jobs: newJobs,
        lastJobIds: state.lastJobIds.size === 0 ? currentIds : state.lastJobIds 
      });
      setTimeLeft(45 * 60);
    } catch (err) {
      setError('Failed to fetch jobs. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [subContext, state.page, isRemote, country, state.lastJobIds, setState]);

  useEffect(() => {
    if (activePanel === 'hub' && state.jobs.length === 0) fetchJobs();
  }, [fetchJobs, activePanel]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          fetchJobs();
          return 45 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchJobs]);

  const loadTracker = useCallback(async () => {
    setLoadingTracker(true);
    try {
      const data = await api.get(`/tracker/${subContext}`);
      setState({ trackerCards: data.cards });
    } catch (err) {
      console.error('Tracker load failed', err);
    } finally {
      setLoadingTracker(false);
    }
  }, [subContext, setState]);

  useEffect(() => {
    if (activePanel === 'tracker') loadTracker();
  }, [activePanel, loadTracker]);

  const saveToTracker = async (job: NormalizedJob) => {
    try {
      const card = {
        column: CP_PROFILES[subContext].columns[0],
        title: job.title,
        company: job.company,
        applyUrl: job.applyUrl,
        snippet: job.snippet,
        salary: job.salary
      };
      await api.post(`/tracker/${subContext}`, card);
      loadTracker();
      alert('Job saved to tracker!');
    } catch (err) {
      alert('Failed to save job.');
    }
  };

  const advanceCard = async (cardId: string, currentColumn: string) => {
    const columns = (CP_PROFILES as any)[subContext].columns;
    const currentIndex = columns.indexOf(currentColumn);
    if (currentIndex >= columns.length - 1) return;
    
    const nextColumn = columns[currentIndex + 1];
    try {
      await api.patch(`/tracker/${subContext}/${cardId}`, { column: nextColumn });
      loadTracker();
    } catch (err) {
      alert('Failed to advance card.');
    }
  };

  const removeCard = async (cardId: string) => {
    if (!confirm('Remove this application?')) return;
    try {
      await api.delete(`/tracker/${subContext}/${cardId}`);
      loadTracker();
    } catch (err) {
      alert('Failed to remove card.');
    }
  };

  const runAssist = async () => {
    if (!assistJob) return;
    setLoadingAssist(true);
    setAssistResult(null);
    try {
      const res = await api.post('/ai/assist', {
        profile: subContext,
        mode: assistMode,
        job: {
          title: assistJob.title,
          company: assistJob.company,
          snippet: assistJob.snippet,
          keySkills: assistJob.keySkills
        }
      });
      setAssistResult(res.result);
    } catch (err) {
      setAssistResult('Failed to generate assistant output.');
    } finally {
      setLoadingAssist(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div style={s.container}>
      <div style={s.topBar}>
        <div style={s.profileToggle}>
          <button onClick={() => setSubContext('dj')} style={{ ...s.subPsw, background: subContext === 'dj' ? '#22D3EE' : 'transparent', color: subContext === 'dj' ? '#000' : 'white' }}>⚡ DJ Context</button>
          <button onClick={() => setSubContext('pooja')} style={{ ...s.subPsw, background: subContext === 'pooja' ? '#F472B6' : 'transparent', color: subContext === 'pooja' ? '#000' : 'white' }}>🔬 Pooja Context</button>
        </div>
        <div style={s.panelTabs}>
          <button onClick={() => setActivePanel('hub')} style={{ ...s.panelTab, color: activePanel === 'hub' ? 'var(--accent-active)' : 'var(--text-muted)' }}>Job Hub</button>
          <button onClick={() => setActivePanel('tracker')} style={{ ...s.panelTab, color: activePanel === 'tracker' ? 'var(--accent-active)' : 'var(--text-muted)' }}>Tracker</button>
          <button onClick={() => setActivePanel('assist')} style={{ ...s.panelTab, color: activePanel === 'assist' ? 'var(--accent-active)' : 'var(--text-muted)' }}>AI Assist</button>
        </div>
      </div>

      {activePanel === 'hub' && (
        <div style={s.hubContent}>
          <div className="glass" style={s.searchBar}>
            <input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="Search keywords..." style={s.searchInput} />
            {subContext === 'pooja' && (
              <select value={country} onChange={e => setCountry(e.target.value)} style={s.countrySelect}>
                <option value="usa">🇺🇸 USA</option>
                <option value="uk">🇬🇧 UK</option>
                <option value="canada">🇨🇦 Canada</option>
                <option value="germany">🇩🇪 Germany</option>
                <option value="australia">🇦🇺 Australia</option>
              </select>
            )}
            <div style={s.remoteToggle}>
              <label style={s.toggleLabel}>Remote Only</label>
              <input type="checkbox" checked={isRemote} onChange={e => setIsRemote(e.target.checked)} />
            </div>
            <button onClick={fetchJobs} style={{ ...s.searchBtn, background: subContext === 'dj' ? '#22D3EE' : '#F472B6' }} disabled={loading}>{loading ? '...' : 'Search Jobs'}</button>
          </div>

          <div style={s.refreshBar}>
            <div style={s.refreshMeta}>
              <span style={s.timerText}>Next refresh in {formatTime(timeLeft)}</span>
              <button onClick={() => setAutoRefresh(!autoRefresh)} style={s.autoBtn}>{autoRefresh ? 'Pause Auto' : 'Resume Auto'}</button>
            </div>
            <button onClick={fetchJobs} style={s.manualBtn}>↺ Refresh Now</button>
          </div>

          {error && <div style={s.error}>{error}</div>}

          <div style={s.jobGrid}>
            {state.jobs.map(job => (
              <JobCard 
                key={job.id} 
                job={job} 
                profileAccent={subContext === 'dj' ? '#22D3EE' : '#F472B6'} 
                onSave={saveToTracker}
                isNew={!state.lastJobIds.has(job.id)}
              />
            ))}
          </div>

          <div style={s.pagination}>
            <button onClick={() => setState({ page: Math.max(0, state.page - 1) })} disabled={state.page === 0}>← Prev</button>
            <span>Page {state.page + 1}</span>
            <button onClick={() => setState({ page: state.page + 1 })}>Next →</button>
          </div>
        </div>
      )}

      {activePanel === 'tracker' && (
        <div style={s.trackerContent}>
          {loadingTracker ? <div className="spinner" /> : (
            <div style={s.kanban}>
              {CP_PROFILES[subContext].columns.map(col => (
                <div key={col} style={s.column}>
                  <div style={s.colHeader}>
                    {col} <span style={s.colCount}>{(state.trackerCards[col] || []).length}</span>
                  </div>
                  <div style={s.colCards}>
                    {(state.trackerCards[col] || []).map((card: any) => (
                      <div key={card.id} className="glass" style={s.kanbanCard}>
                        <div style={s.kCardTitle}>{card.title}</div>
                        <div style={s.kCardSub}>{card.company}</div>
                        <div style={s.kCardDate}>{new Date(card.createdAt || Date.now()).toLocaleDateString()}</div>
                        <div style={s.kCardActions}>
                          <button onClick={() => advanceCard(card.id, col)} style={s.kBtn}>→ Advance</button>
                          <button onClick={() => removeCard(card.id)} style={{ ...s.kBtn, color: '#f43f5e' }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activePanel === 'assist' && (
        <div style={s.assistContent}>
          <div className="glass" style={s.assistForm}>
            <select onChange={e => setAssistJob(state.jobs.find(j => j.id === e.target.value) || null)} style={s.assistSelect}>
              <option value="">Select a job from results...</option>
              {state.jobs.map(j => <option key={j.id} value={j.id}>{j.title} — {j.company}</option>)}
            </select>
            <div style={s.assistModes}>
              <button onClick={() => setAssistMode('coverletter')} style={{ ...s.assistModeBtn, borderColor: assistMode === 'coverletter' ? 'var(--accent-active)' : 'transparent' }}>✉️ Cover Letter</button>
              <button onClick={() => setAssistMode('interview')} style={{ ...s.assistModeBtn, borderColor: assistMode === 'interview' ? 'var(--accent-active)' : 'transparent' }}>🎤 Interview Prep</button>
              <button onClick={() => setAssistMode('skillgap')} style={{ ...s.assistModeBtn, borderColor: assistMode === 'skillgap' ? 'var(--accent-active)' : 'transparent' }}>📊 Skill Gap</button>
            </div>
            <button onClick={runAssist} style={s.assistRun} disabled={loadingAssist || !assistJob}>
              {loadingAssist ? <div className="spinner" /> : 'GENERATE ASSISTANCE'}
            </button>
          </div>
          <div className="glass" style={s.assistResult}>
            {assistResult ? (
              <div style={s.assistOutputWrap}>
                <button onClick={() => navigator.clipboard.writeText(assistResult)} style={s.assistCopy}>COPY</button>
                <div style={s.assistOutput}>{assistResult}</div>
              </div>
            ) : <div style={s.assistEmpty}>Select a job and mode to generate AI-powered application assistance</div>}
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { animation: 'fadeInUp 0.5s ease-out' },
  topBar: { display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' },
  profileToggle: { display: 'flex', gap: 8, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 10 },
  subPsw: { border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s' },
  panelTabs: { display: 'flex', gap: 20 },
  panelTab: { background: 'transparent', border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer' },
  hubContent: { display: 'flex', flexDirection: 'column', gap: 20 },
  searchBar: { padding: 16, display: 'flex', gap: 12, alignItems: 'center' },
  searchInput: { flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 16px', color: 'white' },
  countrySelect: { background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: 'white' },
  remoteToggle: { display: 'flex', alignItems: 'center', gap: 8 },
  toggleLabel: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' },
  searchBtn: { padding: '0 24px', height: 42, border: 'none', borderRadius: 8, color: '#000', fontWeight: 900, cursor: 'pointer' },
  refreshBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  refreshMeta: { display: 'flex', gap: 12, alignItems: 'center' },
  timerText: { fontSize: 12, fontWeight: 700, color: 'var(--accent-active)' },
  autoBtn: { background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: 10, padding: '4px 8px', borderRadius: 4, cursor: 'pointer' },
  manualBtn: { background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  jobGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 },
  jobCard: { padding: 20, position: 'relative', display: 'flex', flexDirection: 'column', gap: 12 },
  newBadge: { position: 'absolute', top: -10, left: 20, fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 4, color: '#000' },
  jobHeader: { display: 'flex', flexDirection: 'column', gap: 4 },
  jobTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  jobTitle: { margin: 0, fontSize: 15, fontWeight: 800 },
  jobSub: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 },
  badgeRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  modeBadge: { fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 4 },
  catBadge: { fontSize: 9, fontWeight: 900, padding: '2px 8px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', borderRadius: 4 },
  eyBadge: { fontSize: 9, fontWeight: 900, padding: '2px 8px', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', borderRadius: 4, border: '1px solid rgba(245,158,11,0.3)' },
  fitReason: { fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.4' },
  skillRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  skillChip: { fontSize: 9, fontWeight: 700, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 12, color: 'var(--text-muted)' },
  jobFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' },
  salaryText: { fontSize: 12, fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' },
  jobActions: { display: 'flex', gap: 8 },
  applyBtn: { background: 'white', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 800, color: '#000', cursor: 'pointer' },
  saveBtn: { background: 'transparent', border: '1px solid', borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 800, cursor: 'pointer' },
  pagination: { display: 'flex', justifyContent: 'center', gap: 20, alignItems: 'center', marginTop: 32 },
  kanban: { display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 20 },
  column: { minWidth: 280, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 },
  colHeader: { fontSize: 12, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' },
  colCount: { background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 10, fontSize: 10 },
  colCards: { display: 'flex', flexDirection: 'column', gap: 10, minHeight: 400, border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 12, padding: 8 },
  kanbanCard: { padding: 12, display: 'flex', flexDirection: 'column', gap: 6 },
  kCardTitle: { fontSize: 13, fontWeight: 800 },
  kCardSub: { fontSize: 11, color: 'var(--text-muted)' },
  kCardDate: { fontSize: 10, color: 'var(--text-muted)' },
  kCardActions: { display: 'flex', justifyContent: 'space-between', marginTop: 8 },
  kBtn: { background: 'transparent', border: 'none', fontSize: 10, fontWeight: 800, color: 'var(--text-secondary)', cursor: 'pointer' },
  assistContent: { display: 'flex', flexDirection: 'column', gap: 20 },
  assistForm: { padding: 20, display: 'flex', flexDirection: 'column', gap: 16 },
  assistSelect: { background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px', color: 'white' },
  assistModes: { display: 'flex', gap: 12 },
  assistModeBtn: { flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid transparent', borderRadius: 8, padding: '12px', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  assistRun: { height: 44, background: 'var(--accent-active)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 900, cursor: 'pointer' },
  assistResult: { padding: 24, minHeight: 400 },
  assistOutputWrap: { position: 'relative' },
  assistCopy: { position: 'absolute', top: 0, right: 0, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: 9, padding: '4px 8px', borderRadius: 4, cursor: 'pointer' },
  assistOutput: { fontSize: 13, lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#e8e9f3' },
  assistEmpty: { color: 'var(--text-muted)', textAlign: 'center', marginTop: 150, fontSize: 13 },
  error: { padding: 12, background: 'rgba(244,63,94,0.1)', color: '#f43f5e', borderRadius: 8, fontSize: 12, fontWeight: 600, textAlign: 'center' }
};
