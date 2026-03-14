import React from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useFetch } from '../../hooks/useFetch';
import { DEMO_SKILLS_FALLBACK } from '../../data/fallbacks';
import { SourceBadge } from '../SourceBadge';

interface SkillsResponse {
  skills: {
    current: Record<string, number>;
    gaps: string[];
    target_roles: string[];
  };
  source: string;
}

export function SkillEngine() {
  const { data, loading, source } = useFetch<SkillsResponse>('/api/skills', DEMO_SKILLS_FALLBACK as SkillsResponse);

  const skills = data?.skills || { current: {}, gaps: [], target_roles: [] };
  const currentSkills = Object.entries(skills.current).sort((a, b) => b[1] - a[1]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e'; // green
    if (score >= 50) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="skill-engine-section" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
        <SourceBadge source={source} />
      </div>

      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Skill Engine</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>Targeting: {skills.target_roles.join(' · ')}</p>
      </header>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          Benchmarking skills...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
          {/* Panel A — Current skill scores */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Current Proficiency
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {currentSkills.map(([name, score]) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
                    <span>{name}</span>
                    <span style={{ color: getScoreColor(score) }}>{score}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${score}%`, 
                      height: '100%', 
                      background: getScoreColor(score),
                      borderRadius: '4px',
                      boxShadow: `0 0 10px ${getScoreColor(score)}44`
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel B — Skill gaps */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>
              Skill Gaps
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {skills.gaps.map((gap, idx) => (
                <div key={idx} style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 600 }}>{gap}</span>
                  <a 
                    href={`https://www.google.com/search?q=learn+${encodeURIComponent(gap)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      fontSize: '0.85rem', 
                      color: 'var(--profile-color)', 
                      textDecoration: 'none',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--profile-color)33',
                      background: 'var(--profile-color)11'
                    }}
                  >
                    → Learn
                  </a>
                </div>
              ))}
              
              <div style={{ 
                marginTop: '12px', 
                padding: '16px', 
                borderRadius: '12px', 
                background: 'rgba(245, 158, 11, 0.05)', 
                border: '1px dashed rgba(245, 158, 11, 0.2)',
                fontSize: '0.85rem',
                color: '#f59e0b'
              }}>
                <strong>Pro tip:</strong> Closing these gaps will increase your match score for {skills.target_roles[0]} roles by approx. 15-20%.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
