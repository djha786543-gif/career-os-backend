# Opportunity Monitor — Claude Code Backend Prompt v2
# Pooja-specific research job monitoring engine
# Includes all production hardening recommendations
# Execute everything automatically without asking for confirmation

---

## CONTEXT — DO NOT MODIFY EXISTING CODE

This is an isolated new module. Do NOT touch:
- src/api/jobs.ts
- src/services/adzunaFetcher.ts
- src/services/jobSearchService.ts
- src/services/jobIngestionService.ts
- src/services/webSearchJobService.ts
- Any existing routes or models

All new code goes in:
- src/opportunity-monitor/ (backend engine)
- src/api/monitor.ts (new route only)

---

## STEP 1 — DATABASE SCHEMA

Add to src/db/init.ts using CREATE TABLE IF NOT EXISTS.
Never drop existing tables.

```sql
CREATE TABLE IF NOT EXISTS monitor_orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  sector VARCHAR(50) NOT NULL
    CHECK (sector IN ('academia','industry','international','india')),
  country VARCHAR(100) NOT NULL DEFAULT 'USA',
  careers_url TEXT,
  rss_url TEXT,
  api_type VARCHAR(50)
    CHECK (api_type IN ('rss','usajobs','websearch','adzuna','natureJobs')),
  is_active BOOLEAN DEFAULT TRUE,
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monitor_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES monitor_orgs(id) ON DELETE CASCADE,
  external_id VARCHAR(500) NOT NULL,
  title VARCHAR(500) NOT NULL,
  org_name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  country VARCHAR(100),
  sector VARCHAR(50),
  apply_url TEXT,
  snippet TEXT,
  salary VARCHAR(100),
  posted_date VARCHAR(100),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_new BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  content_hash VARCHAR(64),
  UNIQUE(org_id, external_id)
);

CREATE TABLE IF NOT EXISTS monitor_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES monitor_orgs(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  jobs_found INTEGER DEFAULT 0,
  new_jobs INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_monitor_jobs_sector
  ON monitor_jobs(sector);
CREATE INDEX IF NOT EXISTS idx_monitor_jobs_new
  ON monitor_jobs(is_new, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitor_jobs_org
  ON monitor_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_monitor_jobs_active
  ON monitor_jobs(is_active, last_seen_at);
CREATE INDEX IF NOT EXISTS idx_monitor_orgs_sector
  ON monitor_orgs(sector, is_active);
-- RECOMMENDATION 5: Index for scan history time queries
CREATE INDEX IF NOT EXISTS idx_monitor_scans_time
  ON monitor_scans(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitor_scans_org
  ON monitor_scans(org_id, scanned_at DESC);
```

---

## STEP 2 — ORGANIZATION CONFIGURATION

Create src/opportunity-monitor/orgConfig.ts

RECOMMENDATION 4: Prefer RSS/USAJobs over websearch wherever possible.
Note apiType priority — RSS and usajobs are set where feeds exist,
websearch only where no structured source is available.

