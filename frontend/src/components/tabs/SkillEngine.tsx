import React from 'react';
import { useProfile } from '../../context/ProfileContext';

export function SkillEngine() {
  const { profile, theme } = useProfile();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={s.secLabel}>SKILL ANALYSIS</div>
        <div style={s.secTitle}>Skill Engine</div>
        <div style={s.secSub}>Rising demand · Skill gaps · Action priorities</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* ── Rising skills ── */}
        <div className="glass" style={{ padding: 24 }}>
          <div style={s.cardLabel}>🔥 RISING DEMAND</div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {profile.rising.map(r => (
              <div key={r.skill}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{r.skill}</span>
                    <span style={{ ...s.tag, background: 'rgba(244,63,94,.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,.25)' }}>
                      {r.tag}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: theme.glow }}>{r.demand}</span>
                </div>
                <div style={s.barWrap}>
                  <div style={{ ...s.bar, width: `${r.demand}%`, background: `linear-gradient(90deg, ${theme.glow}bb, ${theme.glow})` }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{r.signal}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Skill gaps ── */}
        <div className="glass" style={{ padding: 24 }}>
          <div style={s.cardLabel}>⚡ SKILL GAPS</div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {profile.gaps.map(g => (
              <div key={g.skill}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{g.skill}</span>
                    <span style={{ ...s.tag, background: 'rgba(245,158,11,.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,.25)' }}>
                      {g.tag}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{g.demand}</span>
                </div>
                <div style={s.barWrap}>
                  <div style={{ ...s.bar, width: `${g.demand}%`, background: 'linear-gradient(90deg, #f59e0bbb, #f59e0b)' }} />
                </div>
                <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>{g.signal}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Current skills ── */}
      <div className="glass" style={{ padding: 24, marginTop: 20 }}>
        <div style={s.cardLabel}>💡 CURRENT SKILL SET</div>
        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {profile.skills.split(', ').map(sk => (
            <span key={sk} style={{
              fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 6,
              background: theme.dim, color: theme.glow, border: `1px solid ${theme.border}`,
            }}>
              {sk}
            </span>
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
  barWrap:   { height: 5, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' },
  bar:       { height: '100%', borderRadius: 3, transition: 'width 1.2s cubic-bezier(.16,1,.3,1)' },
  tag:       { fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, letterSpacing: '.04em' },
};
