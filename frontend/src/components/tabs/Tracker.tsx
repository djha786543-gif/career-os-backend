import React, { useState, useEffect, useCallback } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { fetchKanbanCards, updateKanbanCard, deleteKanbanCard, KanbanCard } from '../../utils/api';

const STAGES: KanbanCard['stage'][] = [
  'wishlist', 'applied', 'phone_screen', 'interview', 'offer', 'rejected', 'archived',
];

const STAGE_META: Record<KanbanCard['stage'], { label: string; color: string; icon: string }> = {
  wishlist:     { label: 'Wishlist',     color: '#6366f1', icon: '⭐' },
  applied:      { label: 'Applied',      color: '#06b6d4', icon: '📨' },
  phone_screen: { label: 'Phone Screen', color: '#f59e0b', icon: '📞' },
  interview:    { label: 'Interview',    color: '#a855f7', icon: '🗓️' },
  offer:        { label: 'Offer',        color: '#10b981', icon: '🎉' },
  rejected:     { label: 'Rejected',     color: '#f43f5e', icon: '✕'  },
  archived:     { label: 'Archived',     color: '#5f6580', icon: '📁' },
};

export function Tracker() {
  const { activeId, theme } = useProfile();
  const [cards,   setCards]   = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchKanbanCards(activeId);
      setCards(data);
    } catch (e) {
      setError('Could not load tracker. Ensure the backend is running and DATABASE_URL is set.');
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => { load(); }, [load]);

  const moveCard = async (card: KanbanCard, stage: KanbanCard['stage']) => {
    if (!card.id) return;
    try {
      const updated = await updateKanbanCard(card.id, { stage });
      setCards(prev => prev.map(c => c.id === card.id ? updated : c));
    } catch (e) {
      console.error('[Tracker] move failed:', e);
    }
  };

  const deleteCard = async (id: string) => {
    try {
      await deleteKanbanCard(id);
      setCards(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      console.error('[Tracker] delete failed:', e);
    }
  };

  const columnCards = (stage: KanbanCard['stage']) =>
    cards.filter(c => c.stage === stage);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={s.secLabel}>APPLICATION TRACKER</div>
          <div style={s.secTitle}>Kanban Board</div>
          <div style={s.secSub}>{cards.length} applications tracked</div>
        </div>
        <button onClick={load} style={{ ...s.refreshBtn, background: theme.dim, color: theme.glow, border: `1px solid ${theme.border}` }}>
          ↻ Refresh
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading tracker…</div>
      )}

      {error && (
        <div style={{ padding: 20, borderRadius: 12, background: 'rgba(244,63,94,.08)', border: '1px solid rgba(244,63,94,.25)', color: '#f43f5e', fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      {!loading && !error && (
        <div style={{ overflowX: 'auto', paddingBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, minWidth: 900 }}>
            {STAGES.map(stage => {
              const meta = STAGE_META[stage];
              const col  = columnCards(stage);
              return (
                <div key={stage} style={{ flex: 1, minWidth: 160 }}>
                  {/* Column header */}
                  <div style={{ ...s.colHeader, borderColor: meta.color + '44', background: meta.color + '11' }}>
                    <span>{meta.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'var(--font-mono)', background: meta.color + '22', color: meta.color, padding: '1px 7px', borderRadius: 4 }}>
                      {col.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {col.map(card => (
                      <div key={card.id} className="glass" style={{ padding: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>{card.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{card.company}</div>

                        {card.match_score !== undefined && (
                          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: theme.glow, marginBottom: 8 }}>
                            {card.match_score}% match
                          </div>
                        )}

                        {/* Move stage */}
                        <select
                          value={stage}
                          onChange={e => moveCard(card, e.target.value as KanbanCard['stage'])}
                          style={s.stageSelect}
                        >
                          {STAGES.map(st => (
                            <option key={st} value={st}>{STAGE_META[st].label}</option>
                          ))}
                        </select>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          {card.apply_url && (
                            <a href={card.apply_url} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 10, color: theme.glow, flexGrow: 1, textAlign: 'center', padding: '4px 0', borderRadius: 5, background: theme.dim, border: `1px solid ${theme.border}` }}>
                              Apply →
                            </a>
                          )}
                          <button onClick={() => card.id && deleteCard(card.id)}
                            style={{ fontSize: 10, color: '#f43f5e', padding: '4px 8px', borderRadius: 5, background: 'rgba(244,63,94,.1)', border: '1px solid rgba(244,63,94,.25)' }}>
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}

                    {col.length === 0 && (
                      <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', borderRadius: 10, border: '1px dashed var(--border-subtle)' }}>
                        empty
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  secLabel:    { fontSize: 10, fontWeight: 700, letterSpacing: '.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 },
  secTitle:    { fontSize: 22, fontWeight: 800, marginBottom: 4 },
  secSub:      { fontSize: 13, color: 'var(--text-secondary)' },
  refreshBtn:  { padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  colHeader:   { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 9, border: '1px solid', fontSize: 11 },
  stageSelect: { width: '100%', fontSize: 11, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' },
};
