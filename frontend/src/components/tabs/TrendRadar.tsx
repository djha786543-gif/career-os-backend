import React, { useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { PROFILES } from '../../data/profiles';
import { api } from '../../config/api';

export function TrendRadar() {
  const { profile } = useProfile();
  const data = PROFILES[profile];

  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const handleTrendAI = async (mode: string) => {
    setLoading(true);
    setAiResult(null);
    try {
      const res = await api.post('/ai/trend', { profile, mode });
      setAiResult(res.result);
      setCached(res.cached);
    } catch (err) {
      setAiResult('Failed to load market analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <h2 style={s.title}>TREND RADAR / <span style={{ color: 'var(--accent-active)' }}>MARKET VELOCITY</span></h2>

      <div style={s.statGrid}>
        {data.trendStats.map(stat => (
          <div key={stat.lbl} className="glass" style={s.statCard}>
            <div style={s.statVal}>{stat.val}</div>
            <div style={s.statLabel}>{stat.lbl}</div>
            <div style={{ ...s.statDelta, color: stat.up ? '#10b981' : '#f43f5e' }}>{stat.delta}</div>
          </div>
        ))}
      </div>

      <div style={s.mainGrid}>
        <div style={s.leftCol}>
          <div style={s.sectionHeader}>
            <h3 style={s.sectionTitle}>EMERGING TRENDS</h3>
            <div style={s.aiButtons}>
              <button onClick={() => handleTrendAI('6months')} style={s.aiBtn}>Next 6 Months</button>
              <button onClick={() => handleTrendAI('disruption')} style={s.aiBtn}>Disruption Risks</button>
              <button onClick={() => handleTrendAI('opportunity')} style={s.aiBtn}>Hidden Opportunities</button>
            </div>
          </div>

          {aiResult || loading ? (
            <div className="glass" style={s.aiPanel}>
              <div style={s.aiPanelHeader}>
                <div style={s.liveIndicator}>
                  <div style={s.pulse} />
                  🔄 LIVE MARKET DATA ANALYSIS
                </div>
                {cached && <span style={s.cacheBadge}>⚡ Cached</span>}
              </div>
              {loading ? (
                <div style={s.aiLoading}>
                  <div className="spinner" />
                  <span>Synthesizing real-time market signals...</span>
                </div>
              ) : (
                <div style={s.aiContent}>{aiResult}</div>
              )}
            </div>
          ) : null}

          <div style={s.trendGrid}>
            {data.trends.map(trend => (
              <div key={trend.title} className="glass" style={s.trendCard}>
                <div style={s.trendHeader}>
                  <div style={s.trendIcon}>{trend.icon}</div>
                  <div style={{ ...s.urgency, background: trend.urgency === 'CRITICAL' ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.1)', color: trend.urgency === 'CRITICAL' ? '#f43f5e' : '#f59e0b' }}>{trend.urgency}</div>
                </div>
                <div style={s.trendTitle}>{trend.title}</div>
                <div style={s.trendDesc}>{trend.desc}</div>
                <div style={s.trendScore}>
                  <div style={s.scoreLabel}>MARKET SIGNAL</div>
                  <div style={s.scoreBarBg}>
                    <div style={{ ...s.scoreBarFill, width: `${trend.score}%`, background: trend.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.rightCol}>
          <div className="glass" style={s.sideCard}>
            <h3 style={s.sideTitle}>SALARY IMPACT MATRIX</h3>
            <div style={s.salaryTable}>
              {data.salary.map(row => (
                <div key={row.skill} style={s.salaryRow}>
                  <div style={s.tierBadge}>{row.tier}</div>
                  <div style={s.salarySkill}>{row.skill}</div>
                  <div style={s.salaryVal}>{row.impact}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass" style={{ ...s.sideCard, marginTop: 20 }}>
            <h3 style={s.sideTitle}>MARKET TIMING</h3>
            <div style={s.timingList}>
              {data.timing.map(item => (
                <div key={item.skill} style={s.timingItem}>
                  <div style={s.timingHeader}>
                    <div style={s.timingName}>{item.skill}</div>
                    <div style={{ ...s.timingStatus, color: item.color }}>{item.status}</div>
                  </div>
                  <div style={s.timingReason}>{item.reason}</div>
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
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 },
  statCard: { padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 },
  statVal: { fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-mono)' },
  statLabel: { fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' },
  statDelta: { fontSize: 10, fontWeight: 700 },
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 24 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { margin: 0, fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em' },
  aiButtons: { display: 'flex', gap: 8 },
  aiBtn: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6, padding: '6px 12px', color: 'white', fontSize: 10, fontWeight: 700, cursor: 'pointer' },
  aiPanel: { padding: 20, border: '1px solid var(--accent-active)', background: 'rgba(34, 211, 238, 0.03)' },
  aiPanelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  liveIndicator: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, fontWeight: 900, color: 'var(--accent-active)' },
  pulse: { width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-active)', animation: 'pulse 1.5s infinite' },
  aiLoading: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-muted)', padding: '20px 0' },
  aiContent: { fontSize: 13, lineHeight: '1.6', color: '#e8e9f3', whiteSpace: 'pre-wrap' },
  trendGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 },
  trendCard: { padding: 20, display: 'flex', flexDirection: 'column', gap: 12 },
  trendHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  trendIcon: { fontSize: 20 },
  urgency: { fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 4 },
  trendTitle: { fontSize: 14, fontWeight: 800 },
  trendDesc: { fontSize: 11, color: 'var(--text-secondary)', lineHeight: '1.5' },
  trendScore: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 },
  scoreLabel: { fontSize: 8, fontWeight: 900, color: 'var(--text-muted)' },
  scoreBarBg: { height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 2 },
  rightCol: { display: 'flex', flexDirection: 'column' },
  sideCard: { padding: 20 },
  sideTitle: { margin: '0 0 16px 0', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em' },
  salaryTable: { display: 'flex', flexDirection: 'column', gap: 12 },
  salaryRow: { display: 'flex', alignItems: 'center', gap: 12 },
  tierBadge: { width: 24, height: 24, borderRadius: 4, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: 'var(--accent-active)' },
  salarySkill: { flex: 1, fontSize: 11, fontWeight: 600 },
  salaryVal: { fontSize: 11, fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' },
  timingList: { display: 'flex', flexDirection: 'column', gap: 16 },
  timingItem: { display: 'flex', flexDirection: 'column', gap: 4 },
  timingHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  timingName: { fontSize: 12, fontWeight: 700 },
  timingStatus: { fontSize: 9, fontWeight: 900 },
  timingReason: { fontSize: 10, color: 'var(--text-muted)', lineHeight: '1.4' },
  cacheBadge: { fontSize: 9, fontWeight: 800, color: 'var(--accent-active)', padding: '2px 6px', background: 'rgba(34, 211, 238, 0.1)', borderRadius: 4 }
};
