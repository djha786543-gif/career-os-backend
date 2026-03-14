import React, { useState } from 'react';
import { useProfile, ProfileId } from '../context/ProfileContext';

export type TabId =
  | 'job-hub'
  | 'prep-vault'
  | 'heatmap'
  | 'skill-engine'
  | 'cert-vault'
  | 'trend-radar'
  | 'salary'
  | 'study-plan'
  | 'tracker';

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'job-hub',      icon: '💼', label: 'Job Hub'         },
  { id: 'prep-vault',   icon: '📚', label: 'Prep Vault'      },
  { id: 'heatmap',      icon: '🔥', label: 'Market Heatmap'  },
  { id: 'skill-engine', icon: '⚡', label: 'Skill Engine'    },
  { id: 'cert-vault',   icon: '🏆', label: 'Cert Vault'      },
  { id: 'trend-radar',  icon: '📡', label: 'Trend Radar'     },
  { id: 'salary',       icon: '💰', label: 'Salary Intel'    },
  { id: 'study-plan',   icon: '🗓️', label: 'Study Plan'      },
  { id: 'tracker',      icon: '📋', label: 'Tracker'         },
];

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: React.ReactNode;
}

export function AppLayout({ activeTab, onTabChange, children }: Props) {
  const { activeId, profile, theme, setActiveId } = useProfile();

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          {/* Brand */}
          <div style={styles.brand}>
            CAREER<span style={{ color: 'var(--accent-indigo)' }}>OS</span>
          </div>

          {/* Profile toggle */}
          <div style={styles.profileSwitch}>
            <button
              onClick={() => setActiveId('dj')}
              style={{
                ...styles.psw,
                color:      activeId === 'dj' ? '#22d3ee' : 'var(--text-muted)',
                background: activeId === 'dj' ? 'rgba(34,211,238,.12)' : 'transparent',
                boxShadow:  activeId === 'dj' ? '0 0 0 1px rgba(34,211,238,.3)' : 'none',
              }}
            >
              DJ
            </button>
            <button
              onClick={() => setActiveId('pj')}
              style={{
                ...styles.psw,
                color:      activeId === 'pj' ? '#f472b6' : 'var(--text-muted)',
                background: activeId === 'pj' ? 'rgba(244,114,182,.12)' : 'transparent',
                boxShadow:  activeId === 'pj' ? '0 0 0 1px rgba(244,114,182,.3)' : 'none',
              }}
            >
              PJ
            </button>
          </div>

          {/* User pill */}
          <div style={styles.userPill}>
            <div style={{
              ...styles.avatar,
              background: theme.dim,
              border: `1.5px solid ${theme.border}`,
              color: theme.glow,
            }}>
              {profile.initials}
            </div>
            <div>
              <div style={styles.userName}>{profile.name}</div>
              <div style={styles.userTitle}>{profile.title}</div>
            </div>
          </div>

          {/* Tab navigation */}
          <nav style={styles.navTabs}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  ...styles.ntab,
                  color:      activeTab === tab.id ? theme.glow : 'var(--text-muted)',
                  background: activeTab === tab.id ? theme.dim   : 'transparent',
                  borderColor:activeTab === tab.id ? theme.border: 'transparent',
                }}
              >
                <span style={{ marginRight: 4 }}>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Main content ── */}
      <main style={styles.main}>
        <div style={styles.wrap}>
          {children}
        </div>
      </main>
    </div>
  );
}

// ── Inline styles (mirrors tokens.css) ────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  header: {
    position:       'sticky',
    top:            0,
    zIndex:         100,
    background:     'rgba(10,11,20,.92)',
    backdropFilter: 'blur(16px)',
    borderBottom:   '1px solid var(--border-subtle)',
  },
  headerInner: {
    display:       'flex',
    alignItems:    'center',
    gap:           16,
    height:        64,
    maxWidth:      1280,
    margin:        '0 auto',
    padding:       '0 24px',
  },
  brand: {
    fontSize:      15,
    fontWeight:    800,
    letterSpacing: '.08em',
    color:         'var(--text-secondary)',
    flexShrink:    0,
  },
  profileSwitch: {
    display:       'flex',
    gap:           4,
    background:    'var(--bg-secondary)',
    borderRadius:  10,
    padding:       4,
    border:        '1px solid var(--border-subtle)',
    flexShrink:    0,
  },
  psw: {
    padding:       '5px 16px',
    borderRadius:  7,
    fontSize:      12,
    fontWeight:    700,
    letterSpacing: '.04em',
    transition:    'all .2s',
    cursor:        'pointer',
  },
  userPill: {
    display:    'flex',
    alignItems: 'center',
    gap:        10,
    flexShrink: 0,
  },
  avatar: {
    width:         34,
    height:        34,
    borderRadius:  '50%',
    display:       'flex',
    alignItems:    'center',
    justifyContent:'center',
    fontSize:      12,
    fontWeight:    800,
  },
  userName:  { fontSize: 13, fontWeight: 700 },
  userTitle: { fontSize: 10, color: 'var(--text-muted)' },
  navTabs: {
    display:    'flex',
    gap:        2,
    marginLeft: 'auto',
    overflowX:  'auto',
  },
  ntab: {
    padding:       '7px 14px',
    borderRadius:  8,
    fontSize:      11,
    fontWeight:    600,
    cursor:        'pointer',
    transition:    'all .2s',
    whiteSpace:    'nowrap',
    border:        '1px solid transparent',
    display:       'flex',
    alignItems:    'center',
  },
  main: {
    position: 'relative',
    zIndex:   1,
  },
  wrap: {
    maxWidth: 1280,
    margin:   '0 auto',
    padding:  '28px 24px 60px',
  },
};
