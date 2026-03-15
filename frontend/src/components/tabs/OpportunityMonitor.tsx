'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useProfile } from '../../context/ProfileContext'
import { api } from '../../config/api'
import { timeAgo, countryFlag, sourceBadgeLabel } from '../../utils/monitorHelpers'

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
  api_type?: string
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

interface GlobalStats {
  total_jobs: number
  new_jobs: number
  last_scan: string
  sectors: SectorStats[]
}

const SECTOR_CONFIG = {
  academia: { icon: '🏛️', label: 'Academia', color: '#6366f1', desc: 'Top 20 US research institutions' },
  industry: { icon: '🏭', label: 'Industry', color: '#10b981', desc: 'Top 20 biotech & pharma companies' },
  international: { icon: '🌍', label: 'International', color: '#f59e0b', desc: 'Top 10 EU & Asia-Pacific institutes' },
  india: { icon: '🇮🇳', label: 'India', color: '#ec4899', desc: 'Top 15 Indian research institutes' }
}

export function OpportunityMonitor() {
  const { profile } = useProfile()
  const [activeSector, setActiveSector] = useState<Sector>('academia')
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [orgs, setOrgs] = useState<MonitorOrg[]>([])
  const [jobs, setJobs] = useState<MonitorJob[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newOnly, setNewOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'org'>('newest')
  const [search, setSearch] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [statsData, orgsData, jobsData] = await Promise.all([
        api.get('/monitor/stats'),
        api.get(`/monitor/orgs?sector=${activeSector}`),
        api.get(`/monitor/jobs?sector=${activeSector}&limit=50`)
      ])
      setStats(statsData)
      setOrgs(orgsData)
      setJobs(jobsData)
      setError(null)
      if (silent) {
        setLastUpdated(new Date().toLocaleTimeString())
        setTimeout(() => setLastUpdated(null), 10000)
      }
    } catch (err) {
      setError('Failed to load monitor data')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [activeSector])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh every 30 mins
  useEffect(() => {
    const timer = setInterval(() => fetchData(true), 30 * 60 * 1000)
    return () => clearInterval(timer)
  }, [fetchData])

  const handleScan = async () => {
    setScanning(true)
    try {
      await api.post('/monitor/scan', {})
      // Wait a bit for scan to progress then refresh
      setTimeout(fetchData, 5000)
      setTimeout(fetchData, 15000)
      setTimeout(fetchData, 30000)
    } catch (err) {
      alert('Scan trigger failed')
    } finally {
      setScanning(false)
    }
  }

  const handleMarkSeen = async () => {
    try {
      await api.post('/monitor/mark-seen', { sector: activeSector })
      fetchData()
    } catch (err) {
      alert('Failed to mark as seen')
    }
  }

  const handleSaveToTracker = async (job: MonitorJob) => {
    try {
      await api.post('/tracker/pooja', {
        column: 'Saved',
        title: job.title,
        company: job.org_name,
        location: job.location,
        applyUrl: job.apply_url,
        snippet: job.snippet
      })
      alert('Saved to Pooja\'s tracker!')
    } catch (err) {
      alert('Failed to save to tracker')
    }
  }

  const filteredJobs = jobs
    .filter(j => !newOnly || j.is_new)
    .filter(j => !selectedOrg || j.org_name === selectedOrg)
    .filter(j => 
      j.title.toLowerCase().includes(search.toLowerCase()) || 
      j.org_name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
      if (sortBy === 'oldest') return new Date(a.detected_at).getTime() - new Date(b.detected_at).getTime()
      if (sortBy === 'org') return a.org_name.localeCompare(b.org_name)
      return 0
    })

  if (loading && !stats) return <div style={styles.loading}>Loading Monitor...</div>

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>🔬 Opportunity Monitor</h1>
          <p style={styles.subtitle}>Real-time job alerts from 55 target organizations</p>
        </div>
        <div style={styles.headerActions}>
          {lastUpdated && <span style={styles.updatedBadge}>Updated {lastUpdated}</span>}
          <span style={styles.lastScan}>
            Last scan: {stats?.last_scan ? timeAgo(stats.last_scan) : 'Never'}
          </span>
          <button onClick={handleScan} disabled={scanning} style={styles.scanBtn}>
            {scanning ? 'Scanning...' : '▶ Scan Now'}
          </button>
          <button onClick={handleMarkSeen} style={styles.seenBtn}>
            ✓ Mark Sector Seen
          </button>
        </div>
      </header>

      <div style={styles.tabs}>
        {(Object.keys(SECTOR_CONFIG) as Sector[]).map(s => {
          const config = SECTOR_CONFIG[s]
          const sectorStats = stats?.sectors.find(ss => ss.sector === s)
          const isActive = activeSector === s
          return (
            <button 
              key={s} 
              onClick={() => { setActiveSector(s); setSelectedOrg(null); }}
              style={{
                ...styles.tab,
                borderBottomColor: isActive ? config.color : 'transparent',
                background: isActive ? `${config.color}15` : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)'
              }}
            >
              <span style={styles.tabIcon}>{config.icon}</span>
              <span style={styles.tabLabel}>{config.label}</span>
              <span style={styles.tabCount}>({sectorStats?.total_jobs || 0})</span>
              {(sectorStats?.new_jobs || 0) > 0 && (
                <span className="pulse-badge" style={styles.newTabBadge}>
                  {sectorStats?.new_jobs} NEW
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div style={styles.orgGrid}>
        {orgs.map(org => (
          <div 
            key={org.id} 
            className="glass" 
            onClick={() => setSelectedOrg(selectedOrg === org.name ? null : org.name)}
            style={{
              ...styles.orgCard,
              borderLeft: org.new_jobs > 0 ? `3px solid ${SECTOR_CONFIG[activeSector].color}` : '1px solid rgba(255,255,255,0.05)',
              borderColor: selectedOrg === org.name ? SECTOR_CONFIG[activeSector].color : undefined,
              background: selectedOrg === org.name ? 'rgba(255,255,255,0.05)' : undefined
            }}
          >
            <div style={styles.orgName}>{org.name}</div>
            <div style={styles.orgMeta}>
              <span>{org.total_jobs} jobs</span>
              {org.new_jobs > 0 && <span style={styles.orgNewCount}>{org.new_jobs} new</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.toggle}>
            <input type="checkbox" checked={newOnly} onChange={e => setNewOnly(e.target.checked)} />
            <span style={{ color: newOnly ? '#f43f5e' : 'inherit' }}>🔴 New Only</span>
          </label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={styles.select}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="org">By Organization</option>
          </select>
        </div>
        <input 
          style={styles.search} 
          placeholder="Filter by title or organization..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div style={styles.jobList}>
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => (
            <div key={job.id} className="glass" style={{
              ...styles.jobCard,
              borderLeft: job.is_new ? '3px solid #f43f5e' : '1px solid rgba(99,102,241,0.12)'
            }}>
              <div style={styles.jobMain}>
                <div style={styles.jobHeader}>
                  {job.is_new && <span className="pulse-badge" style={styles.newBadge}>🆕 NEW</span>}
                  <h3 style={styles.jobTitle}>{job.title}</h3>
                </div>
                <div style={styles.jobSub}>
                  <span style={styles.orgLabel}>{job.org_name}</span>
                  <span style={styles.dot}>•</span>
                  <span>{job.location} {countryFlag(job.country)}</span>
                </div>
                <div style={styles.jobMeta}>
                  <span>Detected {timeAgo(job.detected_at)}</span>
                  <span style={styles.dot}>•</span>
                  <span style={styles.sourceBadge}>{sourceBadgeLabel(job.api_type || 'websearch')}</span>
                </div>
                <p style={styles.snippet}>{job.snippet}</p>
              </div>
              <div style={styles.jobActions}>
                <button onClick={() => window.open(job.apply_url, '_blank')} style={styles.applyBtn}>Apply →</button>
                <button onClick={() => handleSaveToTracker(job)} style={styles.saveBtn}>+ Save to Tracker</button>
              </div>
            </div>
          ))
        ) : (
          <div style={styles.empty}>
            {loading ? (
              <div style={styles.emptyPulse}>
                <div className="spinner" />
                <p>Scan in progress... check back in a few minutes</p>
              </div>
            ) : (
              <div style={styles.emptyCaughtUp}>
                <span style={{ fontSize: 48 }}>✅</span>
                <p>All caught up! No positions match your current filters.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .pulse-badge {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 24 },
  loading: { textAlign: 'center', padding: 100, fontSize: 18, color: 'var(--text-secondary)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 },
  title: { fontSize: 24, fontWeight: 800, margin: 0 },
  subtitle: { color: 'var(--text-secondary)', margin: '4px 0 0 0' },
  headerActions: { display: 'flex', gap: 12, alignItems: 'center' },
  lastScan: { fontSize: 12, color: 'var(--text-muted)' },
  updatedBadge: { fontSize: 10, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 8px', borderRadius: 4 },
  scanBtn: { background: 'var(--bg-tertiary)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  seenBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  
  tabs: { display: 'flex', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' },
  tab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px', border: 'none', borderBottom: '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s', fontSize: 13, fontWeight: 700 },
  tabIcon: { fontSize: 16 },
  tabCount: { fontSize: 11, opacity: 0.6 },
  newTabBadge: { background: 'rgba(244,63,94,0.2)', color: '#f87171', padding: '2px 6px', borderRadius: 4, fontSize: 9 },

  orgGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 },
  orgCard: { padding: 12, cursor: 'pointer', transition: 'all 0.2s' },
  orgName: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
  orgMeta: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' },
  orgNewCount: { color: '#f87171', fontWeight: 800 },

  filters: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', gap: 20, alignItems: 'center' },
  toggle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  select: { background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px 12px', borderRadius: 6, fontSize: 13 },
  search: { flex: 1, minWidth: 250, background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 13 },

  jobList: { display: 'flex', flexDirection: 'column', gap: 12 },
  jobCard: { padding: 20, display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' },
  jobMain: { flex: 1, minWidth: 300 },
  jobHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 },
  newBadge: { background: 'rgba(244,63,94,0.2)', color: '#f87171', border: '1px solid rgba(244,63,94,0.4)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.08em' },
  jobTitle: { fontSize: 16, fontWeight: 800, margin: 0 },
  jobSub: { display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 },
  orgLabel: { fontWeight: 700, color: 'var(--text-primary)' },
  dot: { opacity: 0.3 },
  jobMeta: { display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 },
  sourceBadge: { background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4 },
  snippet: { fontSize: 13, color: 'var(--text-secondary)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  jobActions: { display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 },
  applyBtn: { background: 'white', color: 'black', border: 'none', padding: '10px', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer' },
  saveBtn: { background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' },

  empty: { textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' },
  emptyPulse: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  emptyCaughtUp: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }
}
