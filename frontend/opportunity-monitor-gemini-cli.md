# Opportunity Monitor — Gemini CLI Frontend Prompt
# New isolated page for Pooja's research job monitoring
# Run AFTER Claude Code backend is deployed and verified

---

## CONTEXT — READ BEFORE WRITING ANY CODE

The backend Opportunity Monitor API is already live at:
https://career-os-backend-production.up.railway.app

New endpoints available:
- GET /api/monitor/stats
- GET /api/monitor/orgs?sector=academia|industry|international|india
- GET /api/monitor/jobs?sector=academia&isNew=true&limit=50
- POST /api/monitor/scan (trigger manual scan)
- POST /api/monitor/mark-seen (clear new badges)

This is a NEW isolated page. Do NOT modify:
- Any existing tab components
- AppLayout.tsx tab list (add monitor as extra nav item)
- ProfileContext.tsx
- Any existing API calls

This page is Pooja-profile specific.
Show it only when profile === 'pj' OR always visible
as a standalone navigation item labeled "🔬 Opportunity Monitor"

---

## STEP 0 — AUDIT EXISTING FRONTEND

Read the current frontend structure:
- pages/index.tsx — current tab routing
- src/components/AppLayout.tsx — current nav
- src/components/tabs/ — existing components

Do not modify any existing files except:
1. Add 'opportunity-monitor' to TabId in AppLayout.tsx
2. Add nav item to TABS array in AppLayout.tsx
3. Add import + route in pages/index.tsx

---

## STEP 1 — CREATE THE MAIN COMPONENT

Create: src/components/tabs/OpportunityMonitor.tsx

This is a full-featured monitoring dashboard with 4 tabs.

### Overall layout:

```
┌─────────────────────────────────────────────────────┐
│ 🔬 Opportunity Monitor                              │
│ Real-time job alerts from 55 target organizations   │
│                                                     │
│ [Last scan: 2 hours ago] [▶ Scan Now] [✓ Mark Seen]│
│                                                     │
│ ┌──────────┬──────────┬──────────────┬────────────┐ │
│ │🏛️ Academia│🏭Industry │🌍International│🇮🇳 India   │ │
│ │  (12)    │   (8)   │    (5)       │   (3) NEW  │ │
│ └──────────┴──────────┴──────────────┴────────────┘ │
│                                                     │
│ [🔴 New Only toggle] [Sort: Newest first ▼]        │
│                                                     │
│ ┌─── Job Card ────────────────────────────────────┐ │
│ │ 🆕 NEW  Research Scientist, Cardiovascular       │ │
│ │ Genentech · San Francisco, CA                   │ │
│ │ Detected 3 hours ago · Source: websearch        │ │
│ │ [Apply →] [+ Save to Tracker]                   │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Component implementation:

```typescript
'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useProfile } from '../../context/ProfileContext'

const API = process.env.NEXT_PUBLIC_API_URL ||
  'https://career-os-backend-production.up.railway.app/api'

type Sector = 'academia' | 'industry' | 'international' | 'india'

interface MonitorJob {
  id: string
  title: string
  org_name: string
  location: string
  country: string
  sector: Sector
  apply_url: string
  snippet: string
  posted_date: string
  detected_at: string
  is_new: boolean
}

interface MonitorOrg {
  id: string
  name: string
  sector: Sector
  country: string
  total_jobs: number
  new_jobs: number
  last_scanned_at: string
}

interface SectorStats {
  sector: Sector
  total_jobs: number
  new_jobs: number
  last_detected: string
}

