import React, { useEffect, useRef } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { HeatmapEntry } from '../../data/profiles';

const BAR_GRADIENT: Record<string, string> = {
  '#f43f5e': 'linear-gradient(90deg, #f43f5e, #fb7185)',
  '#f59e0b': 'linear-gradient(90deg, #f59e0b, #fbbf24)',
  '#10b981': 'linear-gradient(90deg, #10b981, #34d399)',
  '#6366f1': 'linear-gradient(90deg, #6366f1, #818cf8)',
};

const SIGNAL_LABEL: Record<string, { label: string; color: string }> = {
  '#f43f5e': { label: '🔥 Critical',  color: '#f43f5e' },
  '#f59e0b': { label: '📈 Growing',   color: '#f59e0b' },
  '#10b981': { label: '✅ Established',color: '#10b981' },
};

export function MarketHeatmap() {
  const { profile, theme } = useProfile();
  const barsRef = useRef<HTMLDivElement[]>([]);

  // Animate bars on mount / profile switch
  useEffect(() => {
    barsRef.current.forEach((el, i) => {
      if (!el) return;
      el.style.width = '0%';
      setTimeout(() => {
        el.style.width = profile.heatmap[i].score + '%';
      }, i * 60);
    });
  }, [profile]);

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={s.secLabel}>MARKET INTELLIGENCE</div>
        <div style={s.secTitle}>Skill Demand Heatmap</div>
        <div style={s.secSub}>Real-time market demand scores · {profile.name}</div>
      </div>

      {/* ── Gauge ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <div className="glass" style={{ padding: 24 }}>
          <div style={s.gaugeLabel}>OVERALL MARKET FIT</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '12px 0' }}>
            <span style={{ fontSize: 48, fontWeight: 800, fontFamily: 'var(--font-mono)', color: theme.glow }}>
              {profile.gaugeVal}
            </span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div style={{ fontSize: 12, color: '#10b981' }}>{profile.gaugeTrend}</div>
        </div>
        <div className="glass" style={{ padding: 24 }}>
          <div style={s.gaugeLabel}>KEY SIGNALS</div>
          {profile.gaugeBars.map(bar => (
            <div key={bar.label} style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{bar.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: bar.color, fontWeight: 700 }}>{bar.val}</span>
              </div>
              <div style={s.barWrap}>
                <div style={{ ...s.barFill, width: `${bar.val}%`, background: bar.color + 'cc', transition: 'width 1s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stat row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
        {profile.trendStats.map(stat => (
          <div key={stat.lbl} className="glass" style={{ padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', background: `linear-gradient(135deg, var(--accent-indigo), ${theme.glow})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {stat.val}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{stat.lbl}</div>
            <div style={{ fontSize: 11, color: stat.up ? '#10b981' : '#f43f5e', marginTop: 6 }}>{stat.delta}</div>
          </div>
        ))}
      </div>

      {/* ── Heatmap bars ── */}
      <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
        <div style={s.gaugeLabel}>SKILL DEMAND RANKING</div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {profile.heatmap.map((entry: HeatmapEntry, i) => {
            const sig = SIGNAL_LABEL[entry.color] ?? { label: '—', color: '#5f6580' };
            return (
              <div key={entry.name} style={s.skillRow}>
                <span style={s.rank}>{i + 1}</span>
                <span style={s.skillName}>{entry.name}</span>
                <div style={s.barWrap}>
                  <div
                    ref={el => { if (el) barsRef.current[i] = el; }}
                    style={{
                      height: '100%', borderRadius: 3, width: '0%',
                      background: BAR_GRADIENT[entry.color] || entry.color,
                      transition: 'width 1.2s cubic-bezier(.16,1,.3,1)',
                    }}
                  />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, minWidth: 28, textAlign: 'right', fontWeight: 700, color: entry.color }}>
                  {entry.score}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: entry.color + '22', color: entry.color, minWidth: 90, textAlign: 'right' }}>
                  {entry.delta}
                </span>
                <span style={{ fontSize: 11, color: sig.color, minWidth: 100, textAlign: 'right' }}>{sig.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  secLabel:  { fontSize: 10, fontWeight: 700, letterSpacing: '.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 },
  secTitle:  { fontSize: 22, fontWeight: 800, marginBottom: 4 },
  secSub:    { fontSize: 13, color: 'var(--text-secondary)' },
  gaugeLabel:{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', color: 'var(--text-muted)', textTransform: 'uppercase' },
  barWrap:   { flex: 1, height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' },
  barFill:   { height: '100%', borderRadius: 3 },
  skillRow:  { display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 10 },
  rank:      { fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: 20, textAlign: 'right' },
  skillName: { fontSize: 13, fontWeight: 600, minWidth: 200, flexShrink: 0 },
};
