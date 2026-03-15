import React, { useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { PROFILES } from '../../data/profiles';
import { api } from '../../config/api';

export function LearningTracks() {
  const { profile } = useProfile();
  const data = PROFILES[profile];
  const [subtab, setSubtab] = useState<'static' | 'ai'>('static');
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const handleGenerate = async () => {
    if (!query) return;
    setLoading(true);
    setAiResult(null);
    try {
      const res = await api.post('/ai/track', { profile, query });
      setAiResult(res.result);
      setCached(res.cached);
    } catch (err) {
      setAiResult('Failed to generate track. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h2 style={s.title}>LEARNING TRACKS / <span style={{ color: 'var(--accent-active)' }}>CURRICULUM BUILDER</span></h2>
        <div style={s.tabs}>
          <button onClick={() => setSubtab('static')} style={{ ...s.tabBtn, borderBottom: subtab === 'static' ? '2px solid var(--accent-active)' : '2px solid transparent', color: subtab === 'static' ? 'white' : 'var(--text-muted)' }}>Structured Tracks</button>
          <button onClick={() => setSubtab('ai')} style={{ ...s.tabBtn, borderBottom: subtab === 'ai' ? '2px solid var(--accent-active)' : '2px solid transparent', color: subtab === 'ai' ? 'white' : 'var(--text-muted)' }}>AI Custom Track</button>
        </div>
      </div>

      {subtab === 'static' ? (
        <div style={s.trackList}>
          {data.tracks.map((track) => (
            <div key={track.title} className="glass" style={s.trackCard}>
              <div style={s.trackHeader} onClick={() => setExpandedTrack(expandedTrack === track.title ? null : track.title)}>
                <div style={{ ...s.iconCircle, background: track.color }}>{track.icon}</div>
                <div style={s.trackMeta}>
                  <div style={s.trackTitle}>{track.title}</div>
                  <div style={s.trackDesc}>{track.desc}</div>
                </div>
                <div style={{ ...s.arrow, transform: expandedTrack === track.title ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</div>
              </div>
              {expandedTrack === track.title && (
                <div style={s.trackBody}>
                  {track.weeks.map((week) => (
                    <div key={week.lbl} style={s.weekRow}>
                      <div style={s.weekLabel}>{week.lbl}</div>
                      <div style={s.weekTasks}>
                        {week.tasks.map((task, i) => (
                          <div key={i} style={s.taskItem}>
                            <div style={s.dot} />
                            {task}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={s.aiWrap}>
          <div className="glass" style={s.aiControls}>
            <input 
              value={query} 
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. 4-week AAIA exam sprint focusing on AI Ethics" 
              style={s.input}
            />
            <button onClick={handleGenerate} style={s.genBtn} disabled={loading}>
              {loading ? <div className="spinner" /> : 'GENERATE TRACK'}
            </button>
          </div>
          <div className="glass" style={s.aiResults}>
            {loading ? (
              <div style={s.aiLoading}>
                <div className="spinner" style={{ width: 40, height: 40 }} />
                <div style={s.loadingText}>Architecting custom learning curriculum...</div>
              </div>
            ) : aiResult ? (
              <div style={s.resultContainer}>
                <div style={s.resultHeader}>
                  {cached && <span style={s.cacheBadge}>⚡ Cached</span>}
                  <button onClick={() => navigator.clipboard.writeText(aiResult)} style={s.copyBtn}>COPY</button>
                </div>
                <div style={s.resultContent}>{aiResult}</div>
              </div>
            ) : (
              <div style={s.aiEmpty}>Describe your learning goal to generate a custom step-by-step track</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { animation: 'fadeInUp 0.5s ease-out' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  title: { margin: 0, fontSize: 14, fontWeight: 900, letterSpacing: '0.1em' },
  tabs: { display: 'flex', gap: 24 },
  tabBtn: { background: 'transparent', border: 'none', padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' },
  trackList: { display: 'flex', flexDirection: 'column', gap: 16 },
  trackCard: { overflow: 'hidden' },
  trackHeader: { padding: 20, display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer' },
  iconCircle: { width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 },
  trackMeta: { flex: 1 },
  trackTitle: { fontSize: 15, fontWeight: 800, color: 'white' },
  trackDesc: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  arrow: { fontSize: 10, color: 'var(--text-muted)', transition: 'transform 0.3s' },
  trackBody: { padding: '0 20px 24px 88px', display: 'flex', flexDirection: 'column', gap: 20, borderTop: '1px solid var(--border-subtle)', paddingTop: 24 },
  weekRow: { display: 'flex', gap: 24 },
  weekLabel: { width: 80, fontSize: 10, fontWeight: 900, color: 'var(--accent-active)', textTransform: 'uppercase', flexShrink: 0, paddingTop: 2 },
  weekTasks: { display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
  taskItem: { display: 'flex', gap: 10, fontSize: 12, lineHeight: '1.5', color: 'var(--text-secondary)' },
  dot: { width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-active)', marginTop: 7, flexShrink: 0 },
  aiWrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  aiControls: { padding: 20, display: 'flex', gap: 12 },
  input: { flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: 'white', fontSize: 13 },
  genBtn: { padding: '0 24px', background: 'var(--accent-active)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 800, fontSize: 11, cursor: 'pointer' },
  aiResults: { padding: 24, minHeight: 400 },
  aiLoading: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 120 },
  loadingText: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 },
  aiEmpty: { color: 'var(--text-muted)', textAlign: 'center', marginTop: 150, fontSize: 13 },
  resultContainer: { display: 'flex', flexDirection: 'column', gap: 16 },
  resultHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cacheBadge: { fontSize: 10, fontWeight: 800, color: 'var(--accent-active)', padding: '2px 8px', background: 'rgba(34, 211, 238, 0.1)', borderRadius: 12 },
  copyBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: 9, fontWeight: 800, padding: '4px 8px', borderRadius: 4, cursor: 'pointer' },
  resultContent: { fontSize: 13, lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#e8e9f3' }
};
