import React, { useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { Cert, CertPathwayStep } from '../../data/profiles';

type Tier = 'immediate' | 'midterm' | 'longterm';

const TIER_LABELS: Record<Tier, { label: string; color: string; icon: string }> = {
  immediate: { label: 'Immediate',  color: '#f43f5e', icon: '🚀' },
  midterm:   { label: 'Mid-Term',   color: '#f59e0b', icon: '📈' },
  longterm:  { label: 'Long-Term',  color: '#6366f1', icon: '🏆' },
};

const DIFF_COLOR: Record<string, string> = {
  Intermediate: '#f59e0b',
  Advanced:     '#f43f5e',
  Expert:       '#a855f7',
};

function CertCard({ cert, color, theme }: { cert: Cert; color: string; theme: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass" style={{ overflow: 'hidden', marginBottom: 12 }}>
      <button onClick={() => setOpen(o => !o)} style={s.certBtn}>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{cert.name}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: DIFF_COLOR[cert.difficulty] + '22', color: DIFF_COLOR[cert.difficulty] }}>
              {cert.difficulty}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>🏛 {cert.issuer}</span>
            <span>📅 {cert.timeline}</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>💰 {cert.salaryImpact}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>DEMAND</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 800, color }}>{cert.demand}</div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 18, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>⌄</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ padding: 14, background: 'rgba(255,255,255,.03)', borderRadius: 10, marginBottom: 16, fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            {cert.why}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
            STUDY PATHWAY
          </div>
          {cert.pathway.map((step: CertPathwayStep) => (
            <div key={step.n} style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: theme.dim, border: `1.5px solid ${theme.border}`, color: theme.glow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                {step.n}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{step.task}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{step.dur}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CertVault() {
  const { profile, theme } = useProfile();
  const [activeTier, setActiveTier] = useState<Tier>('immediate');
  const certs = profile.vault[activeTier];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={s.secLabel}>CERTIFICATION ROADMAP</div>
        <div style={s.secTitle}>Cert Vault</div>
        <div style={s.secSub}>ROI-ranked certifications · {profile.activeCert}</div>
      </div>

      {/* Tier selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(Object.keys(TIER_LABELS) as Tier[]).map(tier => {
          const t = TIER_LABELS[tier];
          return (
            <button key={tier} onClick={() => setActiveTier(tier)} style={{
              ...s.tierBtn,
              background: activeTier === tier ? t.color + '22' : 'var(--bg-secondary)',
              color:      activeTier === tier ? t.color : 'var(--text-muted)',
              border:     `1px solid ${activeTier === tier ? t.color + '44' : 'var(--border-subtle)'}`,
            }}>
              {t.icon} {t.label} ({profile.vault[tier].length})
            </button>
          );
        })}
      </div>

      {certs.map(cert => (
        <CertCard key={cert.name} cert={cert} color={TIER_LABELS[activeTier].color} theme={theme} />
      ))}

      {/* Timing matrix */}
      <div className="glass" style={{ padding: 24, marginTop: 24 }}>
        <div style={s.cardLabel}>⏱ TIMING MATRIX</div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {profile.timing.map(t => (
            <div key={t.skill} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <div style={{ minWidth: 120 }}>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 6, background: t.color + '22', color: t.color }}>{t.status}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, minWidth: 180 }}>{t.skill}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>{t.reason}</span>
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
  certBtn:   { display: 'flex', alignItems: 'center', gap: 16, width: '100%', padding: '16px 20px', background: 'transparent', cursor: 'pointer', transition: 'background .2s' },
  tierBtn:   { padding: '8px 20px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' },
};
