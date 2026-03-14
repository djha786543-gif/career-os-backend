import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { VaultSection } from '../../data/prepVault';

type Mode = 'accordion' | 'flashcards';

const WEIGHT_COLOR: Record<string, string> = {
  critical: '#f43f5e',
  high:     '#f59e0b',
  medium:   '#6366f1',
  low:      '#10b981',
};

const TAG_STYLE: Record<string, React.CSSProperties> = {
  formula: { background: 'rgba(99,102,241,.12)', color: '#6366f1',  border: '1px solid rgba(99,102,241,.25)' },
  trap:    { background: 'rgba(244,63,94,.12)',   color: '#f43f5e', border: '1px solid rgba(244,63,94,.25)' },
  concept: { background: 'rgba(16,185,129,.12)',  color: '#10b981', border: '1px solid rgba(16,185,129,.25)' },
};

export function PrepVault() {
  const { vault, theme } = useProfile();
  const [mode,     setMode]     = useState<Mode>('accordion');
  const [openId,   setOpenId]   = useState<string | null>(null);
  const [openSubs, setOpenSubs] = useState<Record<string, boolean>>({});
  const [cardIdx,  setCardIdx]  = useState(0);
  const [flipped,  setFlipped]  = useState(false);
  const [mastered, setMastered] = useState<Set<number>>(new Set());

  // Reset card index when vault changes (profile switch)
  useEffect(() => { setCardIdx(0); setFlipped(false); setMastered(new Set()); }, [vault]);

  const toggleSection = (id: string) =>
    setOpenId(prev => prev === id ? null : id);

  const toggleSub = (key: string) =>
    setOpenSubs(prev => ({ ...prev, [key]: !prev[key] }));

  const card = vault.flashcards[cardIdx];
  const remaining = vault.flashcards.filter((_, i) => !mastered.has(i));

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={s.secLabel}>PREP VAULT</div>
          <div style={s.secTitle}>{vault.title}</div>
          <div style={s.secSub}>{vault.sub}</div>
        </div>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 10, padding: 4, border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          {(['accordion', 'flashcards'] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              ...s.modeBtn,
              background: mode === m ? theme.dim : 'transparent',
              color:      mode === m ? theme.glow : 'var(--text-muted)',
              border:     `1px solid ${mode === m ? theme.border : 'transparent'}`,
            }}>
              {m === 'accordion' ? '📖 Reference' : '🃏 Flashcards'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Quick Topics ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
        {vault.quickTopics.map(t => (
          <span key={t} style={s.quickChip}>{t}</span>
        ))}
      </div>

      {/* ════════════════════════════════════ ACCORDION MODE ══════════════════ */}
      {mode === 'accordion' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {vault.sections.map((sec: VaultSection) => (
            <div key={sec.id} className="glass" style={{ overflow: 'hidden' }}>
              {/* Section header */}
              <button
                onClick={() => toggleSection(sec.id)}
                style={{ ...s.sectionBtn, borderBottom: openId === sec.id ? '1px solid var(--border-subtle)' : 'none' }}
              >
                <span style={s.secIcon}>{sec.icon}</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={s.sectionTitle}>{sec.title}</span>
                    <span style={{ ...s.weightBadge, background: WEIGHT_COLOR[sec.weight] + '22', color: WEIGHT_COLOR[sec.weight] }}>
                      {sec.weight}
                    </span>
                    <span style={{ ...s.tagBadge, ...TAG_STYLE[sec.tag] }}>{sec.tag}</span>
                  </div>
                  <div style={s.sectionSub}>{sec.subtitle}</div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 18, transition: 'transform .2s', transform: openId === sec.id ? 'rotate(180deg)' : 'none' }}>⌄</span>
              </button>

              {/* Section body */}
              {openId === sec.id && (
                <div style={{ padding: '0 20px 20px' }}>
                  {sec.subsections.map((sub, i) => {
                    const subKey = `${sec.id}-${i}`;
                    return (
                      <div key={i} style={{ marginTop: 16 }}>
                        <button onClick={() => toggleSub(subKey)} style={s.subBtn}>
                          <span style={s.subHeading}>{sub.heading}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                            {openSubs[subKey] ? '−' : '+'}
                          </span>
                        </button>
                        {openSubs[subKey] && (
                          <div
                            style={{ marginTop: 12 }}
                            // pv-formula, pv-trap, pv-tree, pv-table etc. are styled via globals.css
                            dangerouslySetInnerHTML={{ __html: sub.content }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════ FLASHCARD MODE ══════════════════ */}
      {mode === 'flashcards' && (
        <div>
          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(mastered.size / vault.flashcards.length) * 100}%`, background: '#10b981', borderRadius: 3, transition: 'width .5s' }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
              {mastered.size}/{vault.flashcards.length} mastered
            </span>
          </div>

          {/* Card */}
          <div
            onClick={() => setFlipped(f => !f)}
            style={{
              ...s.flashcard,
              background:  flipped ? theme.dim : 'var(--bg-secondary)',
              borderColor: flipped ? theme.border : 'var(--border-subtle)',
              cursor:      'pointer',
            }}
          >
            <div style={s.cardSide}>{flipped ? 'ANSWER' : 'QUESTION'}</div>
            <div style={s.cardText}>{flipped ? card.a : card.q}</div>
            <div style={s.cardHint}>{flipped ? 'Click to see question' : 'Click to reveal answer'}</div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
            <button
              onClick={() => { setCardIdx(i => Math.max(0, i - 1)); setFlipped(false); }}
              disabled={cardIdx === 0}
              style={s.navBtn}
            >
              ← Prev
            </button>
            <button
              onClick={() => { setMastered(m => { const n = new Set(m); n.has(cardIdx) ? n.delete(cardIdx) : n.add(cardIdx); return n; }); }}
              style={{
                ...s.navBtn,
                background: mastered.has(cardIdx) ? 'rgba(16,185,129,.12)' : 'rgba(99,102,241,.1)',
                color:      mastered.has(cardIdx) ? '#10b981' : 'var(--text-secondary)',
                border:     `1px solid ${mastered.has(cardIdx) ? 'rgba(16,185,129,.3)' : 'var(--border-subtle)'}`,
              }}
            >
              {mastered.has(cardIdx) ? '✓ Mastered' : 'Mark Mastered'}
            </button>
            <button
              onClick={() => { setCardIdx(i => Math.min(vault.flashcards.length - 1, i + 1)); setFlipped(false); }}
              disabled={cardIdx === vault.flashcards.length - 1}
              style={s.navBtn}
            >
              Next →
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            Card {cardIdx + 1} of {vault.flashcards.length}
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  secLabel:     { fontSize: 10, fontWeight: 700, letterSpacing: '.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 },
  secTitle:     { fontSize: 22, fontWeight: 800, marginBottom: 4 },
  secSub:       { fontSize: 13, color: 'var(--text-secondary)', maxWidth: 600 },
  modeBtn:      { padding: '6px 16px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' },
  quickChip:    { fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 6, background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.15)', color: 'var(--text-secondary)', cursor: 'default' },
  sectionBtn:   { display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '16px 20px', background: 'transparent', cursor: 'pointer', transition: 'background .2s', borderRadius: 0 },
  secIcon:      { fontSize: 20, flexShrink: 0 },
  sectionTitle: { fontSize: 15, fontWeight: 700 },
  weightBadge:  { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, letterSpacing: '.04em', textTransform: 'uppercase' },
  tagBadge:     { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, letterSpacing: '.04em' },
  sectionSub:   { fontSize: 12, color: 'var(--text-muted)', marginTop: 3 },
  subBtn:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 0', background: 'transparent', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' },
  subHeading:   { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left' },
  flashcard:    { minHeight: 220, padding: 36, borderRadius: 16, border: '1px solid', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'all .3s', userSelect: 'none' },
  cardSide:     { fontSize: 10, fontWeight: 700, letterSpacing: '.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 16 },
  cardText:     { fontSize: 17, fontWeight: 600, textAlign: 'center', lineHeight: 1.6, maxWidth: 640 },
  cardHint:     { marginTop: 20, fontSize: 11, color: 'var(--text-muted)' },
  navBtn:       { padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', transition: 'all .2s' },
};
