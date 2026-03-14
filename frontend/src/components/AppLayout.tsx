import React from 'react';
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
  const { profile: activeProfile, setProfile, metadata } = useProfile();

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', background: '#0a0b14', color: 'white' }}>
      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          {/* Brand */}
          <div style={styles.brand}>
            CAREER<span style={{ color: 'var(--profile-color, #6366f1)' }}>OS</span>
          </div>

          {/* Profile toggle */}
          <div style={styles.profileSwitch}>
            <button
              onClick={() => setProfile('dj')}
              style={{
                ...styles.psw,
                background: activeProfile === 'dj' ? '#0F6E56' : 'transparent',
                color: activeProfile === 'dj' ? 'white' : 'rgba(255,255,255,0.4)',
                border: activeProfile === 'dj' ? '1px solid #0F6E56' : '1px solid rgba(255,255,255,0.1)',
                boxShadow: activeProfile === 'dj' ? '0 0 15px rgba(15,110,86,0.4)' : 'none',
              }}
            >
              DJ
            </button>
            <button
              onClick={() => setProfile('pj')}
              style={{
                ...styles.psw,
                background: activeProfile === 'pj' ? '#534AB7' : 'transparent',
                color: activeProfile === 'pj' ? 'white' : 'rgba(255,255,255,0.4)',
                border: activeProfile === 'pj' ? '1px solid #534AB7' : '1px solid rgba(255,255,255,0.1)',
                boxShadow: activeProfile === 'pj' ? '0 0 15px rgba(83,74,183,0.4)' : 'none',
              }}
            >
              PJ
            </button>
          </div>

          {/* User pill */}
          <div style={styles.userPill}>
            <div style={{
              ...styles.avatar,
              background: metadata.color + '22',
              border: `1.5px solid ${metadata.color}44`,
              color: metadata.color,
            }}>
              {metadata.initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={styles.userName}>{metadata.name}</div>
              <div style={styles.userTitle}>{metadata.role}</div>
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
                  color:      activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.4)',
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                  borderColor:activeTab === tab.id ? 'var(--profile-color)' : 'transparent',
                }}
              >
                <span style={{ marginRight: 6 }}>{tab.icon}</span>{tab.label}
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

const styles: Record<string, React.CSSProperties> = {
  header: {
    position:       'sticky',
    top:            0,
    zIndex:         100,
    background:     'rgba(10,11,20,0.8)',
    backdropFilter: 'blur(20px)',
    borderBottom:   '1px solid rgba(255,255,255,0.05)',
  },
  headerInner: {
    display:       'flex',
    alignItems:    'center',
    gap:           24,
    height:        72,
    maxWidth:      1400,
    margin:        '0 auto',
    padding:       '0 24px',
  },
  brand: {
    fontSize:      18,
    fontWeight:    900,
    letterSpacing: '0.1em',
    color:         'white',
    flexShrink:    0,
  },
  profileSwitch: {
    display:       'flex',
    gap:           8,
    background:    'rgba(255,255,255,0.03)',
    borderRadius:  12,
    padding:       4,
    border:        '1px solid rgba(255,255,255,0.05)',
    flexShrink:    0,
  },
  psw: {
    padding:       '6px 16px',
    borderRadius:  8,
    fontSize:      12,
    fontWeight:    800,
    transition:    'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor:        'pointer',
  },
  userPill: {
    display:    'flex',
    alignItems: 'center',
    gap:        12,
    flexShrink: 0,
    padding:    '0 16px',
    borderLeft: '1px solid rgba(255,255,255,0.05)',
  },
  avatar: {
    width:         38,
    height:        38,
    borderRadius:  '50%',
    display:       'flex',
    alignItems:    'center',
    justifyContent:'center',
    fontSize:      13,
    fontWeight:    800,
  },
  userName:  { fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' },
  userTitle: { fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' },
  navTabs: {
    display:    'flex',
    gap:        4,
    marginLeft: 'auto',
    overflowX:  'auto',
    padding:    '4px 0',
    scrollbarWidth: 'none',
  },
  ntab: {
    padding:       '8px 16px',
    borderRadius:  10,
    fontSize:      12,
    fontWeight:    700,
    cursor:        'pointer',
    transition:    'all 0.2s',
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
    maxWidth: 1400,
    margin:   '0 auto',
    padding:  '32px 24px 80px',
  },
};
