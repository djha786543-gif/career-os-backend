import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { api } from '../../config/api';

export function StudyPlan() {
  const { profile } = useProfile();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/study/plan?profile=${profile}`);
        setData(res);
      } catch (err) {
        console.error('Plan load failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [profile]);

  return (
    <div className="glass" style={{ padding: '24px' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>CERTIFICATION STUDY PLAN / <span style={{ color: 'var(--accent-active)' }}>MILESTONES</span></h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>Target: {profile === 'dj' ? 'ISACA AAIA (March 2026)' : 'ASCP MB (May 2026)'}</p>
        </div>
      </header>

      {loading ? <div className="spinner" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(data?.weeks || []).map((week: any, wIdx: number) => (
            <div key={wIdx} className="glass" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-active)' }}>{week.lbl}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {week.tasks.map((task: string, tIdx: number) => (
                  <label key={tIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" style={{ accentColor: 'var(--accent-active)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{task}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
