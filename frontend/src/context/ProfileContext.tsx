import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PROFILES, Profile } from '../data/profiles';
import { PREP_VAULT, PrepVaultProfile } from '../data/prepVault';

export type ProfileId = 'dj' | 'pj';

// Maps frontend profile ID to backend candidate ID
export const BACKEND_ID: Record<ProfileId, string> = {
  dj: 'deobrat',
  pj: 'pooja',
};

const THEME: Record<ProfileId, { glow: string; dim: string; border: string; label: string }> = {
  dj: { glow: '#22d3ee', dim: 'rgba(34,211,238,.15)', border: 'rgba(34,211,238,.35)', label: 'DJ' },
  pj: { glow: '#f472b6', dim: 'rgba(244,114,182,.15)', border: 'rgba(244,114,182,.35)', label: 'PJ' },
};

interface ProfileContextValue {
  activeId:      ProfileId;
  profile:       Profile;
  vault:         PrepVaultProfile;
  theme:         typeof THEME[ProfileId];
  setActiveId:   (id: ProfileId) => void;
  toggle:        () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveIdState] = useState<ProfileId>('dj');

  // Apply CSS variables whenever the active profile changes
  const applyTheme = useCallback((id: ProfileId) => {
    const t = THEME[id];
    const root = document.documentElement;
    root.style.setProperty('--active-glow',   t.glow);
    root.style.setProperty('--active-dim',    t.dim);
    root.style.setProperty('--active-border', t.border);
    root.style.setProperty('--active-color',  t.glow);
  }, []);

  useEffect(() => { applyTheme(activeId); }, [activeId, applyTheme]);

  const setActiveId = useCallback((id: ProfileId) => {
    setActiveIdState(id);
  }, []);

  const toggle = useCallback(() => {
    setActiveIdState(prev => prev === 'dj' ? 'pj' : 'dj');
  }, []);

  const value: ProfileContextValue = {
    activeId,
    profile: PROFILES[activeId],
    vault:   PREP_VAULT[activeId],
    theme:   THEME[activeId],
    setActiveId,
    toggle,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
