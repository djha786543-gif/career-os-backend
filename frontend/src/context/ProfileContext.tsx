import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'

export type ProfileId = 'dj' | 'pooja'

export interface NormalizedJob {
  id: string
  title: string
  company: string
  location: string
  isRemote: boolean
  workMode: 'Remote' | 'Hybrid' | 'On-site'
  salary: string | null
  snippet: string
  applyUrl: string
  postedDate: string
  fitScore: number        // 1-100
  fitReason: string       // one sentence
  keySkills: string[]     // up to 4
  category?: 'INDUSTRY' | 'ACADEMIA'  // Pooja only
  eyConnection?: boolean  // true = EY alumni advantage signal
  source: 'live' | 'demo'
}

export interface TrackerCard {
  id: string
  title: string
  company: string
  applyUrl: string
  column: string
  eyConnection?: boolean
  savedDate: string
}

interface ProfileState {
  jobs: NormalizedJob[]
  totalResults: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  aiResults: Record<string, string>
  page: number
  searchKeywords: string
  selectedCountry: string
  activeCategory: 'all' | 'INDUSTRY' | 'ACADEMIA'
  trackerCards: Record<string, TrackerCard[]>
  lastJobIds: Set<string>
}

interface ProfileContextValue {
  profile: ProfileId
  setProfile: (p: ProfileId) => void
  state: ProfileState
  setState: (updates: Partial<ProfileState>) => void
  resetProfileState: () => void
  metadata: {
    name: string
    role: string
    initials: string
    color: string
  }
}

const defaultState = (): ProfileState => ({
  jobs: [],
  totalResults: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
  aiResults: {},
  page: 0,
  searchKeywords: '',
  selectedCountry: 'usa',
  activeCategory: 'all',
  trackerCards: {},
  lastJobIds: new Set()
})

const METADATA: Record<ProfileId, { name: string, role: string, initials: string, color: string }> = {
  dj: { name: 'Deobrat Jha', role: 'IT Audit Manager', initials: 'DJ', color: '#22D3EE' },
  pooja: { name: 'Pooja Jha', role: 'Postdoctoral Researcher', initials: 'PJ', color: '#F472B6' }
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileRaw] = useState<ProfileId>('dj')
  const [states, setStates] = useState<Record<ProfileId, ProfileState>>({
    dj: defaultState(),
    pooja: defaultState()
  })

  const state = states[profile]

  const setState = useCallback((updates: Partial<ProfileState>) => {
    setStates(prev => ({
      ...prev,
      [profile]: { ...prev[profile], ...updates }
    }))
  }, [profile])

  const setProfile = useCallback((p: ProfileId) => {
    setProfileRaw(p)
  }, [])

  const resetProfileState = useCallback(() => {
    setStates(prev => ({
      ...prev,
      [profile]: defaultState()
    }))
  }, [profile])

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--accent-active', 
      profile === 'dj' ? '#22D3EE' : '#F472B6'
    )
    document.documentElement.style.setProperty(
      '--profile-color', 
      profile === 'dj' ? '#22D3EE' : '#F472B6'
    )
  }, [profile])

  return (
    <ProfileContext.Provider value={{ 
      profile, 
      setProfile, 
      state, 
      setState, 
      resetProfileState,
      metadata: METADATA[profile]
    }}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = () => {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
