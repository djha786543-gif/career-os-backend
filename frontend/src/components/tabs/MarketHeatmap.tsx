import React, { useEffect, useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { PROFILES } from '../../data/profiles';

export function MarketHeatmap() {
  const { profile } = useProfile();
  const data = PROFILES[profile];
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, [profile]);

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h2 style={s.title}>MARKET HEATMAP / <span style={{ color: 'var(--accent-active)' }}>{profile.toUpperCase()}</span></h2>
        <div style={s.updated}>Last updated: {new Date().toLocaleDateString()}</div>
      </div>

      <div style={s.grid}>
        {/* Skill Demand Bars */}
        <div className="glass" style={s.card}>
          <h3 style={s.cardTitle}>Skill Demand Intensity</h3>
          <div style={s.barStack}>
            {data.heatmap.map((item, i) => (
              <div key={item.name} style={s.barRow}>
                <div style={s.barLabel}>
                  <span>{item.name}</span>
                  <span style={{ color: item.delta.startsWith('+') ? '#10b981' : '#f43f5e', fontSize: 10 }}>{item.delta}</span>
                </div>
                <div style={s.barBg}>
                  <div 
                    style={{ 
                      ...s.barFill, 
                      width: animate ? `${item.score}%` : '0%', 
                      background: item.color,
                      transition: `width 1s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.05}s`
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.sideCol}>
          {/* Pressure Gauge */}
          <div className="glass" style={s.card}>
            <h3 style={s.cardTitle}>Market Pressure</h3>
            <div style={s.gaugeWrap}>
              <svg viewBox="0 0 100 55" style={s.gaugeSvg}>
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
                <path 
                  d="M 10 50 A 40 40 0 0 1 90 50" 
                  fill="none" 
                  stroke="var(--accent-active)" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  strokeDasharray="125.6"
                  strokeDashoffset={125.6 - (125.6 * (data.gaugeVal / 100))}
                  style={{ transition: 'stroke-dashoffset 1.5s ease-out 0.5s' }}
                />
                <text x="50" y="45" textAnchor="middle" fill="white" fontSize="12" fontWeight="800">{data.gaugeVal}%</text>
              </svg>
              <div style={s.gaugeTrend}>{data.gaugeTrend}</div>
            </div>
            <div style={s.gaugeBars}>
              {data.gaugeBars.map(bar => (
                <div key={bar.label} style={s.miniBarRow}>
                  <div style={s.miniBarLabel}>{bar.label}</div>
                  <div style={s.miniBarBg}>
                    <div style={{ ...s.miniBarFill, width: `${bar.val}%`, background: bar.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rising Skills */}
          <div className="glass" style={{ ...s.card, marginTop: 20 }}>
            <h3 style={s.cardTitle}>Rising Signals</h3>
            <div style={s.list}>
              {data.rising.map(skill => (
                <div key={skill.skill} style={s.listItem}>
                  <div style={s.listItemMain}>
                    <div style={s.skillName}>{skill.skill}</div>
                    <div style={s.signalBadge}>{skill.signal}</div>
                  </div>
                  <div style={s.tagBadge}>{skill.tag}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Gaps */}
          <div className="glass" style={{ ...s.card, marginTop: 20, borderColor: 'rgba(245, 158, 11, 0.2)' }}>
            <h3 style={{ ...s.cardTitle, color: '#f59e0b' }}>Priority Gaps</h3>
            <div style={s.list}>
              {data.gaps.map(skill => (
                <div key={skill.skill} style={s.listItem}>
                  <div style={s.listItemMain}>
                    <div style={s.skillName}>{skill.skill}</div>
                    <div style={{ ...s.signalBadge, color: '#f59e0b' }}>{skill.signal}</div>
                  </div>
                  <div style={{ ...s.tagBadge, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>{skill.tag}</div>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  title: { margin: 0, fontSize: 14, fontWeight: 900, letterSpacing: '0.1em' },
  updated: { fontSize: 11, color: 'var(--text-muted)' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 },
  card: { padding: 24, display: 'flex', flexDirection: 'column' },
  cardTitle: { margin: '0 0 20px 0', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' },
  barStack: { display: 'flex', flexDirection: 'column', gap: 16 },
  barRow: { display: 'flex', flexDirection: 'column', gap: 6 },
  barLabel: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 600 },
  barBg: { height: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  sideCol: { display: 'flex', flexDirection: 'column' },
  gaugeWrap: { position: 'relative', textAlign: 'center', marginBottom: 20 },
  gaugeSvg: { width: '100%', maxWidth: 200, margin: '0 auto' },
  gaugeTrend: { fontSize: 10, fontWeight: 700, color: 'var(--accent-active)', marginTop: -5 },
  gaugeBars: { display: 'flex', flexDirection: 'column', gap: 10 },
  miniBarRow: { display: 'flex', flexDirection: 'column', gap: 4 },
  miniBarLabel: { fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' },
  miniBarBg: { height: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 2, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 2 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  listItemMain: { display: 'flex', flexDirection: 'column', gap: 2 },
  skillName: { fontSize: 12, fontWeight: 700 },
  signalBadge: { fontSize: 10, fontWeight: 700, color: 'var(--accent-active)' },
  tagBadge: { fontSize: 9, fontWeight: 800, padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, color: 'var(--text-secondary)' }
};