const SECTOR_CONFIG = {
  academia: { icon: '🏛️', label: 'Academia', color: '#6366f1', desc: 'Top 20 US research institutions' },
  industry: { icon: '🏭', label: 'Industry', color: '#10b981', desc: 'Top 20 biotech & pharma companies' },
  international: { icon: '🌍', label: 'International', color: '#f59e0b', desc: 'Top 10 EU & Asia-Pacific institutes' },
  india: { icon: '🇮🇳', label: 'India', color: '#ec4899', desc: 'Top 15 Indian research institutes' }
}
```

### Features to implement:

**1. Stats header bar**
- "Last scan: N hours ago" — from /api/monitor/stats
- "▶ Scan Now" button → POST /api/monitor/scan
  Show spinner while scanning, auto-refresh after 30s
- "✓ Mark All Seen" button → POST /api/monitor/mark-seen
  Clears all NEW badges for current sector

**2. Four sector tabs**
Each tab shows:
- Sector icon + label
- Total job count in parentheses
- NEW badge with count if new_jobs > 0
  Style: animated pulse, rose color (#f43f5e)

**3. Filter bar (below tabs)**
- Toggle: "🔴 New Only" — filter to is_new jobs only
- Sort dropdown: Newest First | Oldest First | By Organization
- Search input: filter by title or org name (client-side)

**4. Organization overview panel**
Above the job list, show a compact grid of organizations
in the current sector. Each org shows:
- Org name
- Total jobs count
- NEW badge if new_jobs > 0
- Last scanned timestamp
- Click to filter jobs to that org only

**5. Job cards**
Each card must show:
- 🆕 NEW badge (animated pulse, prominent) if is_new
- Job title (bold, 16px)
- Organization name (muted)
- Location + country flag emoji
- "Detected X hours ago" timestamp
- Source badge (websearch / usajobs / rss)
- Snippet text (2 lines max, truncated)
- Apply button → window.open(apply_url, '_blank')
- "+ Save to Tracker" → POST /api/tracker/pooja
  Saves to Pooja's Kanban board in Saved column

**6. Empty states**
- No jobs yet: "Scan in progress... check back in a few minutes"
  with a pulsing animation
- No new jobs: "All caught up! No new positions since last scan"
  with a checkmark icon
- Error state: show error message + retry button

**7. Auto-refresh**
Every 30 minutes, silently re-fetch stats to update counts.
Show "Updated just now" for 10 seconds after refresh.

---

## STEP 2 — DESIGN SPECIFICATION

Match the existing portal dark theme exactly.

**Color system (from tokens.css):**
```css
--bg-primary: #0a0b14
--bg-secondary: #12131f
--bg-tertiary: #1a1b2e
--bg-glass: rgba(18,19,31,0.85)
--text-primary: #e8e9f3
--text-secondary: #9ca3b8
--text-muted: #5f6580
--accent-pink: #ec4899  /* Pooja's accent */
```

**NEW badge styling:**
```css
background: rgba(244, 63, 94, 0.2)
color: #f87171
border: 1px solid rgba(244, 63, 94, 0.4)
animation: pulse 2s infinite
font-size: 10px
font-weight: 700
padding: 2px 8px
border-radius: 4px
letter-spacing: 0.08em
```

**Job card styling:**
- Glass card effect: background var(--bg-secondary)
- Border: 1px solid rgba(99,102,241,0.12)
- NEW jobs: border-left: 3px solid #f43f5e
- Hover: translateY(-2px), border brightens
- Staggered fade-in animation on load

**Sector tab active state:**
- Active tab uses sector color as bottom border
- Background: semi-transparent sector color

**Org grid:**
- 3-column grid on desktop, 1-column on mobile
- Each org card: compact, shows name + counts
- Orgs with new_jobs > 0 have a colored left border

---

## STEP 3 — ADD TO NAVIGATION

In src/components/AppLayout.tsx, add to TABS array:
```typescript
{ id: 'opportunity-monitor', icon: '🔬', label: 'Opportunity Monitor' }
```

Add to TabId type:
```typescript
| 'opportunity-monitor'
```

In pages/index.tsx add:
```typescript
import { OpportunityMonitor } from '../src/components/tabs/OpportunityMonitor'

// In TAB_VIEWS:
'opportunity-monitor': <OpportunityMonitor />
```

---

## STEP 4 — HELPER UTILITIES

Create src/utils/monitorHelpers.ts:

```typescript
export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  return `${diffDays} days ago`
}

export function countryFlag(country: string): string {
  const flags: Record<string, string> = {
    'USA': '🇺🇸', 'UK': '🇬🇧', 'Germany': '🇩🇪',
    'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'Canada': '🇨🇦',
    'Singapore': '🇸🇬', 'Australia': '🇦🇺', 'India': '🇮🇳',
    'France': '🇫🇷', 'Netherlands': '🇳🇱'
  }
  return flags[country] || '🌍'
}

export function sourceBadgeLabel(apiType: string): string {
  const labels: Record<string, string> = {
    'websearch': 'Web Search',
    'usajobs': 'USAJobs.gov',
    'rss': 'RSS Feed',
    'adzuna': 'Adzuna',
    'natureJobs': 'Nature Jobs'
  }
  return labels[apiType] || apiType
}
```

---

## STEP 5 — BUILD AND VERIFY

After creating all files:

1. npm run build (from frontend directory)
2. If TypeScript errors, fix all before continuing
3. Verify the new tab appears in the navigation
4. Verify API calls go to correct endpoints

Expected build output:
✓ Compiled successfully
✓ Generating static pages

---

## QUALITY CHECKLIST

Before declaring done, verify:
- [ ] OpportunityMonitor.tsx created with all 4 sector tabs
- [ ] Stats header shows last scan time + Scan Now button
- [ ] NEW badge visible and animated on new jobs
- [ ] All 4 sector tabs load data from /api/monitor/jobs
- [ ] Org overview grid shows all organizations per sector
- [ ] Job cards show title, org, location, time ago, apply button
- [ ] Save to Tracker button calls POST /api/tracker/pooja
- [ ] New Only toggle filters correctly
- [ ] Search input filters by title or org name
- [ ] Empty states render correctly
- [ ] TabId updated in AppLayout.tsx
- [ ] TABS array updated in AppLayout.tsx
- [ ] pages/index.tsx imports and routes OpportunityMonitor
- [ ] npm run build passes with zero errors
- [ ] Existing tabs unchanged and still working
- [ ] Mobile responsive (single column on small screens)
