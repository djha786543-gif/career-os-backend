import React from 'react';

type SourceType = 'indeed' | 'adzuna' | 'claude' | 'static' | 'demo' | string;

interface SourceBadgeProps {
  source: SourceType | null;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source }) => {
  let color = '#94a3b8'; // default gray
  let label = source || 'Unknown';

  if (source === 'indeed' || source === 'adzuna' || source === 'claude' || source === 'hybrid') {
    color = '#22c55e'; // green
    label = 'Live';
  } else if (source === 'static') {
    color = '#3b82f6'; // blue
    label = 'Curated';
  } else if (source === 'demo') {
    color = '#eab308'; // yellow
    label = 'Demo';
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '20px',
      backgroundColor: 'rgba(255,255,255,0.05)',
      border: `1px solid ${color}44`,
      fontSize: '0.75rem',
      fontWeight: 600,
      color: color,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 8px ${color}`
      }} />
      {label}
    </div>
  );
};
