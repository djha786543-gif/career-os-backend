import { pool } from '../db/client'
import { MONITOR_ORGS, MonitorOrg } from './orgConfig'
import crypto from 'crypto'
import { validateJobSuitability, TIER1_ORG_NAMES, HIGH_SUITABILITY_THRESHOLD } from './validateJobSuitability'
import { sendPoojaDigest } from '../notifications/mailer'

// ─── Pooja-Core Profile ────────────────────────────────────────────────────
// Rank 1 job title keywords — positions Pooja is actually targeting.
// Deliberately NO standalone 'scientist' or 'investigator' — too generic.
const POOJA_RANK1_KEYWORDS = [
  // Faculty / academic track
  'assistant professor', 'associate professor', 'tenure track', 'tenure-track', 'faculty',
  // Scientist track (compound phrases only)
  'research scientist', 'senior scientist', 'staff scientist', 'principal scientist',
  'scientist i', 'scientist ii', 'scientist iii', 'scientist 1', 'scientist 2', 'scientist 3',
  // Investigator track (compound phrases only)
  'senior investigator', 'principal investigator', 'associate investigator',
  'investigator i', 'investigator ii',
  // Group / lab leadership
  'group leader', 'lab head', 'team leader',
  // Fellowship / Associate
  'research fellow', 'research associate', 'project scientist', 'project fellow',
]

// Technical domain anchors — Pooja's core expertise.
// Any job that passes RANK1 but contains NONE of these is off-domain and rejected.
const TECHNICAL_ANCHORS = [
  // Cardiovascular biology
  'cardiovascular', 'cardiac', 'cardiology', 'heart', 'cardiomyopathy',
  'heart failure', 'atrial fibrillation', 'arrhythmia', 'vascular',
  // Molecular / cell biology core
  'molecular biology', 'molecular', 'cell biology', 'cellular biology',
  'genetics', 'genomics', 'epigenomics', 'chromatin',
  'transcriptomics', 'proteomics', 'metabolomics',
  // Technologies Pooja uses
  'crispr', 'gene editing', 'base editing', 'gene therapy',
  'rna', 'mrna', 'lncrna',
  'single cell', 'single-cell', 'spatial transcriptomics', 'spatial genomics',
  'bioinformatics', 'sequencing', 'ngs', 'next-generation sequencing',
  // Models & biology
  'in vivo', 'preclinical', 'mouse model', 'stem cell', 'ipsc', 'organoid',
  // Industry context
  'drug discovery', 'translational', 'target identification', 'biomarker',
]

// Hard filter: discard these title terms UNLESS the title is 'Assistant Professor'
const HARD_FILTER_TERMS = [
  'technician', 'postdoc', 'postdoctoral', 'intern', 'internship',
  'junior', 'admin', 'administrative', 'coordinator', 'assistant'
]

// TIER1_ORG_NAMES is imported from validateJobSuitability (single source of truth)

// Pooja-relevant job title and domain keywords (used for legacy relevance scoring)
const RELEVANT_KEYWORDS = [
  'research scientist', 'research associate',
  'senior scientist', 'staff scientist', 'principal scientist',
  'cardiovascular', 'molecular biology', 'cell biology', 'genomics',
  'sequencing', 'crispr', 'rna', 'cardiac', 'heart failure',
  'cardiomyopathy', 'transcriptomics', 'proteomics', 'bioinformatics',
  'research fellow', 'scientist i', 'scientist ii', 'scientist iii',
  'associate scientist', 'assistant professor', 'group leader',
  'investigator', 'faculty', 'tenure track',
  // Industry-specific expansions
  'drug discovery', 'in vivo', 'preclinical', 'translational research',
  'target identification', 'biomarker', 'mRNA', 'gene therapy',
]

