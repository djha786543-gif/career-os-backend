import React from 'react';
import { useProfile } from '../../context/ProfileContext';

interface Cert {
  name: string;
  issuer: string;
  status: 'Active' | 'In Progress' | 'Completed';
  earned?: string;
  renewal?: string;
  cpe_required?: number;
  cpe_earned?: number;
  target?: string;
  notes?: string;
  priority?: boolean;
}

const DJ_CERTS: Cert[] = [
  { name:'CISA', issuer:'ISACA', status:'Active', earned:'2018', renewal:'2027', cpe_required:120, cpe_earned:87 },
  { name:'AWS Cloud Practitioner', issuer:'Amazon', status:'Active', earned:'Feb 2026', renewal:'Feb 2029', notes:'Recently passed ✓' },
  { name:'Lean Six Sigma Black Belt', issuer:'ASQ', status:'Active', earned:'2020' },
  { name:'AAIA — AI Auditing', issuer:'ISACA', status:'In Progress', target:'Q2 2026', notes:'Priority', priority:true }
];

const POOJA_CERTS: Cert[] = [
  { name:'ASCP MB — Molecular Biology', issuer:'ASCP', status:'In Progress', target:'May 2026', notes:'Exam scheduled · Priority', priority:true },
  { name:'PhD — Cardiovascular/Molecular Biology', issuer:'University', status:'Completed', notes:'Postdoctoral level' },
  { name:'NIH Rigor & Reproducibility', issuer:'NIH', status:'Active', notes:'Required for NIH grants' },
  { name:'CITI Program — Human Subjects', issuer:'CITI', status:'Active', notes:'Research compliance' }
];

import { SourceBadge } from '../SourceBadge';

export function CertVault() {
  const { profile } = useProfile();
  const certs = profile === 'dj' ? DJ_CERTS : POOJA_CERTS;

  const getStatusStyles = (status: Cert['status']) => {
    switch (status) {
      case 'Active': return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' };
      case 'In Progress': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'Completed': return { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };
    }
  };

  return (
    <div className="cert-vault-section" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
        <SourceBadge source="static" />
      </div>
      <header style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Certification Vault</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>Verified credentials and active pursuits</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {certs.map((cert, idx) => {
          const styles = getStatusStyles(cert.status);
          const isPriority = cert.priority;

          return (
            <div key={idx} style={{ 
              padding: '20px', 
              borderRadius: '12px', 
              background: 'rgba(255,255,255,0.03)', 
              border: isPriority ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.05)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {isPriority && (
                <div style={{ 
                  position: 'absolute', 
                  top: '12px', 
                  right: '12px', 
                  background: '#eab308', 
                  color: '#1e1b4b', 
                  fontSize: '0.65rem', 
                  fontWeight: 800, 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>
                  Priority
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {cert.issuer}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{cert.name}</h3>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  color: styles.color, 
                  background: styles.bg, 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: styles.color }} />
                  {cert.status}
                </span>
                
                {cert.earned && (
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                    Earned {cert.earned}
                  </span>
                )}
              </div>

              {cert.cpe_required && cert.cpe_earned !== undefined && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>CPE Progress</span>
                    <span style={{ fontWeight: 700 }}>{cert.cpe_earned} / {cert.cpe_required}</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${(cert.cpe_earned / cert.cpe_required) * 100}%`, 
                      height: '100%', 
                      background: 'var(--profile-color)',
                      borderRadius: '2px'
                    }} />
                  </div>
                </div>
              )}

              {cert.target && (
                <div style={{ marginTop: 'auto', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Target Date</div>
                  <div style={{ fontWeight: 700, color: '#f59e0b' }}>{cert.target}</div>
                </div>
              )}

              {cert.notes && (
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                  {cert.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