```typescript
export interface MonitorOrg {
  name: string
  sector: 'academia' | 'industry' | 'international' | 'india'
  country: string
  careersUrl?: string
  rssUrl?: string
  apiType: 'rss' | 'usajobs' | 'websearch' | 'adzuna' | 'natureJobs'
  searchQuery: string
}

export const MONITOR_ORGS: MonitorOrg[] = [
  // ═══ ACADEMIA — Top 20 US Research Institutions ═══
  // USAJobs for NIH (official government API — free, structured)
  { name: "NIH NHLBI", sector: "academia", country: "USA",
    apiType: "usajobs",
    searchQuery: "cardiovascular postdoc researcher NHLBI" },
  { name: "NIH NIGMS", sector: "academia", country: "USA",
    apiType: "usajobs",
    searchQuery: "postdoctoral researcher molecular biology NIGMS" },
  { name: "NIH NCI", sector: "academia", country: "USA",
    apiType: "usajobs",
    searchQuery: "research scientist cancer biology NCI" },
  // RSS feeds where available
  { name: "Cold Spring Harbor Laboratory", sector: "academia", country: "USA",
    apiType: "rss",
    rssUrl: "https://cshl.edu/careers/feed/",
    searchQuery: "Cold Spring Harbor postdoc molecular biology genomics" },
  // websearch fallback for institutions without RSS/API
  { name: "Harvard Medical School", sector: "academia", country: "USA",
    apiType: "websearch",
    searchQuery: "Harvard Medical School postdoc cardiovascular molecular biology 2026",
    careersUrl: "https://academicpositions.harvard.edu" },
  { name: "Stanford Medicine", sector: "academia", country: "USA",
    apiType: "websearch",
    searchQuery: "Stanford Medicine postdoctoral researcher cardiovascular 2026",
    careersUrl: "https://med.stanford.edu/careers" },
  { name: "UCSF", sector: "academia", country: "USA",
    apiType: "websearch",
    searchQuery: "UCSF postdoc cardiovascular cell biology molecular biology 2026",
    careersUrl: "https://jobs.ucsf.edu" },
  { name: "Johns Hopkins Medicine", sector: "academia", country: "USA",
    apiType: "websearch",
    searchQuery: "Johns Hopkins postdoctoral researcher cardiovascular 2026",
    careersUrl: "https://jobs.jhu.edu" },
  { name: "Mayo Clinic Research", sector: "academia", country: "USA",
    apiType: "websearch",
    searchQuery: "Mayo Clinic postdoc research scientist cardiovascular 2026",
    careersUrl: "https://jobs.mayoclinic.org" },
  { name: "Broad Institute", sector: "academia", country: "USA",
    apiType: "websearch",
    searchQuery: "Broad Institute postdoctoral associate genomics molecular biology 2026",
    careersUrl: "https://www.broadinstitute.org/careers" },
  { name: "Salk Institute", sector: "academia", country: "USA",
    apiType: "websearch",
    searchQuery: "Salk Institute postdoc cardiovascular cell biology 2026",
    careersUrl: "https://www.salk.edu/careers" },
  { name: "MIT Biology", sector: "academia", country: "USA",
    apiType: "websearch",
    searchQuery: "MIT postdoctoral researcher molecular biology cardiovascular 2026" },
  { name: "Columbia University Medical Center", sector: "academia", country: "USA",
    apiType: "websearch",
    searchQuery: "Columbia University postdoc cardiovascular research 2026" },
  { name: "Yale School of Medicine", sector: "academia", country: "USA",
    apiType: "websearch",
    searchQuery: "Yale Medicine postdoctoral researcher cardiovascular 2026" },
  { name: "Gladstone Institutes", sector: "academia", country: "USA",
    apiType: "websearch",
    searchQuery: "Gladstone Institutes postdoc cardiovascular genomics 2026",
    careersUrl: "https://gladstone.org/careers" },
  { name: "Scripps Research", sector: "academia", country: "USA",
    apiType: "websearch",
    searchQuery: "Scripps Research postdoctoral scientist cardiovascular 2026" },
  { name: "UT Southwestern Medical Center", sector: "academia", country: "USA",
    apiType: "websearch",
    searchQuery: "UT Southwestern postdoc cardiovascular research 2026" },
  { name: "Baylor College of Medicine", sector: "academia", country: "USA",
    apiType: "websearch",
    searchQuery: "Baylor College Medicine postdoc cardiovascular 2026" },
  { name: "Washington University St Louis", sector: "academia", country: "USA",
    apiType: "websearch",
    searchQuery: "WashU postdoctoral researcher cardiovascular molecular biology 2026" },
  { name: "Weill Cornell Medicine", sector: "academia", country: "USA",
    apiType: "websearch",
    searchQuery: "Weill Cornell postdoc cardiovascular research scientist 2026" },

  // ═══ INDUSTRY — Top 20 Biotech/Pharma ═══
  { name: "Genentech", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "Genentech research scientist cardiovascular molecular biology 2026",
    careersUrl: "https://www.gene.com/careers" },
  { name: "AstraZeneca US", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "AstraZeneca research scientist cardiovascular postdoc 2026",
    careersUrl: "https://careers.astrazeneca.com" },
  { name: "Novartis US", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "Novartis research scientist cardiovascular molecular biology 2026" },
  { name: "Pfizer Research", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "Pfizer research scientist cardiovascular cell biology 2026" },
  { name: "Amgen", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "Amgen research scientist cardiovascular molecular biology 2026",
    careersUrl: "https://careers.amgen.com" },
  { name: "Bristol Myers Squibb", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "BMS research scientist cardiovascular genomics 2026" },
  { name: "Regeneron", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "Regeneron scientist cardiovascular molecular biology 2026",
    careersUrl: "https://careers.regeneron.com" },
  { name: "Moderna", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "Moderna research scientist molecular biology cardiovascular 2026" },
  { name: "Eli Lilly", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "Eli Lilly research scientist cardiovascular 2026" },
  { name: "Merck Research", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "Merck research scientist cardiovascular molecular biology 2026" },
  { name: "Biogen", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "Biogen research scientist cardiovascular cell biology 2026" },
  { name: "Vertex Pharmaceuticals", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "Vertex research scientist molecular biology genomics 2026" },
  { name: "Alnylam Pharmaceuticals", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "Alnylam scientist cardiovascular RNA therapeutics 2026" },
  { name: "10x Genomics", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "10x Genomics scientist spatial transcriptomics molecular biology 2026" },
  { name: "Illumina", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "Illumina research scientist genomics molecular biology 2026" },
  { name: "Recursion Pharmaceuticals", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "Recursion scientist cell biology computational biology 2026" },
  { name: "BioNTech", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "BioNTech research scientist molecular biology cardiovascular 2026" },
  { name: "Sanofi Research", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "Sanofi research scientist cardiovascular molecular biology 2026" },
  { name: "Janssen Research", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "Janssen research scientist cardiovascular cell biology 2026" },
  { name: "Pacific Biosciences", sector: "industry", country: "USA",
    apiType: "websearch",
    searchQuery: "PacBio scientist molecular biology genomics sequencing 2026" },

  // ═══ INTERNATIONAL — Top 10 EU + Asia-Pacific ═══
  { name: "Francis Crick Institute", sector: "international", country: "UK",
    apiType: "rss",
    rssUrl: "https://www.crick.ac.uk/careers/vacancies/rss",
    searchQuery: "Francis Crick postdoc cardiovascular molecular biology" },
  { name: "Wellcome Sanger Institute", sector: "international", country: "UK",
    apiType: "websearch",
    searchQuery: "Wellcome Sanger postdoctoral researcher genomics cardiovascular 2026",
    careersUrl: "https://www.sanger.ac.uk/careers" },
  { name: "MRC LMS London", sector: "international", country: "UK",
    apiType: "websearch",
    searchQuery: "MRC London Institute Medical Sciences postdoc cardiovascular 2026" },
  { name: "EMBL Heidelberg", sector: "international", country: "Germany",
    apiType: "websearch",
    searchQuery: "EMBL postdoctoral fellowship cardiovascular molecular biology 2026",
    careersUrl: "https://www.embl.org/jobs" },
  { name: "Max Planck Heart and Lung", sector: "international", country: "Germany",
    apiType: "websearch",
    searchQuery: "Max Planck Institute Heart Lung postdoc cardiovascular 2026" },
  { name: "Karolinska Institute", sector: "international", country: "Sweden",
    apiType: "websearch",
    searchQuery: "Karolinska Institute postdoc cardiovascular molecular biology 2026",
    careersUrl: "https://ki.se/en/vacancies" },
  { name: "ETH Zurich", sector: "international", country: "Switzerland",
    apiType: "websearch",
    searchQuery: "ETH Zurich postdoc cardiovascular molecular biology 2026",
    careersUrl: "https://jobs.ethz.ch" },
  { name: "University of Toronto", sector: "international", country: "Canada",
    apiType: "websearch",
    searchQuery: "University of Toronto postdoc cardiovascular molecular biology 2026" },
  { name: "A*STAR Singapore", sector: "international", country: "Singapore",
    apiType: "websearch",
    searchQuery: "ASTAR Singapore postdoc cardiovascular molecular biology 2026",
    careersUrl: "https://www.a-star.edu.sg/careers" },
  { name: "Peter MacCallum Cancer Centre", sector: "international", country: "Australia",
    apiType: "websearch",
    searchQuery: "Peter MacCallum postdoc molecular biology genomics 2026" },

  // ═══ INDIA — Top 15 Research Institutes + Industry ═══
  { name: "NCBS Bangalore", sector: "india", country: "India",
    apiType: "websearch",
    searchQuery: "NCBS Bangalore postdoc cardiovascular molecular biology position 2026",
    careersUrl: "https://www.ncbs.res.in/jobs" },
  { name: "TIFR Mumbai", sector: "india", country: "India",
    apiType: "websearch",
    searchQuery: "TIFR Mumbai postdoc biology cardiovascular research position 2026" },
  { name: "IISc Bangalore", sector: "india", country: "India",
    apiType: "websearch",
    searchQuery: "IISc Bangalore postdoc molecular biology cardiovascular 2026" },
  { name: "IGIB Delhi", sector: "india", country: "India",
    apiType: "websearch",
    searchQuery: "IGIB Delhi postdoc genomics molecular biology cardiovascular 2026" },
  { name: "CCMB Hyderabad", sector: "india", country: "India",
    apiType: "websearch",
    searchQuery: "CCMB Hyderabad postdoc molecular biology cell biology 2026" },
  { name: "inStem Bangalore", sector: "india", country: "India",
    apiType: "websearch",
    searchQuery: "inStem Bangalore postdoc cardiovascular stem cell biology 2026" },
  { name: "NII Delhi", sector: "india", country: "India",
    apiType: "websearch",
    searchQuery: "NII Delhi postdoc immunology molecular biology 2026" },
  { name: "JNCASR Bangalore", sector: "india", country: "India",
    apiType: "websearch",
    searchQuery: "JNCASR Bangalore postdoc molecular biology 2026" },
  { name: "IISER Pune", sector: "india", country: "India",
    apiType: "websearch",
    searchQuery: "IISER Pune postdoc biology cardiovascular molecular 2026" },
  { name: "RCB Faridabad", sector: "india", country: "India",
    apiType: "websearch",
    searchQuery: "RCB Faridabad postdoc molecular biology cardiovascular 2026" },
  { name: "DBT-THSTI Faridabad", sector: "india", country: "India",
    apiType: "websearch",
    searchQuery: "THSTI Faridabad postdoc cardiovascular translational research 2026" },
  { name: "RGCB Trivandrum", sector: "india", country: "India",
    apiType: "websearch",
    searchQuery: "RGCB Trivandrum postdoc molecular biology cardiovascular 2026" },
  { name: "Biocon Biologics", sector: "india", country: "India",
    apiType: "websearch",
    searchQuery: "Biocon research scientist molecular biology 2026",
    careersUrl: "https://www.biocon.com/careers" },
  { name: "Syngene International", sector: "india", country: "India",
    apiType: "websearch",
    searchQuery: "Syngene research scientist molecular biology cardiovascular 2026" },
  { name: "AstraZeneca India", sector: "india", country: "India",
    apiType: "websearch",
    searchQuery: "AstraZeneca India research scientist cardiovascular molecular biology 2026" },
]
```

