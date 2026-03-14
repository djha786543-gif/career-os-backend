import React, { useState, useEffect, useMemo } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useFetch } from '../../hooks/useFetch';
import { DEMO_JOBS_FALLBACK } from '../../data/fallbacks';
import { SourceBadge } from '../SourceBadge';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  snippet: string;
  applyUrl: string;
  fitScore: number;
  workMode: string;
  isRemote: boolean;
  postedDate: string;
  keySkills: string[];
}

interface JobsResponse {
  jobs: Job[];
  source: string;
  totalResults: number;
}

const SkeletonCard = () => (
  <div className="skeleton-card" style={{
    padding: '24px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    marginBottom: '16px',
    height: '200px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }}>
    <div className="skeleton-line" style={{ width: '70%', height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
    <div className="skeleton-line" style={{ width: '40%', height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
    <div className="skeleton-line" style={{ width: '90%', height: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', marginTop: '8px' }} />
    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
       <div style={{ width: '60px', height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }} />
       <div style={{ width: '60px', height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }} />
    </div>
  </div>
);

export function JobHub() {
  const { profile, cacheVersion, refresh } = useProfile();
  const { data, loading, source } = useFetch<JobsResponse>('/api/jobs', DEMO_JOBS_FALLBACK as JobsResponse);
  
  const [filter, setFilter] = useState<'all' | 'remote' | 'near'>('all');
  const [timeLeft, setTimeLeft] = useState(45 * 60);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 45 * 60));
    }, 1000);
    return () => clearInterval(timer);
  }, [cacheVersion]); // Reset when cacheVersion changes (manual refresh)

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const jobs = data?.jobs || [];
  
  const filteredJobs = useMemo(() => {
    let result = jobs;
    if (filter === 'remote') {
      result = jobs.filter(j => j.isRemote || j.location.toLowerCase().includes('remote'));
    } else if (filter === 'near') {
      result = jobs.filter(j => 
        j.location.includes('CA') || 
        j.location.toLowerCase().includes('los angeles') || 
        j.location.toLowerCase().includes('torrance')
      );
    }
    
    if (result.length === 0 && filter !== 'all') {
      return { list: jobs, empty: true };
    }
    return { list: result, empty: false };
  }, [jobs, filter]);

  const handleRefresh = () => {
    refresh();
    setTimeLeft(45 * 60);
  };

  return (
    <div className="job-hub-section" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Job Hub</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
            {loading ? 'Searching live listings...' : `${filteredJobs.list.length} jobs found · `}
            {!loading && <SourceBadge source={source} />}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>REFRESH IN</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--profile-color)' }}>{formatTime(timeLeft)}</div>
          </div>
          <button 
            onClick={handleRefresh}
            style={{ 
              padding: '10px 16px', 
              borderRadius: '8px', 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button 
          onClick={() => setFilter('all')}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '20px', 
            background: filter === 'all' ? 'var(--profile-color)' : 'rgba(255,255,255,0.05)',
            border: 'none',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          All
        </button>
        <button 
          onClick={() => setFilter('remote')}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '20px', 
            background: filter === 'remote' ? 'var(--profile-color)' : 'rgba(255,255,255,0.05)',
            border: 'none',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Remote Only
        </button>
        <button 
          onClick={() => setFilter('near')}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '20px', 
            background: filter === 'near' ? 'var(--profile-color)' : 'rgba(255,255,255,0.05)',
            border: 'none',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Near me (15mi)
        </button>
      </div>

      {filteredJobs.empty && (
        <p style={{ color: '#eab308', marginBottom: '16px', fontSize: '0.9rem' }}>
          No matches — showing all
        </p>
      )}

      <div className="job-grid">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          filteredJobs.list.map(job => (
            <div key={job.id} style={{
              padding: '24px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              marginBottom: '16px',
              position: 'relative',
              transition: 'transform 0.2s, background 0.2s',
            }} className="job-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <a 
                  href={job.applyUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', textDecoration: 'none' }}
                >
                  {job.title}
                </a>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{job.postedDate}</span>
              </div>
              
              <div style={{ marginTop: '4px', color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
                {job.company} • {job.location}
              </div>

              {job.salary && job.salary !== 'Not disclosed' && (
                <div style={{ marginTop: '8px', color: '#22c55e', fontWeight: 600, fontSize: '0.9rem' }}>
                  {job.salary}
                </div>
              )}

              <p style={{ marginTop: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {job.snippet}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(job.keySkills || []).map(skill => (
                    <span key={skill} style={{ 
                      padding: '4px 10px', 
                      borderRadius: '4px', 
                      background: 'rgba(255,255,255,0.05)', 
                      fontSize: '0.75rem', 
                      color: 'rgba(255,255,255,0.6)' 
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
                <a 
                  href={job.applyUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '6px', 
                    background: 'var(--profile-color)', 
                    color: 'white', 
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '0.9rem'
                  }}
                >
                  Apply →
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
