import React, { useState, useEffect } from 'react';
import { API_BASE } from '../utils/api';

interface HealthResponse {
  status: string;
  env: {
    anthropic: boolean;
    adzuna: boolean;
  };
}

export function HealthBanner() {
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const dismissed = sessionStorage.getItem('health_banner_dismissed');
    if (dismissed) return;

    fetch(`${API_BASE}/health`)
      .then(r => r.json())
      .then((data: HealthResponse) => {
        let issues = [];
        if (data.env.anthropic === false) issues.push("Job engine running in offline mode — ANTHROPIC_API_KEY not set in Railway");
        if (data.env.adzuna === false) issues.push("+ Adzuna fallback also unavailable — set ADZUNA_APP_ID and ADZUNA_APP_KEY");
        
        if (issues.length > 0) {
          setMsg(issues.join(' '));
          setShow(true);
        }
      })
      .catch(err => console.error('Health check failed', err));
  }, []);

  if (!show) return null;

  return (
    <div style={{
      background: '#fef3c7',
      color: '#92400e',
      padding: '10px 40px 10px 20px',
      fontSize: '13px',
      fontWeight: 600,
      textAlign: 'center',
      position: 'relative',
      zIndex: 2000,
      borderBottom: '1px solid #fde68a'
    }}>
      <span style={{ marginRight: '8px' }}>⚠️</span>
      {msg}
      <button 
        onClick={() => {
          setShow(false);
          sessionStorage.setItem('health_banner_dismissed', 'true');
        }}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          fontSize: '18px',
          cursor: 'pointer',
          color: '#92400e',
          padding: '4px'
        }}
      >
        ✕
      </button>
    </div>
  );
}
