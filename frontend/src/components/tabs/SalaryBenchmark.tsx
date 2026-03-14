import React from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useFetch } from '../../hooks/useFetch';
import { DEMO_SALARY_FALLBACK } from '../../data/fallbacks';
import { SourceBadge } from '../SourceBadge';

interface SalaryData {
  title: string;
  low: number;
  mid: number;
  high: number;
  remote_premium: string;
}

interface SalaryResponse {
  data: SalaryData[];
  source: string;
}

export function SalaryBenchmark() {
  const { profile, metadata } = useProfile();
  const { data, loading, source } = useFetch<SalaryResponse>('/api/salary', DEMO_SALARY_FALLBACK as SalaryResponse);

  const salaryData = data?.data || [];
  const sectionTitle = profile === 'dj' ? 'IT Audit salary ranges' : 'Life sciences salary ranges';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getPercentage = (val: number, min: number, max: number) => {
    return ((val - min) / (max - min)) * 100;
  };

  // Find global min/max for scale consistency
  const allValues = salaryData.flatMap(d => [d.low, d.high]);
  const globalMin = Math.min(...allValues) * 0.9;
  const globalMax = Math.max(...allValues) * 1.1;

  return (
    <div className="salary-intel-section" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
        <SourceBadge source={source} />
      </div>

      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{sectionTitle}</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>Current market benchmarks for {metadata.role}</p>
      </header>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          Analyzing salary data...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {salaryData.map((item, idx) => {
            const lowPct = getPercentage(item.low, globalMin, globalMax);
            const highPct = getPercentage(item.high, globalMin, globalMax);
            const midPct = getPercentage(item.mid, globalMin, globalMax);
            
            const isRemotePositive = item.remote_premium !== 'N/A' && !item.remote_premium.startsWith('-');

            return (
              <div key={idx} style={{ 
                paddingBottom: '24px', 
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 120px',
                gap: '24px',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>{item.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>ANNUAL TOTAL COMP</div>
                </div>

                <div style={{ position: 'relative', height: '40px', display: 'flex', alignItems: 'center' }}>
                  {/* Range Bar */}
                  <div style={{ 
                    position: 'absolute', 
                    left: `${lowPct}%`, 
                    width: `${highPct - lowPct}%`, 
                    height: '6px', 
                    background: 'var(--profile-color)', 
                    borderRadius: '3px',
                    opacity: 0.3
                  }} />
                  
                  {/* Low point */}
                  <div style={{ position: 'absolute', left: `${lowPct}%`, textAlign: 'center', transform: 'translateX(-50%)' }}>
                     <div style={{ width: '10px', height: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', margin: '0 auto 4px' }} />
                     <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{formatCurrency(item.low)}</div>
                  </div>

                  {/* High point */}
                  <div style={{ position: 'absolute', left: `${highPct}%`, textAlign: 'center', transform: 'translateX(-50%)' }}>
                     <div style={{ width: '10px', height: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', margin: '0 auto 4px' }} />
                     <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{formatCurrency(item.high)}</div>
                  </div>

                  {/* Mid point (Bold) */}
                  <div style={{ position: 'absolute', left: `${midPct}%`, textAlign: 'center', transform: 'translateX(-50%)' }}>
                     <div style={{ width: '4px', height: '14px', background: 'var(--profile-color)', borderRadius: '2px', margin: '0 auto 2px', boxShadow: '0 0 10px var(--profile-color)' }} />
                     <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: 800 }}>{formatCurrency(item.mid)}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    display: 'inline-block',
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    background: isRemotePositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)', 
                    color: isRemotePositive ? '#22c55e' : 'rgba(255,255,255,0.4)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: isRemotePositive ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {item.remote_premium === 'N/A' ? 'NO REMOTE PREM.' : `${item.remote_premium} REMOTE`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
