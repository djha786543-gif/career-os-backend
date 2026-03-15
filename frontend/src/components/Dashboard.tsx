import React from 'react';
import { NormalizedJob } from '../context/ProfileContext';

interface DashboardProps {
  activeId:    'dj' | 'pooja';
  jobs:        NormalizedJob[];
  nextRefresh: number; 
}

const StatCard = ({ label, value, sub, color, icon }: any) => (
  <div style={{ flex: 1, minWidth: 160, padding: '14px 18px', borderRadius: 12, background: color + '0d', border: `1px solid ${color}30`, display: 'flex', flexDirection: 'column', gap: 4 }}>
    <div style={{ fontSize: 18 }}>{icon}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 11, fontWeight: 700, color, opacity: .85, letterSpacing: '.04em' }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
  </div>
);

export function Dashboard({ activeId, jobs, nextRefresh }: DashboardProps) {
  const mins = Math.floor(nextRefresh / 60);
  const secs = nextRefresh % 60;

  if (activeId === 'dj') {
    const remoteLeads = jobs.filter(j => j.isRemote && j.fitScore >= 90).length;
    return (
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <StatCard icon="🎯" value={remoteLeads} label="REMOTE LEADS 90+" color="#22d3ee" />
        <StatCard icon="⚡" value={jobs.length ? Math.max(...jobs.map(j => j.fitScore)) + '%' : '0%'} label="TOP MATCH" color="#f59e0b" />
        <StatCard icon="⏱" value={`${mins}:${secs.toString().padStart(2, '0')}`} label="NEXT REFRESH" color="#6366f1" />
      </div>
    );
  }

  const acadCount = jobs.filter(j => j.category === 'ACADEMIA').length;
  const indCount = jobs.filter(j => j.category === 'INDUSTRY').length;

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
      <StatCard icon="🎓" value={acadCount} label="ACADEMIA" color="#a855f7" />
      <StatCard icon="🏭" value={indCount} label="INDUSTRY" color="#06b6d4" />
      <StatCard icon="⏱" value={`${mins}:${secs.toString().padStart(2, '0')}`} label="NEXT REFRESH" color="#f472b6" />
    </div>
  );
}