// RECOMMENDATION 1: Strict location filtering
const RELEVANT_LOCATIONS = [
  // North America
  'usa', 'united states', 'new york', 'boston', 'san francisco',
  'seattle', 'chicago', 'houston', 'los angeles', 'bethesda',
  'cambridge, ma', 'cambridge ma', 'la jolla', 'san diego',
  'canada', 'toronto', 'montreal', 'vancouver',
  // UK
  'uk', 'united kingdom', 'london', 'edinburgh', 'oxford',
  'cambridge, uk', 'cambridge uk', 'manchester', 'glasgow',
  'sandwich, uk', 'stevenage',
  // Germany
  'germany', 'berlin', 'heidelberg', 'munich', 'frankfurt',
  'mainz', 'leverkusen', 'ingelheim', 'hamburg', 'darmstadt',
  // DACH
  'switzerland', 'zurich', 'basel', 'geneva',
  'austria', 'vienna',
  // Nordic
  'sweden', 'stockholm', 'gothenburg',
  'denmark', 'copenhagen', 'maaloev',
  // Western Europe
  'france', 'paris', 'lyon',
  'ireland', 'dublin',
  'netherlands', 'leiden', 'amsterdam',
  'belgium', 'brussels',
  // Asia
  'singapore',
  'japan', 'tokyo', 'osaka', 'kyoto',
  'south korea', 'korea', 'seoul', 'incheon',
  'china', 'shanghai', 'beijing', 'shenzhen',
  // Australia
  'australia', 'melbourne', 'sydney',
  // India
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

/**
 * Hard domain gate: at least one TECHNICAL_ANCHOR must appear in title or snippet.
 * Prevents off-domain jobs (oncology, neuroscience, immunology-only, data-science-only)
 * from passing just because they match RANK1 keyword + Tier 1 org.
 */
function hasTechnicalAnchor(title: string, snippet: string): boolean {
  const text = (title + ' ' + snippet).toLowerCase()
  return TECHNICAL_ANCHORS.some(a => text.includes(a))
}

/**
 * Detect research article / preprint URLs and titles.
 * These appear in organic results for academic institution queries.
 */
function isBioResearchArticle(title: string, url: string): boolean {
  const u = url.toLowerCase()
  // DOI / preprint / PubMed-style URLs
  if (u.includes('/doi/') || u.includes('doi.org/') || u.includes('/pmc/')) return true
  if (u.includes('/abstract/') || u.includes('/fulltext/') || u.includes('/article/')) return true
  const t = title.toLowerCase()
  // Paper-style title patterns
  if (/\bin (mice|rats|patients|humans|adults|subjects)\b/.test(t)) return true
  if (/\b(et al|doi:|volume \d|issue \d|\d{4};\s*\d)/.test(t)) return true
  if (/^(a |the )?(role|effect|impact|association|prevalence|mechanism|characterization) of\b/i.test(title)) return true
  return false
}

// RECOMMENDATION 1: Fixed location filter — require explicit location match
function isRelevantLocation(location: string = ''): boolean {
  if (!location || location.trim() === '') return false
  const loc = location.toLowerCase()
  return RELEVANT_LOCATIONS.some(l => loc.includes(l))
}

// Hard filter: returns false for roles Pooja should not see
// Exception: "assistant professor" is always allowed despite containing 'assistant'
function passesHardFilter(title: string): boolean {
  const t = title.toLowerCase()
  if (t.includes('assistant professor')) return true
  return !HARD_FILTER_TERMS.some(term => t.includes(term))
}

// Legacy shim — thin wrapper around validateJobSuitability for any remaining call sites.
// New code should call validateJobSuitability directly.
function poojaSuitabilityScore(title: string, snippet: string, orgName: string): number {
  return validateJobSuitability(title, snippet, null, orgName).matchScore
}

// Filter out generic social/landing-page URLs that don't point to actual job postings.
// Note: linkedin.com/jobs/view/... (specific listings) are kept — only company/profile pages rejected.
function extractCanonicalUrl(url: string, fallback: string): string {
  if (!url) return fallback
  const GENERIC_DOMAINS = [
    'linkedin.com/company', 'linkedin.com/in/',
    // linkedin.com/jobs/view/... are specific job listings → allowed through
    'twitter.com', 'x.com', 'facebook.com', 'instagram.com',
    'youtube.com', 'glassdoor.com/Overview', 'glassdoor.com/overview',
  ]
  if (GENERIC_DOMAINS.some(d => url.toLowerCase().includes(d.toLowerCase()))) return fallback
  return url
}

/**
 * URL quality gate — confirms the link points to an actual job posting.
 * Rejects: news, company bios, blog posts, social media, AND bio research articles / preprints.
 */
function isDirectJobUrl(url: string): boolean {
  if (!url || url === '#') return false
  const lower = url.toLowerCase()

  const NOISE_PATTERNS = [
    // General news & media
    'reuters.com', 'bloomberg.com', 'cnbc.com', 'wsj.com', 'forbes.com',
    'businessinsider.com', 'techcrunch.com', 'venturebeat.com',
    // Academic publishing & preprints — these are papers, not jobs
    'nature.com/articles', 'nature.com/news', 'nature.com/nbt',
    'sciencedirect.com', 'pubmed.ncbi', 'ncbi.nlm.nih.gov',
    'biorxiv.org', 'medrxiv.org', 'arxiv.org',
    'researchgate.net', 'academia.edu',
    'semanticscholar.org', 'jstor.org', 'scopus.com',
    'ahajournals.org/doi', 'jci.org/articles', 'nejm.org/doi',
    'thelancet.com/article', 'cell.com/cell/fulltext', 'cell.com/cell/pdf',
    'sciencemag.org', 'elifesciences.org/articles',
    'frontiersin.org/articles', 'mdpi.com/journal',
    '/doi/', '/pmc/', '/abstract/', '/fulltext/',
    // Social & general noise
    'wikipedia.org', 'twitter.com', 'x.com', 'facebook.com',
    'instagram.com', 'youtube.com',
    'linkedin.com/company', 'linkedin.com/in/',
    'glassdoor.com/overview', 'glassdoor.com/reviews', 'indeed.com/cmp/',
    // Generic company pages
    '/about-us', '/about/', '/team/', '/leadership/', '/history/',
    '/blog/', '/news/', '/press/', '/insights/', '/resources/',
    '/culture/', '/overview', '/company/',
  ]
  if (NOISE_PATTERNS.some(p => lower.includes(p))) return false

  const JOB_PATTERNS = [
    '/jobs/', '/job/', '/careers/', '/career/', '/openings/', '/vacancies/',
    '/position/', '/positions/', '/apply', '/requisition', '/job-id', '/jobid',
    '/posting/', '/postings/', '/opportunity/', '/opportunities/',
    'jobs.', 'careers.', 'apply.',
    'indeed.com/viewjob', 'indeed.com/rc/clk',
    'linkedin.com/jobs/view', 'linkedin.com/jobs/search',
    'lever.co/', 'greenhouse.io/', 'workday.com', 'myworkdayjobs.com',
    'taleo.net', 'icims.com', 'successfactors.com', 'smartrecruiters.com',
    'bamboohr.com', 'workable.com', 'ashbyhq.com', 'rippling.com/jobs',
    // Academic job boards
    'higheredjobs.com', 'academicpositions.', 'jobs.ac.uk',
    'eurosciencejobs.com', 'naturejobs.com', 'sciencecareers.org',
    'vitae.ac.uk', 'timeshighereducation.com/unijobs',
    // Indian job boards
    'naukri.com/job', 'indiabioscience.org', 'iimjobs.com/job',
  ]
  return JOB_PATTERNS.some(p => lower.includes(p))
}

/**
 * Snippet must contain language typical of a job description.
 * Requires at least 2 matches to filter out research abstracts with single incidental matches.
 */
function hasJobLanguage(snippet: string): boolean {
  if (!snippet) return false
  const s = snippet.toLowerCase()
  const JOB_WORDS = [
    'responsibilities', 'requirements', 'qualifications', 'years of experience',
    'required', 'preferred', 'skills', 'bachelor', 'phd',
    'apply', 'role', 'position', 'opportunity', 'we are looking',
    'you will', 'must have', 'salary', 'benefits', 'full-time', 'full time',
    'join our', 'join the team', 'we are seeking', 'we seek', 'ideal candidate',
    'what you will do', 'what you bring', 'about the role', 'about this role',
    'minimum qualification', 'basic qualification', 'experience in',
    'reporting to', 'work with', 'collaborate with',
  ]
  const matchCount = JOB_WORDS.filter(w => s.includes(w)).length
  return matchCount >= 2
}

/**
 * Agency / spam blocker — removes low-quality recruiter spam and mass postings.
 */
function isAgencySpam(title: string, snippet: string): boolean {
  const text = (title + ' ' + snippet).toLowerCase()
  const SPAM_SIGNALS = [
    'corp to corp', 'c2c', 'w2 only contract', 'no h1b', 'no h-1b',
    'multiple openings available', 'submit resume to', 'send resume to',
    'staffing company', 'staffing firm', 'recruiting agency',
    'on behalf of our client', 'contract corp-to-corp',
  ]
  return SPAM_SIGNALS.some(s => text.includes(s))
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
  highSuitability: boolean
}

const POOJA_CITY_RE = /\b(bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|tokyo|osaka|yokohama|singapore|seoul|busan|shanghai|beijing|guangzhou|boston|cambridge|san francisco|san diego|la jolla|los angeles|new york|seattle|bethesda|london|heidelberg|zurich|basel|stockholm|oslo|copenhagen|paris|amsterdam|dublin|toronto|montreal|sydney|melbourne)\b/i

// Google locale map — improves result relevance for non-US orgs
const GL_MAP: Record<string, string> = {
  'USA': 'us', 'Canada': 'ca', 'UK': 'gb', 'Germany': 'de',
  'Switzerland': 'ch', 'France': 'fr', 'Denmark': 'dk', 'Netherlands': 'nl',
  'Belgium': 'be', 'Ireland': 'ie', 'Sweden': 'se', 'Austria': 'at',
  'Japan': 'jp', 'Singapore': 'sg', 'South Korea': 'kr', 'China': 'cn',
  'Australia': 'au', 'India': 'in', 'Norway': 'no', 'Global': 'us',
}

// Serper web search — Google Jobs cards prioritised, organic fallback with quality gates.
export async function scanViaWebSearch(org: MonitorOrg): Promise<ScannedJob[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) {
    console.warn(`[Monitor] SERPER_API_KEY not set — skipping ${org.name}`)
    return []
  }
  const gl = GL_MAP[org.country] || 'us'
  try {
    const resp = await withTimeout(
      fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: org.searchQuery, num: 10, gl })
      }),
      10000,
      `Serper for ${org.name}`
    )
    if (!resp.ok) {
      console.error(`[Monitor] Serper ${resp.status} for ${org.name}`)
      return []
    }
    const data = await resp.json()
    const jobs: ScannedJob[] = []

    // ── Tier A: Google for Jobs structured cards (confirmed job listings) ──────
    const googleJobs: any[] = data.jobs || []
    console.log(`[Monitor] ${org.name}: Google Jobs cards=${googleJobs.length}`)

    for (const gj of googleJobs) {
      const title = (gj.title || '').trim()
      const company = (gj.companyName || org.name).trim()
      const location = gj.location || org.country
      const snippet = [
        gj.description || '',
        ...(gj.jobHighlights || []).flatMap((h: any) => h.items || []),
      ].join(' ').slice(0, 300)
      const link = gj.relatedLinks?.[0]?.link || gj.applyLink || ''
      const postedDate = gj.extensions?.find((e: string) => /ago|day|week|month/i.test(e)) || 'Recent'

      if (!title) continue
      if (isAgencySpam(title, snippet)) continue

      // ── Central validation pipeline (Gates 1-2-3 + weighted score) ───────
      // Relaxed mode for industry/international/india: skip seniority gate,
      // accept secondary domain anchors — more opportunities surface.
      const relaxed = ['industry', 'international', 'india'].includes(org.sector)
      const vr = validateJobSuitability(title, snippet, link, company, TIER1_ORG_NAMES, relaxed)
      if (!vr.passes) continue
      if (vr.matchScore < (relaxed ? 1 : 2)) continue

      if (!isRelevantLocation(location)) continue

      jobs.push({
        externalId: hashContent(title, company, link || location),
        title,
        orgName: company,
        location,
        country: org.country,
        applyUrl: link || org.careersUrl || '',
        snippet: snippet.slice(0, 150),
        postedDate,
        contentHash: hashContent(title, company, link || location),
        relevanceScore: relevanceScore(title, snippet),
        highSuitability: vr.highSuitability,
      })
    }

    // ── Tier B: Organic results — strict quality gates ────────────────────────
    const organicResults: any[] = data.organic || []
    console.log(`[Monitor] ${org.name}: organic=${organicResults.length}`)

    for (const r of organicResults) {
      // Strip trailing site attribution from title (e.g. "Scientist | Genentech Careers")
      const rawTitle = (r.title || '').trim()
      const title = rawTitle
        .replace(/\s*[|\-–—·]\s*(careers|jobs|indeed|linkedin|glassdoor|workday|lever|greenhouse|apply|join us)[^|]*$/i, '')
        .trim() || rawTitle
      const snippet = r.snippet || ''
      const link = r.link || ''

      if (!title) continue

      // ── URL quality gates (organic-specific: filter papers, aggregators, noise) ──
      if (isBioResearchArticle(title, link)) continue
      if (!isDirectJobUrl(link)) continue
      if (!hasJobLanguage(snippet)) continue
      if (isAgencySpam(title, snippet)) continue

      // ── Central validation pipeline (Gates 1-2-3 + weighted score) ───────
      const relaxedOrganic = ['industry', 'international', 'india'].includes(org.sector)
      const vr = validateJobSuitability(title, snippet, link, org.name, TIER1_ORG_NAMES, relaxedOrganic)
      if (!vr.passes) continue
      if (vr.matchScore < (relaxedOrganic ? 1 : 3)) continue

      const cityMatch = snippet.match(POOJA_CITY_RE) || title.match(POOJA_CITY_RE)
      const location = cityMatch ? cityMatch[0] : org.country
      if (!isRelevantLocation(location)) continue

      jobs.push({
        externalId: hashContent(title, org.name, link),
        title,
        orgName: org.name,
        location,
        country: org.country,
        applyUrl: extractCanonicalUrl(link, org.careersUrl || ''),
        snippet: snippet.slice(0, 150),
        postedDate: 'Recent',
        contentHash: hashContent(title, org.name, link),
        relevanceScore: relevanceScore(title, snippet),
        highSuitability: vr.highSuitability,
      })
    }

    console.log(`[Monitor] ${org.name}: ${jobs.length} total after filter`)
    return jobs.sort((a, b) => b.relevanceScore - a.relevanceScore)
  } catch (err) {
    console.error(`[Monitor] Serper failed ${org.name}:`, (err as Error).message)
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

    const validated: ScannedJob[] = []
    for (const item of items) {
      const d = item.MatchedObjectDescriptor
      const title   = (d.PositionTitle || '').trim()
      const snippet = (d.UserArea?.Details?.JobSummary || '').slice(0, 150)
      const location = d.PositionLocation?.[0]?.LocationName || 'Washington DC, USA'
      const applyUrl = d.ApplyURI?.[0] || ''

      if (!title) continue
      if (isAgencySpam(title, snippet)) continue

      // Central validation pipeline — USAJobs listings are trusted, threshold ≥ 2
      const relaxedUSA = ['industry', 'international', 'india'].includes(org.sector)
      const vr = validateJobSuitability(title, snippet, applyUrl, d.OrganizationName || org.name, TIER1_ORG_NAMES, relaxedUSA)
      if (!vr.passes) continue
      if (vr.matchScore < (relaxedUSA ? 1 : 2)) continue

      validated.push({
        externalId: d.PositionID || hashContent(title, org.name, location),
        title,
        orgName: d.OrganizationName || org.name,
        location,
        country: 'USA',
        applyUrl,
        snippet,
        postedDate: d.PublicationStartDate?.split('T')[0] || 'Recent',
        contentHash: hashContent(title, org.name, location),
        relevanceScore: relevanceScore(title, snippet),
        highSuitability: vr.highSuitability,
      })
    }
    return validated
  } catch (err) {
    console.error(`[Monitor] USAJobs failed for ${org.name}:`, (err as Error).message)
    return scanViaWebSearch(org)
  }
}

