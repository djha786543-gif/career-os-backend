import React from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useFetch } from '../../hooks/useFetch';
import { DEMO_TRENDS_FALLBACK } from '../../data/fallbacks';
import { SourceBadge } from '../SourceBadge';

interface TrendsResponse {
  trends: {
    hot: string[];
    rising: string[];
    stable: string[];
    cooling: string[];
  };
  source: string;
}

export function TrendRadar() {
  const { profile } = useProfile();
  const { data, loading, source } = useFetch<TrendsResponse>('/api/trends', DEMO_TRENDS_FALLBACK as TrendsResponse);

  const trends = data?.trends || { hot: [], rising: [], stable: [], cooling: [] };

  const Column = ({ title, items, color, background }: { title: string, items: string[], color: string, background: string }) => (
    <div style={{ 
      flex: 1, 
      minWidth: '200px',
      background: 'rgba(255,255,255,0.02)', 
      borderRadius: '12px', 
      padding: '16px',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      <h3 style={{ 
        fontSize: '0.8rem', 
        fontWeight: 800, 
        color: color, 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((tag, idx) => (
          <div key={idx} style={{ 
            padding: '8px 12px', 
            borderRadius: '6px', 
            background: background, 
            color: 'white', 
            fontSize: '0.9rem',
            fontWeight: 600,
            border: `1px solid ${color}22`
          }}>
            {tag}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="trend-radar-section" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
        <SourceBadge source={source} />
      </div>

      <header style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Trend Radar</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>Emerging skills and market shifts</p>
      </header>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          Scanning market signals...
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Column 
              title="Hot" 
              items={trends.hot} 
              color="#ef4444" 
              background="rgba(239, 68, 68, 0.1)" 
            />
            <Column 
              title="Rising" 
              items={trends.rising} 
              color="#22c55e" 
              background="rgba(34, 197, 94, 0.1)" 
            />
            <Column 
              title="Stable" 
              items={trends.stable} 
              color="#94a3b8" 
              background="rgba(148, 163, 184, 0.1)" 
            />
            <Column 
              title="Cooling" 
              items={trends.cooling} 
              color="#3b82f6" 
              background="rgba(59, 130, 246, 0.1)" 
            />
          </div>
          
          {source === 'claude' && (
            <footer style={{ marginTop: '24px', textAlign: 'right', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
              ✦ AI-generated insights based on recent job descriptions
            </footer>
          )}
        </>
      )}
    </div>
  );
}
