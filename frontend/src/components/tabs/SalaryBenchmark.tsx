import React from 'react';
import { useProfile } from '../../context/ProfileContext';

const TIER_STYLE: Record<string, { bg: string; color: string }> = {
  S: { bg: 'rgba(244,63,94,.12)',  color: '#f43f5e' },
  A: { bg: 'rgba(245,158,11,.12)', color: '#f59e0b' },
  B: { bg: 'rgba(99,102,241,.12)', color: '#6366f1' },
  C: { bg: 'rgba(16,185,129,.12)', color: '#10b981' },
};

export function SalaryBenchmark() {
  const { profile, theme } = useProfile();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={s.secLabel}>COMPENSATION INTELLIGENCE</div>
        <div style={s.secTitle}>Salary Benchmark</div>
        <div style={s.secSub}>Cert ROI analysis · Market salary ranges</div>
      </div>

      {/* Summary strip */}
      <div className="glass" style={{ padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CURRENT YOE</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: theme.glow }}>{profile.yoe}</div>
        </div>
        <div style={{ width: 1, height: 40, background: 'var(--border-subtle)' }} />
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>DOMAIN</div>
          <div style={{ fontSize: 13, fontWeight: 600, maxWidth: 400 }}>{profile.domain}</div>
        </div>
      </div>

      {/* Salary table */}
      <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
        <div style={s.cardLabel}>💰 CERT SALARY IMPACT</div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {profile.salary.map(row => {
            const ts = TIER_STYLE[row.tier] ?? TIER_STYLE.C;
            return (
              <div key={row.skill} style={s.salaryRow}>
                <span style={{ ...s.tierBadge, background: ts.bg, color: ts.color }}>
                  {row.tier}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{row.skill}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: '#10b981' }}>
                  {row.impact}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timing strategy */}
      <div className="glass" style={{ padding: 24 }}>
        <div style={s.cardLabel}>⏱ ACQUISITION STRATEGY</div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {profile.timing.map(t => (
            <div key={t.skill} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: `1px solid ${t.color}33` }}>
              <div style={{ padding: '4px 12px', borderRadius: 7, fontSize: 11, fontWeight: 800, background: t.color + '22', color: t.color, flexShrink: 0, letterSpacing: '.04em' }}>
                {t.status}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t.skill}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{t.reason}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  secLabel:  { fontSize: 10, fontWeight: 700, letterSpacing: '.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 },
  secTitle:  { fontSize: 22, fontWeight: 800, marginBottom: 4 },
  secSub:    { fontSize: 13, color: 'var(--text-secondary)' },
  cardLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-muted)', textTransform: 'uppercase' },
  salaryRow: { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-subtle)' },
  tierBadge: { fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 5, minWidth: 30, textAlign: 'center' },
};
