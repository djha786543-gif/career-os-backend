import React, { useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { PREP_VAULT } from '../../data/prepVault';
import { api } from '../../config/api';

export function PrepVault() {
  const { profile } = useProfile();
  const data = PREP_VAULT[profile];
  
  const [subtab, setSubtab] = useState<'vault' | 'flashcards' | 'ai'>('vault');
  const [filter, setFilter] = useState('All');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Flashcards state
  const [flashcards, setFlashcards] = useState<any[]>([...data.flashcards]);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const revealedCount = Object.keys(flipped).length;

  // AI state
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('full');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const filteredSections = data.sections.filter(s => {
    if (filter === 'All') return true;
    if (filter === '🔴 Critical') return s.weight === 'critical';
    if (filter === '🟠 High') return s.weight === 'high';
    if (filter === '📐 Formulas') return s.tag === 'formula';
    if (filter === '⚠️ Traps') return s.tag === 'trap';
    return true;
  });

  const shuffleCards = () => {
    setFlashcards([...flashcards].sort(() => Math.random() - 0.5));
    setFlipped({});
  };

  const handleGenerate = async (overrideTopic?: string) => {
    const activeTopic = overrideTopic || topic;
    if (!activeTopic) return;
    setLoading(true);
    setAiResult(null);
    try {
      const res = await api.post('/ai/vault-entry', { profile, topic: activeTopic, type });
      setAiResult(res.result);
      setCached(res.cached);
    } catch (err) {
      setAiResult('Failed to generate entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h2 style={s.title}>PREP VAULT / <span style={{ color: 'var(--accent-active)' }}>EXAM READY</span></h2>
        <div style={s.tabs}>
          <button onClick={() => setSubtab('vault')} style={{ ...s.tabBtn, borderBottom: subtab === 'vault' ? '2px solid var(--accent-active)' : '2px solid transparent', color: subtab === 'vault' ? 'white' : 'var(--text-muted)' }}>Pre-built Vault</button>
          <button onClick={() => setSubtab('flashcards')} style={{ ...s.tabBtn, borderBottom: subtab === 'flashcards' ? '2px solid var(--accent-active)' : '2px solid transparent', color: subtab === 'flashcards' ? 'white' : 'var(--text-muted)' }}>Flashcards</button>
          <button onClick={() => setSubtab('ai')} style={{ ...s.tabBtn, borderBottom: subtab === 'ai' ? '2px solid var(--accent-active)' : '2px solid transparent', color: subtab === 'ai' ? 'white' : 'var(--text-muted)' }}>AI Generator</button>
        </div>
      </div>

      {subtab === 'vault' && (
        <div style={s.vaultWrap}>
          <div style={s.filters}>
            {['All', '🔴 Critical', '🟠 High', '📐 Formulas', '⚠️ Traps'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ ...s.filterBtn, background: filter === f ? 'var(--accent-active)' : 'rgba(255,255,255,0.03)', color: filter === f ? '#000' : 'var(--text-secondary)' }}>{f}</button>
            ))}
          </div>
          <div style={s.sectionList}>
            {filteredSections.map(section => (
              <div key={section.id} className="glass" style={s.sectionCard}>
                <div style={s.sectionHeader} onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}>
                  <div style={s.sectionMeta}>
                    <span style={{ ...s.weightBadge, background: section.weight === 'critical' ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.1)', color: section.weight === 'critical' ? '#f43f5e' : '#f59e0b' }}>{section.weight.toUpperCase()}</span>
                    <span style={s.sectionTag}>#{section.tag}</span>
                  </div>
                  <div style={s.sectionTitle}>{section.title}</div>
                  <div style={{ ...s.arrow, transform: expandedSection === section.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</div>
                </div>
                {expandedSection === section.id && (
                  <div style={s.sectionBody} className="prep-vault-content">
                    {(section as any).subsections.map((sub: any, idx: number) => (
                      <div key={idx} style={{ marginBottom: 24 }}>
                        <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-active)', marginBottom: 12, textTransform: 'uppercase' }}>{sub.heading}</h4>
                        <div dangerouslySetInnerHTML={{ __html: sub.content }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {subtab === 'flashcards' && (
        <div style={s.fcWrap}>
          <div style={s.fcHeader}>
            <div style={s.fcProgress}>Revealed: {revealedCount} / {flashcards.length}</div>
            <div style={s.fcActions}>
              <button onClick={shuffleCards} style={s.fcBtn}>Shuffle</button>
              <button onClick={() => setFlipped({})} style={s.fcBtn}>Reset</button>
            </div>
          </div>
          <div style={s.fcGrid}>
            {flashcards.map((card, i) => (
              <div key={i} style={s.fcCardOuter} onClick={() => setFlipped({ ...flipped, [i]: !flipped[i] })}>
                <div style={{ ...s.fcCardInner, transform: flipped[i] ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                  <div style={s.fcFront} className="glass">
                    <div style={s.fcLabel}>QUESTION</div>
                    <div style={s.fcText}>{card.q}</div>
                  </div>
                  <div style={s.fcBack} className="glass">
                    <div style={{ ...s.fcLabel, color: 'var(--accent-active)' }}>ANSWER</div>
                    <div style={s.fcText}>{card.a}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subtab === 'ai' && (
        <div style={s.aiWrap}>
          <div className="glass" style={s.aiControls}>
            <div style={s.aiInputGroup}>
              <input 
                value={topic} 
                onChange={e => setTopic(e.target.value)}
                placeholder="Enter topic (e.g. NIST AI RMF, scRNA-seq pipeline)" 
                style={s.input}
              />
              <select value={type} onChange={e => setType(e.target.value)} style={s.select}>
                <option value="full">Full Entry</option>
                <option value="traps">Exam Traps Only</option>
                <option value="compare">Framework Comparison</option>
                <option value="flashcards">Flashcard Set (10)</option>
                <option value="mnemonics">Mnemonics & Memory Aids</option>
              </select>
              <button onClick={() => handleGenerate()} style={s.genBtn} disabled={loading}>
                {loading ? <div className="spinner" /> : 'GENERATE'}
              </button>
            </div>
            <div style={s.quickTopics}>
              {data.quickTopics.map(t => (
                <button key={t} onClick={() => { setTopic(t); handleGenerate(t); }} style={s.quickBtn}>{t}</button>
              ))}
            </div>
          </div>
          <div className="glass" style={s.aiResults}>
            {loading ? (
              <div style={s.aiLoading}>
                <div className="spinner" style={{ width: 40, height: 40 }} />
                <div style={s.loadingText}>Synthesizing expert knowledge into vault entry...</div>
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
              <div style={s.aiEmpty}>Select a quick topic or enter a custom one to generate deep-dive prep material</div>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        .prep-vault-content { font-size: 13px; line-height: 1.6; color: #e8e9f3; }
        .pv-def { background: rgba(255,255,255,0.03); border-left: 3px solid var(--accent-active); padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
        .pv-formula { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; margin: 16px 0; }
        .pv-formula-title { font-size: 10px; fontWeight: 900; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; }
        .pv-formula-math { font-family: var(--font-mono); font-size: 16px; color: var(--accent-active); margin-bottom: 8px; }
        .pv-formula-example { font-size: 11px; color: var(--text-muted); }
        .pv-trap { background: rgba(244,63,94,0.05); border: 1px solid rgba(244,63,94,0.2); border-radius: 8px; padding: 12px 16px; margin: 16px 0; }
        .pv-trap::before { content: '⚠️ EXAM TRAP'; display: block; font-size: 10px; font-weight: 900; color: #f43f5e; margin-bottom: 4px; }
        .pv-tip { background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.2); border-radius: 8px; padding: 12px 16px; margin: 16px 0; }
        .pv-tip::before { content: '💡 PRO TIP'; display: block; font-size: 10px; font-weight: 900; color: #10b981; margin-bottom: 4px; }
        .pv-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
        .pv-table th { text-align: left; padding: 10px; background: rgba(255,255,255,0.03); color: var(--text-secondary); border-bottom: 1px solid var(--border-subtle); }
        .pv-table td { padding: 10px; border-bottom: 1px solid var(--border-subtle); }
        .pv-tree { font-family: var(--font-mono); font-size: 12px; white-space: pre; background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px; margin: 16px 0; overflow-x: auto; color: var(--accent-emerald); }
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { animation: 'fadeInUp 0.5s ease-out' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  title: { margin: 0, fontSize: 14, fontWeight: 900, letterSpacing: '0.1em' },
  tabs: { display: 'flex', gap: 24 },
  tabBtn: { background: 'transparent', border: 'none', padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' },
  vaultWrap: { display: 'flex', flexDirection: 'column', gap: 24 },
  filters: { display: 'flex', gap: 10 },
  filterBtn: { padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' },
  sectionList: { display: 'flex', flexDirection: 'column', gap: 12 },
  sectionCard: { overflow: 'hidden' },
  sectionHeader: { padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' },
  sectionMeta: { display: 'flex', gap: 8, flexShrink: 0 },
  weightBadge: { fontSize: 8, fontWeight: 900, padding: '2px 6px', borderRadius: 4 },
  sectionTag: { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' },
  sectionTitle: { flex: 1, fontSize: 14, fontWeight: 800, color: 'white' },
  arrow: { fontSize: 10, color: 'var(--text-muted)', transition: 'transform 0.3s' },
  sectionBody: { padding: '0 20px 24px', borderTop: '1px solid var(--border-subtle)', paddingTop: 24 },
  fcWrap: { display: 'flex', flexDirection: 'column', gap: 24 },
  fcHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  fcProgress: { fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' },
  fcActions: { display: 'flex', gap: 10 },
  fcBtn: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6, padding: '6px 12px', color: 'white', fontSize: 10, fontWeight: 700, cursor: 'pointer' },
  fcGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  fcCardOuter: { height: 200, perspective: 1000, cursor: 'pointer' },
  fcCardInner: { position: 'relative', width: '100%', height: '100%', transition: 'transform 0.6s', transformStyle: 'preserve-3d' },
  fcFront: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', padding: 24, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center', alignItems: 'center', textAlign: 'center' },
  fcBack: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', padding: 24, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center', alignItems: 'center', textAlign: 'center', transform: 'rotateY(180deg)', border: '1px solid var(--accent-active)' },
  fcLabel: { fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.1em' },
  fcText: { fontSize: 14, fontWeight: 700, lineHeight: '1.5' },
  aiWrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  aiControls: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  aiInputGroup: { display: 'flex', gap: 12 },
  input: { flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: 'white', fontSize: 13 },
  select: { background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: 'white', fontSize: 13 },
  genBtn: { padding: '0 24px', background: 'var(--accent-active)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 800, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 120 },
  quickTopics: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  quickBtn: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: '4px 12px', color: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, cursor: 'pointer' },
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
