import React, { useState, useEffect, useCallback } from 'react';
import { useProfile } from '../../context/ProfileContext';

const API = process.env.NEXT_PUBLIC_API_URL || 
  'https://career-os-backend-production.up.railway.app/api';

const DJ_COLS = ['Saved','Applied','Phone Screen','Interview','Offer','Rejected'];
const PJ_COLS = ['Saved','Applied','Shortlisted','Interview','Offer','Rejected'];

interface Card {
  id: string; title: string; company: string;
  date_saved: string; apply_url: string; column_name: string;
  ey_connection?: boolean;
}

export const Tracker = () => {
  const { profile } = useProfile();
  const cols = profile === 'dj' ? DJ_COLS : PJ_COLS;
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/tracker/${profile}`);
      const d = await r.json();
      const all: Card[] = [];
      if (d.cards) {
        Object.keys(d.cards).forEach(col => {
          all.push(...d.cards[col]);
        });
      }
      setCards(all);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [profile]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const advance = async (card: Card) => {
    const i = cols.indexOf(card.column_name);
    if (i >= cols.length - 1) return;
    const next = cols[i + 1];
    setCards(prev => prev.map(c => c.id === card.id ? {...c, column_name: next} : c));
    await fetch(`${API}/tracker/${profile}/${card.id}`, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ column: next })
    });
  };

  const remove = async (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    await fetch(`${API}/tracker/${profile}/${id}`, { method: 'DELETE' });
  };

  // Stats
  const week = new Date(); week.setDate(week.getDate() - 7);
  const thisWeek = cards.filter(c => new Date(c.date_saved) > week).length;
  const active = cards.filter(c => !['Saved','Rejected'].includes(c.column_name)).length;
  const applied = cards.filter(c => c.column_name !== 'Saved').length;
  const advanced = cards.filter(c => ['Phone Screen','Shortlisted','Interview','Offer'].includes(c.column_name)).length;
  const responseRate = applied > 0 ? Math.round((advanced / applied) * 100) : 0;

  const accent = profile === 'dj' ? '#22D3EE' : '#F472B6';

  if (loading) return (
    <div style={{textAlign:'center',padding:'60px',color:'#9ca3b8'}}>
      <div className="spinner" style={{margin:'0 auto 12px'}} />
      Loading tracker...
    </div>
  );

  return (
    <div style={{padding:'24px 0'}}>
      {/* Stats bar */}
      <div style={{display:'flex',gap:'12px',marginBottom:'24px',flexWrap:'wrap'}}>
        {[
          {label:'This Week', val: thisWeek},
          {label:'Response Rate', val: `${responseRate}%`},
          {label:'Active Pipeline', val: active},
          {label:'Total Applications', val: applied},
        ].map(s => (
          <div key={s.label} style={{
            flex:'1',minWidth:'140px',padding:'16px',
            background:'#12131f',border:'1px solid rgba(255,255,255,0.05)',
            borderRadius:'12px'
          }}>
            <div style={{fontSize:'24px',fontWeight:800,color:accent,fontFamily:'var(--font-mono)'}}>{s.val}</div>
            <div style={{fontSize:'11px',color:'#5f6580',marginTop:'4px',letterSpacing:'.06em'}}>{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      {cards.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px',color:'#5f6580'}}>
          <div style={{fontSize:'40px',marginBottom:'12px'}}>📋</div>
          <div style={{fontSize:'14px',fontWeight:600,color:'#9ca3b8',marginBottom:'6px'}}>No applications tracked yet</div>
          <div style={{fontSize:'12px'}}>Save jobs from the Job Hub to start tracking your applications.</div>
        </div>
      ) : (
        <div style={{display:'flex',gap:'12px',overflowX:'auto',paddingBottom:'12px'}}>
          {cols.map(col => {
            const colCards = cards.filter(c => c.column_name === col);
            return (
              <div key={col} style={{
                minWidth:'200px',flex: 1,
                background:'#12131f',border:'1px solid rgba(255,255,255,0.05)',
                borderRadius:'12px',padding:'12px'
              }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                  <span style={{fontSize:'11px',fontWeight:700,letterSpacing:'.08em',color:'#5f6580',textTransform:'uppercase'}}>{col}</span>
                  <span style={{fontSize:'10px',background:'#1a1b2e',borderRadius:'4px',padding:'2px 6px',fontFamily:'monospace',color:'#9ca3b8'}}>{colCards.length}</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'7px',minHeight:'60px'}}>
                  {colCards.length === 0 && (
                    <div style={{border:'1px dashed rgba(255,255,255,0.05)',borderRadius:'8px',padding:'12px',fontSize:'11px',color:'#5f6580',textAlign:'center'}}>Empty</div>
                  )}
                  {colCards.map(card => (
                    <div key={card.id} style={{
                      background:'#1a1b2e',border:'1px solid rgba(255,255,255,0.05)',
                      borderRadius:'8px',padding:'10px',fontSize:'12px'
                    }}>
                      <div style={{fontWeight:600,color:'#e8e9f3',marginBottom:'3px',fontSize:'12px'}}>{card.title}</div>
                      <div style={{color:'#5f6580',fontSize:'11px',marginBottom:'5px'}}>{card.company}</div>
                      {card.ey_connection && <div style={{fontSize:'10px',color:'#f59e0b',marginBottom:'4px'}}>⭐ EY Alumni Advantage</div>}
                      <div style={{fontSize:'10px',color:'#5f6580',marginBottom:'6px'}}>{new Date(card.date_saved || Date.now()).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                      <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                        {card.apply_url && (
                          <a href={card.apply_url} target="_blank" rel="noreferrer" style={{fontSize:'10px',padding:'3px 7px',borderRadius:'4px',border:'1px solid rgba(255,255,255,0.1)',color:'#9ca3b8',textDecoration:'none'}}>Apply</a>
                        )}
                        {cols.indexOf(card.column_name) < cols.length - 1 && (
                          <button onClick={() => advance(card)} style={{fontSize:'10px',padding:'3px 7px',borderRadius:'4px',border:'1px solid rgba(255,255,255,0.1)',background:'transparent',color:'#9ca3b8',cursor:'pointer'}}>→ Advance</button>
                        )}
                        <button onClick={() => remove(card.id)} style={{fontSize:'10px',padding:'3px 7px',borderRadius:'4px',border:'1px solid rgba(255,255,255,0.1)',background:'transparent',color:'#f43f5e',cursor:'pointer'}}>✕ Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
