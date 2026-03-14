import React from 'react';
import { useProfile } from '../../context/ProfileContext';

const URGENCY_COLOR: Record<string, string> = {
  CRITICAL: '#f43f5e',
  HIGH:     '#f59e0b',
  GROWING:  '#6366f1',
  EMERGING: '#10b981',
};

export function TrendRadar() {
  const { profile, theme } = useProfile();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={s.secLabel}>MARKET INTELLIGENCE</div>
        <div style={s.secTitle}>Trend Radar</div>
        <div style={s.secSub}>Live market signals driving hiring in your domain</div>
      </div>

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
        {profile.trendStats.map(stat => (
          <div key={stat.lbl} className="glass" style={{ padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', color: theme.glow }}>{stat.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{stat.lbl}</div>
            <div style={{ fontSize: 11, color: '#10b981', marginTop: 6 }}>{stat.delta}</div>
          </div>
        ))}
      </div>

      {/* Trends grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {profile.trends.map(trend => {
          const urgColor = URGENCY_COLOR[trend.urgency] ?? '#5f6580';
          return (
            <div key={trend.title} className="glass" style={{ padding: 24, borderLeft: `3px solid ${trend.color}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 28 }}>{trend.icon}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{trend.title}</div>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 10px', borderRadius: 5, background: urgColor + '22', color: urgColor, letterSpacing: '.06em' }}>
                      {trend.urgency}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>SIGNAL</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 800, color: trend.color }}>{trend.score}</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{trend.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  secLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 },
  secTitle: { fontSize: 22, fontWeight: 800, marginBottom: 4 },
  secSub:   { fontSize: 13, color: 'var(--text-secondary)' },
};