async function scanViaRSS(org: MonitorOrg): Promise<ScannedJob[]> {
  if (!org.rssUrl) return scanViaWebSearch(org)
  try {
    const resp = await withTimeout(
      fetch(org.rssUrl, {
        headers: {
          'User-Agent': 'career-os-portal/1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      }),
      8000,
      `RSS for ${org.name}`
    )

    const text = await resp.text()
    const items: ScannedJob[] = []
    const itemMatches = text.match(/<item>([\s\S]*?)<\/item>/g) || []
    console.log(`[RSS] ${org.name}: status=${resp.status} items=${itemMatches.length}`)

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

      if (isBioResearchArticle(title, link)) continue  // reject papers / preprints
      if (isAgencySpam(title, desc)) continue

      // ── Central validation pipeline (Gates 1-2-3 + weighted score) ───────
      const relaxedRSS = ['industry', 'international', 'india'].includes(org.sector)
      const vr = validateJobSuitability(title, desc, link, org.name, TIER1_ORG_NAMES, relaxedRSS)
      if (!vr.passes) continue
      if (vr.matchScore < (relaxedRSS ? 1 : 2)) continue

      // Extract city from description / title, fall back to org country
      const rssCity = desc.match(POOJA_CITY_RE) || title.match(POOJA_CITY_RE)
      const location = rssCity ? rssCity[0] : org.country
      if (!isRelevantLocation(location)) continue

      items.push({
        externalId: hashContent(title, org.name, location),
        title,
        orgName: org.name,
        location,
        country: org.country,
        applyUrl: extractCanonicalUrl(link, org.careersUrl || ''),
        snippet: desc,
        postedDate: pubDate,
        contentHash: hashContent(title, org.name, location),
        relevanceScore: relevanceScore(title, desc),
        highSuitability: vr.highSuitability,
      })
    }

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

export async function scanOrg(orgId: string, org: MonitorOrg): Promise<{
  found: number, newJobs: number, error?: string
}> {
  let jobs: ScannedJob[] = []

  try {
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
            high_suitability, is_new, is_active, last_seen_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,true,NOW())
         ON CONFLICT (org_id, external_id) DO UPDATE
           SET is_active = true,
               last_seen_at = NOW(),
               high_suitability = $12,
               is_new = CASE
                 WHEN monitor_jobs.content_hash != $11 THEN true
                 ELSE monitor_jobs.is_new
               END,
               content_hash = $11
         RETURNING (xmax = 0) as inserted`,
        [orgId, job.externalId, job.title, job.orgName,
         job.location, job.country, org.sector,
         job.applyUrl, job.snippet, job.postedDate, job.contentHash,
         job.highSuitability]
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
export async function runFullScan(): Promise<void> {
  const lockId = 987654321

  let lockAcquired = false
  let client

  try {
    client = await pool.connect()

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
    const runStart = new Date()

    // Scan 20 orgs per run (oldest-first). 134 active orgs rotate fully every ~7 days.
    // Scan runs fire-and-forget so Railway timeout is not a concern.
    const orgs = await pool.query(
      `SELECT id, name FROM monitor_orgs
       WHERE is_active = true
       ORDER BY last_scanned_at ASC NULLS FIRST
       LIMIT 20`
    )

    for (const row of orgs.rows) {
      const orgConfig = MONITOR_ORGS.find(o => o.name === row.name)
      if (!orgConfig) continue
      await scanOrg(row.id, orgConfig)
      // slowFetch orgs get extra delay to respect their rate limits
      const delay = orgConfig.slowFetch ? 8000 : 3000
      await new Promise(r => setTimeout(r, delay))
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

    // Send email digest for any new high-suitability jobs found this run
    await sendPoojaDigest(runStart)

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