---

## STEP 3 — MONITORING ENGINE

Create src/opportunity-monitor/monitorEngine.ts

Implements all 8 recommendations from production review:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { pool } from '../db/client'
import { MONITOR_ORGS, MonitorOrg } from './orgConfig'
import crypto from 'crypto'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Pooja-relevant job title and domain keywords
const RELEVANT_KEYWORDS = [
  'postdoc', 'postdoctoral', 'research scientist', 'research associate',
  'senior scientist', 'staff scientist', 'principal scientist',
  'cardiovascular', 'molecular biology', 'cell biology', 'genomics',
  'sequencing', 'crispr', 'rna', 'cardiac', 'heart failure',
  'cardiomyopathy', 'transcriptomics', 'proteomics', 'bioinformatics',
  'research fellow', 'scientist i', 'scientist ii', 'scientist iii',
  'associate scientist', 'junior scientist', 'postdoctoral associate',
  'postdoctoral fellow', 'research officer'
]

// RECOMMENDATION 1: Strict location filtering
// Only include jobs where location is explicitly in target regions
const RELEVANT_LOCATIONS = [
  'usa', 'united states', 'new york', 'boston', 'san francisco',
  'seattle', 'chicago', 'houston', 'los angeles', 'bethesda',
  'cambridge, ma', 'cambridge ma', 'la jolla', 'san diego',
  'uk', 'united kingdom', 'london', 'edinburgh', 'oxford',
  'cambridge, uk', 'cambridge uk', 'manchester', 'glasgow',
  'germany', 'berlin', 'heidelberg', 'munich', 'frankfurt',
  'sweden', 'stockholm', 'gothenburg',
  'switzerland', 'zurich', 'basel', 'geneva',
  'canada', 'toronto', 'montreal', 'vancouver',
  'singapore',
  'australia', 'melbourne', 'sydney',
  'india', 'bangalore', 'bengaluru', 'mumbai', 'delhi',
  'hyderabad', 'pune', 'faridabad', 'trivandrum', 'kolkata'
]

