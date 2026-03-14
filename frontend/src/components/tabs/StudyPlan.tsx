import React, { useState } from 'react';
import { useProfile } from '../../context/ProfileContext';

export function StudyPlan() {
  const { profile, theme } = useProfile();
  const [activeTrack, setActiveTrack] = useState(0);
  const track = profile.tracks[activeTrack];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={s.secLabel}>STUDY TRACKS</div>
        <div style={s.secTitle}>Study Plan</div>
        <div style={s.secSub}>Week-by-week preparation sprints</div>
      </div>

      {/* Track selector */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        {profile.tracks.map((t, i) => (
          <button key={t.title} onClick={() => setActiveTrack(i)} style={{
            ...s.trackBtn,
            background: activeTrack === i ? t.color + '22' : 'var(--bg-secondary)',
            color:      activeTrack === i ? t.color : 'var(--text-muted)',
            border:     `1px solid ${activeTrack === i ? t.color + '55' : 'var(--border-subtle)'}`,
          }}>
            <span style={{ marginRight: 8, fontSize: 18 }}>{t.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{t.title}</div>
              <div style={{ fontSize: 11, opacity: .7 }}>{t.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Week timeline */}
      {track && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {track.weeks.map((week, wi) => (
            <div key={week.lbl} className="glass" style={{ padding: 24, borderLeft: `3px solid ${track.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: track.color + '22', border: `1.5px solid ${track.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: track.color, flexShrink: 0 }}>
                  {wi + 1}
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: track.color }}>{week.lbl}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {week.tasks.map((task, ti) => (
                  <div key={ti} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: track.color, marginTop: 6, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{task}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  secLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 },
  secTitle: { fontSize: 22, fontWeight: 800, marginBottom: 4 },
  secSub:   { fontSize: 13, color: 'var(--text-secondary)' },
  trackBtn: { display: 'flex', alignItems: 'center', gap: 0, padding: '14px 20px', borderRadius: 12, cursor: 'pointer', transition: 'all .2s', minWidth: 260 },
};
