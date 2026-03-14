import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ProfileId = 'dj' | 'pj';

export interface ProfileMetadata {
  name: string;
  role: string;
  initials: string;
  color: string;
}

export const PROFILE_METADATA: Record<ProfileId, ProfileMetadata> = {
  dj: { name: 'Deobrat Jha', role: 'IT Audit Manager', initials: 'DJ', color: '#0F6E56' },
  pj: { name: 'Pooja Jha', role: 'Postdoctoral Researcher · Cardiovascular Biology', initials: 'PJ', color: '#534AB7' }
};

interface ProfileContextValue {
  profile: ProfileId;
  setProfile: (profile: ProfileId) => void;
  metadata: ProfileMetadata;
  cacheVersion: number;
  refresh: () => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<ProfileId>('dj');
  const [cacheVersion, setCacheVersion] = useState(0);

  const setProfile = (newProfile: ProfileId) => {
    if (newProfile !== profile) {
      setProfileState(newProfile);
      setCacheVersion(prev => prev + 1);
    }
  };

  const refresh = () => setCacheVersion(prev => prev + 1);

  // Sync theme color to CSS variable for dynamic styling
  useEffect(() => {
    document.documentElement.style.setProperty('--profile-color', PROFILE_METADATA[profile].color);
  }, [profile]);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, metadata: PROFILE_METADATA[profile], cacheVersion, refresh }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
