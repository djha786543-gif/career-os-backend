import React from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useFetch } from '../../hooks/useFetch';
import { DEMO_MARKET_FALLBACK } from '../../data/fallbacks';
import { SourceBadge } from '../SourceBadge';

interface MarketData {
  city: string;
  demand: number;
  jobs: number;
  yoy: string;
}

interface MarketResponse {
  data: MarketData[];
  source: string;
}

export function MarketHeatmap() {
  const { metadata } = useProfile();
  const { data, loading, source } = useFetch<MarketResponse>('/api/market', DEMO_MARKET_FALLBACK as MarketResponse);

  const marketData = data?.data || [];

  return (
    <div className="market-heatmap-section" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
        <SourceBadge source={source} />
      </div>

      <header style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Job market demand</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>{metadata.name}</p>
      </header>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          Loading market insights...
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>City</th>
                <th style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Demand Score</th>
                <th style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, textAlign: 'right' }}>Open Roles</th>
                <th style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, textAlign: 'right' }}>YoY Change</th>
              </tr>
            </thead>
            <tbody>
              {marketData.map((item, idx) => {
                const isPositive = item.yoy.startsWith('+');
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px 8px', fontWeight: 600 }}>{item.city}</td>
                    <td style={{ padding: '16px 8px', width: '40%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flexGrow: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${item.demand}%`, 
                            height: '100%', 
                            background: `linear-gradient(90deg, var(--profile-color)dd, var(--profile-color))`,
                            opacity: item.demand / 100 + 0.2,
                            borderRadius: '4px'
                          }} />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '30px' }}>{item.demand}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 500 }}>{item.jobs.toLocaleString()}</td>
                    <td style={{ 
                      padding: '16px 8px', 
                      textAlign: 'right', 
                      fontWeight: 700, 
                      color: isPositive ? '#22c55e' : '#ef4444' 
                    }}>
                      {item.yoy}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
