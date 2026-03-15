import React, { useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { api } from '../../config/api';
import { PROFILES } from '../../data/profiles';

export function SkillEngine() {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [query, setQuery] = useState('');
  const [copying, setCopying] = useState(false);

  const data = PROFILES[profile];

  const handleMode = async (mode: string) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/ai/skill', { profile, mode });
      setResult(res.result);
      setCached(res.cached);
    } catch (err) {
      setResult('Failed to generate analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustom = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/ai/skill', { profile, query });
      setResult(res.result);
      setCached(res.cached);
    } catch (err) {
      setResult('Failed to generate analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  return (
    <div style={s.container}>
      <h2 style={s.title}>AI SKILL ENGINE / <span style={{ color: 'var(--accent-active)' }}>INTELLIGENCE LAYER</span></h2>
      
      <div style={s.grid}>
        <div style={s.main}>
          <div className="glass" style={s.controls}>
            <div style={s.modes}>
              <button onClick={() => handleMode('immediate')} style={s.modeBtn}>Immediate Wins</button>
              <button onClick={() => handleMode('strategic')} style={s.modeBtn}>Strategic Gaps</button>
              <button onClick={() => handleMode('emerging')} style={s.modeBtn}>Emerging Skills</button>
              <button onClick={() => handleMode('salary')} style={s.modeBtn}>Salary Impact</button>
            </div>
            
            <div style={s.inputRow}>
              <input 
                value={query} 
                onChange={e => setQuery(e.target.value)}
                placeholder="Ask anything about your skill trajectory..." 
                style={s.input}
              />
              <button onClick={handleCustom} style={s.askBtn} disabled={loading}>
                {loading ? <div className="spinner" /> : 'ASK AI'}
              </button>
            </div>
          </div>

          <div className="glass" style={s.results}>
            {!result && !loading && (
              <div style={s.empty}>Select a mode or ask a question to begin AI analysis</div>
            )}
            {loading && (
              <div style={s.loadingWrap}>
                <div className="spinner" style={{ width: 40, height: 40 }} />
                <div style={s.loadingText}>Analyzing market signals for {profile === 'dj' ? 'Deobrat' : 'Pooja'}...</div>
              </div>
            )}
            {result && (
              <div style={s.resultWrap}>
                <div style={s.resultHeader}>
                  {cached && <span style={s.cacheBadge}>⚡ Cached</span>}
                  <button onClick={copyToClipboard} style={s.copyBtn}>
                    {copying ? 'COPIED!' : 'COPY RESULT'}
                  </button>
                </div>
                <div style={s.resultContent}>{result}</div>
              </div>
            )}
          </div>
        </div>

        <div style={s.sidebar}>
          <div className="glass" style={s.sideCard}>
            <h3 style={s.sideTitle}>MARKET RECOMMENDATIONS</h3>
            <div style={s.sideSection}>
              <div style={s.sideSub}>Rising Skills</div>
              {data.rising.slice(0, 3).map(skill => (
                <div key={skill.skill} style={s.sideItem}>
                  <div style={s.sideName}>{skill.skill}</div>
                  <div style={s.sideMeta}>{skill.signal}</div>
                </div>
              ))}
            </div>
            <div style={s.sideSection}>
              <div style={s.sideSub}>Priority Gaps</div>
              {data.gaps.slice(0, 3).map(skill => (
                <div key={skill.skill} style={s.sideItem}>
                  <div style={s.sideName}>{skill.skill}</div>
                  <div style={{ ...s.sideMeta, color: '#f59e0b' }}>{skill.signal}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { animation: 'fadeInUp 0.5s ease-out' },
  title: { margin: '0 0 24px 0', fontSize: 14, fontWeight: 900, letterSpacing: '0.1em' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 },
  main: { display: 'flex', flexDirection: 'column', gap: 20 },
  controls: { padding: 20, display: 'flex', flexDirection: 'column', gap: 16 },
  modes: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 },
  modeBtn: { 
    padding: '10px', 
    background: 'rgba(255,255,255,0.03)', 
    border: '1px solid rgba(255,255,255,0.05)', 
    borderRadius: 8, 
    color: 'white', 
    fontSize: 11, 
    fontWeight: 700, 
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  inputRow: { display: 'flex', gap: 10 },
  input: { 
    flex: 1, 
    background: 'rgba(0,0,0,0.2)', 
    border: '1px solid rgba(255,255,255,0.1)', 
    borderRadius: 8, 
    padding: '0 16px', 
    color: 'white', 
    fontSize: 12 
  },
  askBtn: { 
    padding: '0 24px', 
    background: 'var(--accent-active)', 
    border: 'none', 
    borderRadius: 8, 
    color: '#000', 
    fontWeight: 800, 
    fontSize: 11, 
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100
  },
  results: { padding: 24, minHeight: 400, position: 'relative' },
  empty: { color: 'var(--text-muted)', textAlign: 'center', marginTop: 150, fontSize: 13 },
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 120 },
  loadingText: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 },
  resultWrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  resultHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cacheBadge: { fontSize: 10, fontWeight: 800, color: 'var(--accent-active)', padding: '2px 8px', background: 'rgba(34, 211, 238, 0.1)', borderRadius: 12 },
  copyBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: 9, fontWeight: 800, padding: '4px 8px', borderRadius: 4, cursor: 'pointer' },
  resultContent: { fontSize: 13, lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#e8e9f3' },
  sidebar: { display: 'flex', flexDirection: 'column' },
  sideCard: { padding: 20 },
  sideTitle: { margin: '0 0 16px 0', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em' },
  sideSection: { marginBottom: 20 },
  sideSub: { fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 10 },
  sideItem: { display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 },
  sideName: { fontSize: 12, fontWeight: 600 },
  sideMeta: { fontSize: 10, fontWeight: 700, color: 'var(--accent-active)' }
};
