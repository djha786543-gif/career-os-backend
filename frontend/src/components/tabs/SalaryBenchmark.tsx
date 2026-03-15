import React, { useEffect, useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { api } from '../../config/api';

export function SalaryBenchmark() {
  const { profile, metadata } = useProfile();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalary = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/market/salary?profile=${profile}`);
        setData(res.data);
      } catch (err) {
        console.error('Salary load failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSalary();
  }, [profile]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="glass" style={{ padding: '24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>SALARY BENCHMARKS / <span style={{ color: 'var(--accent-active)' }}>{profile.toUpperCase()}</span></h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>Current market total compensation for {metadata.role}</p>
      </header>

      {loading ? (
        <div className="spinner" style={{ margin: '40px auto' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {data.map((item, idx) => (
            <div key={idx} style={{ 
              paddingBottom: '20px', 
              borderBottom: '1px solid var(--border-subtle)',
              display: 'grid',
              gridTemplateColumns: '1fr 2fr 120px',
              gap: '24px',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{item.title}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800 }}>ANNUAL TOTAL COMP</div>
              </div>

              <div style={{ position: 'relative', height: '30px', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', left: '0', width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }} />
                <div style={{ position: 'absolute', left: '20%', width: '60%', height: '4px', background: 'var(--accent-active)', opacity: 0.3, borderRadius: '2px' }} />
                <div style={{ position: 'absolute', left: '20%', fontSize: '10px', color: 'var(--text-muted)', bottom: -15 }}>{formatCurrency(item.low || 80000)}</div>
                <div style={{ position: 'absolute', left: '50%', fontSize: '12px', color: 'white', fontWeight: 800, top: -15, transform: 'translateX(-50%)' }}>{formatCurrency(item.mid || 120000)}</div>
                <div style={{ position: 'absolute', left: '80%', fontSize: '10px', color: 'var(--text-muted)', bottom: -15, transform: 'translateX(-100%)' }}>{formatCurrency(item.high || 160000)}</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  display: 'inline-block',
                  padding: '4px 10px', 
                  borderRadius: '8px', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  color: '#10b981',
                  fontSize: '10px',
                  fontWeight: 800,
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  +12% REMOTE
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