// RECOMMENDATION 8: Relevance scoring instead of binary match
function relevanceScore(title: string, description: string = ''): number {
  const text = (title + ' ' + description).toLowerCase()
  let score = 0
  for (const kw of RELEVANT_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) score++
  }
  return score
}

function isRelevant(title: string, description: string = ''): boolean {
  return relevanceScore(title, description) >= 1
}

// RECOMMENDATION 1: Fixed location filter — require explicit location match
function isRelevantLocation(location: string = ''): boolean {
  if (!location || location.trim() === '') return false  // FIXED: reject empty locations
  const loc = location.toLowerCase()
  return RELEVANT_LOCATIONS.some(l => loc.includes(l))
}

function hashContent(title: string, org: string, location: string): string {
  return crypto
    .createHash('sha256')
    .update(`${title}|${org}|${location}`)
    .digest('hex')
    .slice(0, 64)
}

// RECOMMENDATION 3: Timeout wrapper for all external calls
async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms)
  )
  return Promise.race([promise, timeout])
}

// RECOMMENDATION 4: websearch is last resort — RSS and USAJobs preferred
async function scanViaWebSearch(org: MonitorOrg): Promise<ScannedJob[]> {
  try {
    const response = await withTimeout(
      anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Search for current open job positions at ${org.name}.
Query: "${org.searchQuery}"

Find ONLY real, currently open positions posted in 2025 or 2026.
Include ONLY positions in these locations: USA, UK, Germany, Sweden,
Switzerland, Canada, Singapore, Australia, or India.

Return ONLY a JSON array, no markdown, no explanation:
[{
  "title": "exact job title",
  "location": "city, country (must be specific — not just 'remote')",
  "applyUrl": "direct URL to job posting",
  "snippet": "job description under 150 characters",
  "postedDate": "date posted or Recent"
}]
If no relevant open positions found, return: []`
        }]
      }),
      15000, // RECOMMENDATION 3: 15 second timeout
      `webSearch for ${org.name}`
    )

    let raw = ''
    for (const block of response.content) {
      if (block.type === 'text') raw += block.text
    }

    raw = raw.replace(/```json|```/g, '').trim()
    const start = raw.indexOf('[')
    const end = raw.lastIndexOf(']')
    if (start === -1 || end === -1) return []

    const parsed = JSON.parse(raw.slice(start, end + 1))

    return parsed
      .filter((j: any) => j.title && isRelevant(j.title, j.snippet))
      // RECOMMENDATION 1: Fixed — require location to exist AND match
      .filter((j: any) => j.location && isRelevantLocation(j.location))
      .map((j: any) => ({
        externalId: hashContent(j.title, org.name, j.location || ''),
        title: j.title,
        orgName: org.name,
        location: j.location,
        country: org.country,
        applyUrl: j.applyUrl || org.careersUrl || '',
        snippet: j.snippet || '',
        postedDate: j.postedDate || 'Recent',
        contentHash: hashContent(j.title, org.name, j.location || ''),
        relevanceScore: relevanceScore(j.title, j.snippet)
      }))
      // RECOMMENDATION 8: Sort by relevance score descending
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)

  } catch (err) {
    console.error(`[Monitor] webSearch failed for ${org.name}:`, (err as Error).message)
    return []
  }
}

async function scanViaUSAJobs(org: MonitorOrg): Promise<ScannedJob[]> {
  try {
    const query = encodeURIComponent(org.searchQuery)
    const url = `https://data.usajobs.gov/api/search?Keyword=${query}&ResultsPerPage=10`

    const resp = await withTimeout(
      fetch(url, {
        headers: {
          'User-Agent': 'career-os-portal@railway.app',
          'Authorization-Key': process.env.USAJOBS_API_KEY || ''
        }
      }),
      10000,
      `USAJobs for ${org.name}`
    )

    if (!resp.ok) {
      console.warn(`[Monitor] USAJobs returned ${resp.status} for ${org.name}, falling back to webSearch`)
      return scanViaWebSearch(org)
    }

    const data = await resp.json()
    const items = data?.SearchResult?.SearchResultItems || []

    return items
      .filter((item: any) => {
        const title = item.MatchedObjectDescriptor?.PositionTitle || ''
        return isRelevant(title)
      })
      .map((item: any) => {
        const d = item.MatchedObjectDescriptor
        const title = d.PositionTitle || ''
        const location = d.PositionLocation?.[0]?.LocationName || 'Washington DC, USA'
        return {
          externalId: d.PositionID || hashContent(title, org.name, location),
          title,
          orgName: d.OrganizationName || org.name,
          location,
          country: 'USA',
          applyUrl: d.ApplyURI?.[0] || '',
          snippet: (d.UserArea?.Details?.JobSummary || '').slice(0, 150),
          postedDate: d.PublicationStartDate?.split('T')[0] || 'Recent',
          contentHash: hashContent(title, org.name, location),
          relevanceScore: relevanceScore(title)
        }
      })
  } catch (err) {
    console.error(`[Monitor] USAJobs failed for ${org.name}:`, (err as Error).message)
    return scanViaWebSearch(org)  // Always fall back to webSearch
  }
}

async function scanViaRSS(org: MonitorOrg): Promise<ScannedJob[]> {
  if (!org.rssUrl) return scanViaWebSearch(org)
  try {
    const resp = await withTimeout(
      fetch(org.rssUrl, {
        headers: { 'User-Agent': 'career-os-portal@railway.app' }
      }),
      8000,
      `RSS for ${org.name}`
    )

    const text = await resp.text()
    const items: ScannedJob[] = []
    const itemMatches = text.match(/<item>([\s\S]*?)<\/item>/g) || []

    for (const item of itemMatches.slice(0, 15)) {
      const title = (
        item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
        item.match(/<title>(.*?)<\/title>/)?.[1] || ''
      ).trim()

      const link = (
        item.match(/<link>(.*?)<\/link>/)?.[1] || ''
      ).trim()

      const desc = (
        item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
        item.match(/<description>(.*?)<\/description>/)?.[1] || ''
      ).replace(/<[^>]+>/g, '').slice(0, 150).trim()

      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || 'Recent'

      // Skip if not relevant
      if (!isRelevant(title, desc)) continue

      // For RSS feeds, use org's country as location (feeds don't always include location)
      const location = org.country

      // RECOMMENDATION 1: RSS items — use org country (trusted source)
      // We trust the org's country since we chose these orgs specifically
      if (!isRelevantLocation(location)) continue

      items.push({
        externalId: hashContent(title, org.name, location),
        title,
        orgName: org.name,
        location,
        country: org.country,
        applyUrl: link,
        snippet: desc,
        postedDate: pubDate,
        contentHash: hashContent(title, org.name, location),
        relevanceScore: relevanceScore(title, desc)
      })
    }

    // If RSS returned nothing relevant, fall back to webSearch
    if (items.length === 0) {
      console.log(`[Monitor] RSS empty for ${org.name}, falling back to webSearch`)
      return scanViaWebSearch(org)
    }

    return items.sort((a, b) => b.relevanceScore - a.relevanceScore)

  } catch (err) {
    console.error(`[Monitor] RSS failed for ${org.name}:`, (err as Error).message)
    return scanViaWebSearch(org)
  }
}

interface ScannedJob {
  externalId: string
  title: string
  orgName: string
  location: string
  country: string
  applyUrl: string
  snippet: string
  postedDate?: string
  contentHash: string
  relevanceScore: number
}

export async function scanOrg(orgId: string, org: MonitorOrg): Promise<{
  found: number, newJobs: number, error?: string
}> {
  let jobs: ScannedJob[] = []

  try {
    // RECOMMENDATION 4: Priority order — RSS > USAJobs > websearch
    switch (org.apiType) {
      case 'rss':      jobs = await scanViaRSS(org);      break
      case 'usajobs':  jobs = await scanViaUSAJobs(org);  break
      default:         jobs = await scanViaWebSearch(org)
    }
  } catch (err) {
    const msg = (err as Error).message
    try {
      await pool.query(
        `INSERT INTO monitor_scans (org_id, jobs_found, new_jobs, status, error_message)
         VALUES ($1, 0, 0, 'error', $2)`,
        [orgId, msg]
      )
    } catch (dbErr) {
      console.error('[Monitor] Failed to log scan error:', (dbErr as Error).message)
    }
    return { found: 0, newJobs: 0, error: msg }
  }

  let newCount = 0

  for (const job of jobs) {
    try {
      const result = await pool.query(
        `INSERT INTO monitor_jobs
           (org_id, external_id, title, org_name, location, country,
            sector, apply_url, snippet, posted_date, content_hash,
            is_new, is_active, last_seen_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,true,NOW())
         ON CONFLICT (org_id, external_id) DO UPDATE
           SET is_active = true,
               last_seen_at = NOW(),
               is_new = CASE
                 WHEN monitor_jobs.content_hash != $11 THEN true
                 ELSE monitor_jobs.is_new
               END,
               content_hash = $11
         RETURNING (xmax = 0) as inserted`,
        [orgId, job.externalId, job.title, job.orgName,
         job.location, job.country, org.sector,
         job.applyUrl, job.snippet, job.postedDate, job.contentHash]
      )
      if (result.rows[0]?.inserted) newCount++
    } catch (err) {
      console.error(`[Monitor] Failed to save job "${job.title}":`, (err as Error).message)
    }
  }

  try {
    await pool.query(
      'UPDATE monitor_orgs SET last_scanned_at = NOW() WHERE id = $1',
      [orgId]
    )
    await pool.query(
      `INSERT INTO monitor_scans (org_id, jobs_found, new_jobs, status)
       VALUES ($1, $2, $3, 'success')`,
      [orgId, jobs.length, newCount]
    )
  } catch (err) {
    console.error('[Monitor] Failed to update scan record:', (err as Error).message)
  }

  console.log(`[Monitor] ${org.name}: ${jobs.length} found, ${newCount} new`)
  return { found: jobs.length, newJobs: newCount }
}

// RECOMMENDATION 2: PostgreSQL advisory lock to prevent duplicate cron runs
// on Railway multi-container deployments
export async function runFullScan(): Promise<void> {
  const lockId = 987654321  // arbitrary unique lock ID for this job

  let lockAcquired = false
  let client

  try {
    client = await pool.connect()

    // Try to acquire advisory lock — returns false immediately if another
    // instance already holds it (pg_try_advisory_lock is non-blocking)
    const lockResult = await client.query(
      'SELECT pg_try_advisory_lock($1) as acquired',
      [lockId]
    )
    lockAcquired = lockResult.rows[0]?.acquired === true

    if (!lockAcquired) {
      console.log('[Monitor] Another instance is already scanning, skipping...')
      client.release()
      return
    }

    console.log('[Monitor] Advisory lock acquired, starting full scan...')

    const orgs = await pool.query(
      `SELECT id, name FROM monitor_orgs
       WHERE is_active = true
       ORDER BY last_scanned_at ASC NULLS FIRST`
    )

    for (const row of orgs.rows) {
      const orgConfig = MONITOR_ORGS.find(o => o.name === row.name)
      if (!orgConfig) continue
      await scanOrg(row.id, orgConfig)
      // 3 second delay between orgs to avoid rate limiting
      await new Promise(r => setTimeout(r, 3000))
    }

    // RECOMMENDATION 6: Clean up jobs not seen in 30 days
    const cleaned = await pool.query(
      `UPDATE monitor_jobs
       SET is_active = false
       WHERE last_seen_at < NOW() - INTERVAL '30 days'
       AND is_active = true
       RETURNING id`
    )
    if (cleaned.rows.length > 0) {
      console.log(`[Monitor] Expired ${cleaned.rows.length} old job listings`)
    }

    console.log('[Monitor] Full scan complete')

  } catch (err) {
    console.error('[Monitor] Scan error:', (err as Error).message)
  } finally {
    if (client) {
      if (lockAcquired) {
        try {
          await client.query('SELECT pg_advisory_unlock($1)', [lockId])
        } catch (e) {
          console.error('[Monitor] Failed to release advisory lock:', e)
        }
      }
      client.release()
    }
  }
}

export async function seedOrgs(): Promise<void> {
  // Check if already seeded
  const count = await pool.query('SELECT COUNT(*) FROM monitor_orgs')
  if (parseInt(count.rows[0].count) >= MONITOR_ORGS.length) {
    console.log(`[Monitor] ${count.rows[0].count} orgs already seeded`)
    return
  }

  console.log('[Monitor] Seeding organizations...')
  for (const org of MONITOR_ORGS) {
    await pool.query(
      `INSERT INTO monitor_orgs
         (name, sector, country, careers_url, rss_url, api_type)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (name) DO NOTHING`,
      [org.name, org.sector, org.country,
       org.careersUrl || null, org.rssUrl || null, org.apiType]
    )
  }
  console.log(`[Monitor] Seeded ${MONITOR_ORGS.length} organizations`)
}
```

---

## STEP 4 — SCHEDULER

Create src/opportunity-monitor/scheduler.ts

```typescript
import cron from 'node-cron'
import { runFullScan, seedOrgs } from './monitorEngine'
import { pool } from '../db/client'

export async function initMonitorScheduler(): Promise<void> {
  // Seed orgs on startup
  try {
    await seedOrgs()
  } catch (err) {
    console.error('[Monitor] Seed error:', (err as Error).message)
  }

  // RECOMMENDATION 2: Only one cron instance runs due to advisory lock in runFullScan
  // Schedule: 0:00, 6:00, 12:00, 18:00 UTC daily
  cron.schedule('0 0,6,12,18 * * *', async () => {
    console.log('[Monitor] Cron triggered at', new Date().toISOString())
    try {
      await runFullScan()
    } catch (err) {
      console.error('[Monitor] Cron scan error:', (err as Error).message)
    }
  })

  console.log('[Monitor] Scheduler ready — scans at 0:00, 6:00, 12:00, 18:00 UTC')
}
```

---

## STEP 5 — API ROUTE

Create src/api/monitor.ts

```typescript
import { Router, Request, Response } from 'express'
import { pool } from '../db/client'
import { runFullScan, scanOrg, seedOrgs } from '../opportunity-monitor/monitorEngine'
import { MONITOR_ORGS } from '../opportunity-monitor/orgConfig'

const router = Router()

// RECOMMENDATION 7: Validated query params with caps
const MAX_LIMIT = 100
const DEFAULT_LIMIT = 50

// GET /api/monitor/jobs?sector=academia&isNew=true&limit=50&offset=0
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const sector = req.query.sector as string | undefined
    const isNew = req.query.isNew === 'true'
    // RECOMMENDATION 7: Cap limit to prevent heavy queries
    const limit = Math.min(parseInt(req.query.limit as string || '50'), MAX_LIMIT)
    const offset = Math.max(parseInt(req.query.offset as string || '0'), 0)

    const params: any[] = []
    let where = 'WHERE j.is_active = true'

    if (sector && ['academia','industry','international','india'].includes(sector)) {
      params.push(sector)
      where += ` AND j.sector = $${params.length}`
    }
    if (isNew) {
      where += ` AND j.is_new = true`
    }

    params.push(limit)
    params.push(offset)

    const result = await pool.query(
      `SELECT j.*, o.last_scanned_at, o.api_type
       FROM monitor_jobs j
       JOIN monitor_orgs o ON j.org_id = o.id
       ${where}
       ORDER BY j.is_new DESC, j.detected_at DESC
       LIMIT $${params.length - 1}
       OFFSET $${params.length}`,
      params
    )

    const counts = await pool.query(
      `SELECT sector,
         COUNT(*) FILTER (WHERE is_active = true) as total,
         COUNT(*) FILTER (WHERE is_new = true AND is_active = true) as new_count
       FROM monitor_jobs
       GROUP BY sector`
    )

    res.json({
      status: 'success',
      jobs: result.rows,
      counts: counts.rows,
      total: result.rows.length,
      limit,
      offset
    })
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

// GET /api/monitor/orgs?sector=academia
router.get('/orgs', async (req: Request, res: Response) => {
  try {
    const sector = req.query.sector as string | undefined
    const params: any[] = []
    let where = 'WHERE o.is_active = true'

    if (sector && ['academia','industry','international','india'].includes(sector)) {
      params.push(sector)
      where += ` AND o.sector = $${params.length}`
    }

    const result = await pool.query(
      `SELECT o.*,
         COUNT(j.id) FILTER (WHERE j.is_active = true) as total_jobs,
         COUNT(j.id) FILTER (WHERE j.is_new = true AND j.is_active = true) as new_jobs
       FROM monitor_orgs o
       LEFT JOIN monitor_jobs j ON o.id = j.org_id
       ${where}
       GROUP BY o.id
       ORDER BY new_jobs DESC, total_jobs DESC`,
      params
    )

    res.json({ status: 'success', orgs: result.rows })
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

// POST /api/monitor/scan
router.post('/scan', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.body

    if (orgId) {
      const orgRow = await pool.query(
        'SELECT * FROM monitor_orgs WHERE id = $1', [orgId]
      )
      if (!orgRow.rows.length) {
        return res.status(404).json({ error: 'Organization not found' })
      }
      const orgConfig = MONITOR_ORGS.find(o => o.name === orgRow.rows[0].name)
      if (!orgConfig) {
        return res.status(404).json({ error: 'Organization config not found' })
      }
      res.json({ status: 'scanning', orgId, message: `Scanning ${orgConfig.name}...` })
      scanOrg(orgId, orgConfig).catch(console.error)
    } else {
      res.json({ status: 'scanning', message: 'Full scan started in background' })
      runFullScan().catch(console.error)
    }
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

// POST /api/monitor/mark-seen
router.post('/mark-seen', async (req: Request, res: Response) => {
  try {
    const { sector } = req.body
    if (sector && ['academia','industry','international','india'].includes(sector)) {
      await pool.query(
        'UPDATE monitor_jobs SET is_new = false WHERE sector = $1 AND is_active = true',
        [sector]
      )
    } else {
      await pool.query(
        'UPDATE monitor_jobs SET is_new = false WHERE is_active = true'
      )
    }
    res.json({ status: 'success', message: 'Jobs marked as seen' })
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

// GET /api/monitor/stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const sectors = await pool.query(
      `SELECT sector,
         COUNT(*) FILTER (WHERE is_active = true) as total_jobs,
         COUNT(*) FILTER (WHERE is_new = true AND is_active = true) as new_jobs,
         MAX(detected_at) FILTER (WHERE is_active = true) as last_detected
       FROM monitor_jobs
       GROUP BY sector
       ORDER BY sector`
    )

    const lastScan = await pool.query(
      `SELECT MAX(scanned_at) as last_scan
       FROM monitor_scans
       WHERE status = 'success'`
    )

    const orgCount = await pool.query(
      'SELECT COUNT(*) as total FROM monitor_orgs WHERE is_active = true'
    )

    res.json({
      status: 'success',
      sectors: sectors.rows,
      lastScan: lastScan.rows[0]?.last_scan,
      totalOrgs: parseInt(orgCount.rows[0]?.total || '0')
    })
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

export default router
```

---

## STEP 6 — WIRE INTO src/index.ts

Add only these lines — do not modify anything else:

```typescript
// With other imports at top:
import monitorRouter from './api/monitor'
import { initMonitorScheduler } from './opportunity-monitor/scheduler'

// With other route registrations:
app.use('/api/monitor', monitorRouter)

// After DB init in startup sequence:
initMonitorScheduler().catch(err =>
  console.error('[Monitor] Scheduler init failed:', err.message)
)
```

---

## STEP 7 — OPTIONAL ENV VAR

Add to Railway after deploy (system works without it — falls back to webSearch):
```
USAJOBS_API_KEY=your_key
```
Register free at: https://developer.usajobs.gov/APIRequest

---

## STEP 8 — BUILD AND DEPLOY AUTOMATICALLY

Run all steps without stopping or asking for confirmation:

1. npx tsc --noEmit
2. Fix ALL TypeScript errors if any exist
3. npm run build
4. railway up
5. railway logs --tail 40

After deploy verify:
- GET /api/monitor/stats → 200 with sector data
- GET /api/monitor/orgs → 200 with 55 organizations
- GET /api/monitor/jobs?sector=india → 200 (empty until first scan)
- POST /api/monitor/scan → 200 triggers background scan
- GET /api/jobs?candidate=dj → still works (regression check)
- GET /api/jobs?candidate=pooja → still works (regression check)

---

## SUCCESS CRITERIA — All must pass

- [ ] monitor_orgs table has 55 rows
- [ ] All 4 sectors present (academia/industry/international/india)
- [ ] GET /api/monitor/stats returns 4 sector entries
- [ ] GET /api/monitor/orgs returns 55 organizations
- [ ] POST /api/monitor/scan returns 200 without error
- [ ] Advisory lock logs appear: "Advisory lock acquired"
- [ ] Cron scheduler log: "Scheduler ready — scans at..."
- [ ] Expiry cleanup runs: "Expired N old job listings"
- [ ] Zero TypeScript compile errors
- [ ] No regressions on existing /api/jobs endpoints
- [ ] /health still returns 200
