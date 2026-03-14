import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';

interface KanbanCard {
  id: string;
  title: string;
  company: string;
  stage: 'wishlist' | 'applied' | 'phone_screen' | 'interview' | 'offer' | 'rejected' | 'archived';
  match_score?: number;
  apply_url?: string;
}

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
  const { profile } = useProfile();
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    setLoading(true);
    const storageKey = `tracker_${profile}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setCards(JSON.parse(saved));
    } else {
      // Default empty state or mock data
      setCards([]);
    }
    setLoading(false);
  }, [profile]);

  // Save to localStorage
  const saveCards = (newCards: KanbanCard[]) => {
    setCards(newCards);
    localStorage.setItem(`tracker_${profile}`, JSON.stringify(newCards));
  };

  const moveCard = (cardId: string, stage: KanbanCard['stage']) => {
    const newCards = cards.map(c => c.id === cardId ? { ...c, stage } : c);
    saveCards(newCards);
  };

  const deleteCard = (id: string) => {
    const newCards = cards.filter(c => c.id !== id);
    saveCards(newCards);
  };

  const columnCards = (stage: KanbanCard['stage']) =>
    cards.filter(c => c.stage === stage);

  return (
    <div className="tracker-section" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Application Tracker</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>Managing {cards.length} active opportunities</p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
        {STAGES.map(stage => {
          const meta = STAGE_META[stage];
          const stageCards = columnCards(stage);
          
          return (
            <div key={stage} style={{ 
              flex: '0 0 280px', 
              background: 'rgba(255,255,255,0.02)', 
              borderRadius: '12px', 
              padding: '16px',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: '400px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                paddingBottom: '12px', 
                borderBottom: `2px solid ${meta.color}33`,
                marginBottom: '4px'
              }}>
                <span style={{ fontSize: '1.2rem' }}>{meta.icon}</span>
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: meta.color, textTransform: 'uppercase' }}>
                  {meta.label}
                </span>
                <span style={{ 
                  marginLeft: 'auto', 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '2px 8px', 
                  borderRadius: '10px', 
                  fontSize: '0.75rem', 
                  fontWeight: 700 
                }}>
                  {stageCards.length}
                </span>
              </div>

              {stageCards.length === 0 && (
                <div style={{ 
                  padding: '24px', 
                  textAlign: 'center', 
                  color: 'rgba(255,255,255,0.2)', 
                  fontSize: '0.8rem',
                  border: '1px dashed rgba(255,255,255,0.05)',
                  borderRadius: '8px'
                }}>
                  No items
                </div>
              )}

              {stageCards.map(card => (
                <div key={card.id} style={{ 
                  padding: '16px', 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '10px', 
                  border: '1px solid rgba(255,255,255,0.05)',
                  position: 'relative'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{card.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>{card.company}</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <select 
                      value={stage}
                      onChange={(e) => moveCard(card.id, e.target.value as any)}
                      style={{ 
                        width: '100%', 
                        padding: '6px', 
                        borderRadius: '4px', 
                        background: 'rgba(0,0,0,0.2)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        color: 'white',
                        fontSize: '0.75rem'
                      }}
                    >
                      {STAGES.map(s => (
                        <option key={s} value={s}>{STAGE_META[s].label}</option>
                      ))}
                    </select>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {card.apply_url && (
                        <a 
                          href={card.apply_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            flex: 1, 
                            textAlign: 'center', 
                            padding: '6px', 
                            background: 'rgba(255,255,255,0.05)', 
                            borderRadius: '4px', 
                            color: 'white', 
                            textDecoration: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          Apply ↗
                        </a>
                      )}
                      <button 
                        onClick={() => deleteCard(card.id)}
                        style={{ 
                          padding: '6px 10px', 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          border: '1px solid rgba(239, 68, 68, 0.2)', 
                          color: '#ef4444',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
