import React from 'react';
import { useProfile, ProfileId } from '../context/ProfileContext';

export type TabId =
  | 'heatmap'
  | 'skill-engine'
  | 'cert-vault'
  | 'learning-tracks'
  | 'trend-radar'
  | 'prep-vault'
  | 'job-hub'
  | 'tracker'
  | 'opportunity-monitor';

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'heatmap',         icon: '📡', label: 'Market Heatmap'  },
  { id: 'skill-engine',    icon: '🤖', label: 'AI Skill Engine' },
  { id: 'cert-vault',      icon: '🏆', label: 'Cert Vault'      },
  { id: 'learning-tracks', icon: '📚', label: 'Learning Tracks' },
  { id: 'trend-radar',     icon: '📈', label: 'Trend Radar'     },
  { id: 'prep-vault',      icon: '📖', label: 'Prep Vault'      },
  { id: 'job-hub',         icon: '💼', label: 'Job Hub'         },
  { id: 'tracker',         icon: '📋', label: 'Tracker'         },
  { id: 'opportunity-monitor', icon: '🔬', label: 'Opportunity Monitor' },
];

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: React.ReactNode;
}

export function AppLayout({ activeTab, onTabChange, children }: Props) {
  const { profile: activeProfile, setProfile, metadata } = useProfile();

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: activeProfile === 'dj' ? '#001E2B' : '#1A0020', color: 'white', transition: 'background 0.5s ease' }}>
      <div className="amb">
        <div className="orb o1" />
        <div className="orb o2" />
        <div className="orb o3" />
      </div>

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brand}>
            CAREER<span style={{ color: 'var(--accent-active)' }}>_OS</span> / MARKET INTEL
          </div>

          <div style={styles.profileSwitch}>
            <button
              onClick={() => setProfile('dj')}
              style={{
                ...styles.psw,
                background: activeProfile === 'dj' ? '#22D3EE' : 'transparent',
                color: activeProfile === 'dj' ? '#000' : 'rgba(255,255,255,0.4)',
                border: '1px solid ' + (activeProfile === 'dj' ? '#22D3EE' : 'rgba(255,255,255,0.1)'),
              }}
            >
              ⚡ DJ
            </button>
            <button
              onClick={() => setProfile('pooja')}
              style={{
                ...styles.psw,
                background: activeProfile === 'pooja' ? '#F472B6' : 'transparent',
                color: activeProfile === 'pooja' ? '#000' : 'rgba(255,255,255,0.4)',
                border: '1px solid ' + (activeProfile === 'pooja' ? '#F472B6' : 'rgba(255,255,255,0.1)'),
              }}
            >
              🔬 POOJA
            </button>
          </div>

          <div style={styles.userPill}>
            <div style={{
              ...styles.avatar,
              background: metadata.color,
              color: '#000',
            }}>
              {metadata.initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={styles.userName}>{metadata.name}</div>
              <div style={styles.userTitle}>{metadata.role}</div>
            </div>
          </div>

          <nav style={styles.navTabs}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  ...styles.ntab,
                  color:      activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.4)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--accent-active)' : '2px solid transparent',
                  borderRadius: 0,
                }}
              >
                <span style={{ marginRight: 6 }}>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

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
    background:     'rgba(0,0,0,0.3)',
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
    fontSize:      16,
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
    fontSize:      11,
    fontWeight:    800,
    transition:    'all 0.3s ease',
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
    width:         32,
    height:        32,
    borderRadius:  '50%',
    display:       'flex',
    alignItems:    'center',
    justifyContent:'center',
    fontSize:      12,
    fontWeight:    800,
  },
  userName:  { fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' },
  userTitle: { fontSize: 10, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' },
  navTabs: {
    display:    'flex',
    gap:        4,
    marginLeft: 'auto',
    height: '100%',
  },
  ntab: {
    padding:       '0 12px',
    fontSize:      11,
    fontWeight:    700,
    cursor:        'pointer',
    transition:    'all 0.2s',
    whiteSpace:    'nowrap',
    background: 'transparent',
    border: 'none',
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
