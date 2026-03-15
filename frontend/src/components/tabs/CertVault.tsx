import React, { useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { PROFILES } from '../../data/profiles';
import { api } from '../../config/api';

export function CertVault() {
  const { profile } = useProfile();
  const data = PROFILES[profile];
  const [subtab, setSubtab] = useState<'static' | 'ai'>('static');
  
  const [targetRole, setTargetRole] = useState('');
  const [timeline, setTimeline] = useState('6 months');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const handleGenerate = async () => {
    if (!targetRole) return;
    setLoading(true);
    setAiResult(null);
    try {
      const res = await api.post('/ai/pathway', { profile, targetRole, timeline });
      setAiResult(res.result);
      setCached(res.cached);
    } catch (err) {
      setAiResult('Failed to generate pathway. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h2 style={s.title}>CERT VAULT / <span style={{ color: 'var(--accent-active)' }}>VALIDATION PATHWAYS</span></h2>
        <div style={s.tabs}>
          <button onClick={() => setSubtab('static')} style={{ ...s.tabBtn, borderBottom: subtab === 'static' ? '2px solid var(--accent-active)' : '2px solid transparent', color: subtab === 'static' ? 'white' : 'var(--text-muted)' }}>Curated Vault</button>
          <button onClick={() => setSubtab('ai')} style={{ ...s.tabBtn, borderBottom: subtab === 'ai' ? '2px solid var(--accent-active)' : '2px solid transparent', color: subtab === 'ai' ? 'white' : 'var(--text-muted)' }}>AI Pathway Generator</button>
        </div>
      </div>

      {subtab === 'static' ? (
        <div style={s.staticGrid}>
          {['immediate', 'midterm', 'longterm'].map((term) => (
            <div key={term} style={s.termSection}>
              <h3 style={s.termTitle}>{term.toUpperCase()} GOALS</h3>
              <div style={s.certGrid}>
                {(data.vault as any)[term].map((cert: any, i: number) => (
                  <div key={cert.name} className="glass" style={{ ...s.certCard, border: i === 0 && term === 'immediate' ? '1px solid var(--accent-active)' : '1px solid var(--border-subtle)', boxShadow: i === 0 && term === 'immediate' ? '0 0 20px rgba(34, 211, 238, 0.1)' : 'none' }}>
                    <div style={s.certHeader}>
                      <div>
                        <div style={s.certName}>{cert.name}</div>
                        <div style={s.certIssuer}>{cert.issuer}</div>
                      </div>
                      <div style={s.timelineBadge}>{cert.timeline}</div>
                    </div>
                    <div style={s.certMeta}>
                      <div style={s.metaItem}><span>Demand</span><span style={{ color: 'var(--accent-active)' }}>{cert.demand}%</span></div>
                      <div style={s.metaItem}><span>Impact</span><span style={{ color: '#10b981' }}>{cert.salaryImpact}</span></div>
                      <div style={s.metaItem}><span>Difficulty</span><span>{cert.difficulty}</span></div>
                    </div>
                    <div style={s.certWhy}>{cert.why}</div>
                    <div style={s.pathway}>
                      <div style={s.pathTitle}>PATHWAY STEPS</div>
                      {cert.pathway.map((step: any) => (
                        <div key={step.n} style={s.pathStep}>
                          <div style={s.stepNum}>{step.n}</div>
                          <div style={s.stepTask}>{step.task}</div>
                          <div style={s.stepDur}>{step.dur}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={s.aiWrap}>
          <div className="glass" style={s.aiControls}>
            <div style={s.inputGroup}>
              <label style={s.label}>Target Role</label>
              <input 
                value={targetRole} 
                onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. AI Audit Director" 
                style={s.input}
              />
            </div>
            <div style={s.inputGroup}>
              <label style={s.label}>Timeline</label>
              <select value={timeline} onChange={e => setTimeline(e.target.value)} style={s.select}>
                <option>3 months</option>
                <option>6 months</option>
                <option>12 months</option>
                <option>2-3 years</option>
                <option>5 years</option>
              </select>
            </div>
            <button onClick={handleGenerate} style={s.genBtn} disabled={loading}>
              {loading ? <div className="spinner" /> : 'GENERATE PATHWAY'}
            </button>
          </div>

          <div className="glass" style={s.aiResults}>
            {loading ? (
              <div style={s.aiLoading}>
                <div className="spinner" style={{ width: 40, height: 40 }} />
                <div style={s.loadingText}>Generating personalized validation pathway...</div>
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
              <div style={s.aiEmpty}>Enter your target role and timeline to generate a custom certification roadmap</div>
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
  staticGrid: { display: 'flex', flexDirection: 'column', gap: 40 },
  termSection: { display: 'flex', flexDirection: 'column', gap: 16 },
  termTitle: { margin: 0, fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em' },
  certGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 },
  certCard: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  certHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  certName: { fontSize: 16, fontWeight: 800, color: 'white' },
  certIssuer: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' },
  timelineBadge: { fontSize: 10, fontWeight: 800, padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  certMeta: { display: 'flex', gap: 20, borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', padding: '12px 0' },
  metaItem: { display: 'flex', flexDirection: 'column', gap: 2, fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' },
  certWhy: { fontSize: 12, lineHeight: '1.6', color: 'var(--text-secondary)' },
  pathway: { display: 'flex', flexDirection: 'column', gap: 8 },
  pathTitle: { fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', marginBottom: 4 },
  pathStep: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-primary)' },
  stepNum: { width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'var(--accent-active)', flexShrink: 0 },
  stepTask: { flex: 1 },
  stepDur: { color: 'var(--text-muted)', fontSize: 10, fontWeight: 600 },
  aiWrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  aiControls: { padding: 24, display: 'flex', gap: 20, alignItems: 'flex-end' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
  label: { fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' },
  input: { background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 16px', color: 'white', fontSize: 13 },
  select: { background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 16px', color: 'white', fontSize: 13 },
  genBtn: { height: 42, padding: '0 24px', background: 'var(--accent-active)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 800, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
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
