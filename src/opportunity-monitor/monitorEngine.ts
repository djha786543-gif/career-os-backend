import { pool } from '../db/client'
import { MONITOR_ORGS, MonitorOrg } from './orgConfig'
import crypto from 'crypto'
import { sendPoojaDigest } from '../notifications/mailer'
import { sendPoojaTelegram } from '../notifications/telegram'

// ─── Pooja-Core Profile ────────────────────────────────────────────────────
// Rank 1 job title keywords — positions Pooja is actually targeting
const POOJA_RANK1_KEYWORDS = [
  'assistant professor', 'scientist', 'investigator', 'research scientist',
  'group leader', 'tenure track', 'tenure-track', 'faculty', 'staff scientist',
  'senior scientist', 'principal scientist', 'research fellow',
  'research associate', 'project scientist', 'project fellow',
]

// Technical domain anchors — Pooja's core expertise areas
const TECHNICAL_ANCHORS = [
  'molecular', 'genetics', 'cardiovascular', 'genomics', 'bioinformatics',
  'cell biology', 'molecular biology', 'cardiac', 'transcriptomics',
  'proteomics', 'crispr', 'rna', 'heart'
]

// Hard filter: discard these title terms UNLESS the title is 'Assistant Professor'
const HARD_FILTER_TERMS = [
  'technician', 'postdoc', 'postdoctoral', 'intern', 'internship',
  'junior', 'admin', 'administrative', 'coordinator', 'assistant'
]

// Noise filter: discard non-job content (events, notices, non-science roles, etc.)
// These patterns appear in scraped Indian institute pages and should never be stored.
const NOISE_FILTER_TERMS = [
  // Event / workshop announcements
  'workshop', 'seminar', 'conference', 'symposium', 'webinar', 'colloquium',
  'talk by', 'invited talk', 'lecture by', 'annual meeting',
  // Exam / result / circular noise
  'merit list', 'answer key', 'question paper', 'old question', 'previous year',
  'written test', 'exam schedule', 'interview schedule', 'exam notice',
  'syllabus for', 'tender', 'e-tender', 'rate contract', 'quotation',
  // Non-science administrative roles
  'librarian', 'accountant', 'finance officer', 'accounts officer',
  'registrar', 'deputy registrar', 'assistant registrar',
  'store keeper', 'storekeeper', 'purchase officer', 'purchase assistant',
  'housekeeping', 'sanitation', 'peon', 'multi tasking staff', 'mts ',
  'computer operator', 'data entry operator', 'data entry', 'typist', 'stenographer',
  'electrician', 'plumber', 'driver', 'ldc ', 'lower division clerk',
  'upper division clerk', 'udc ', 'canteen attendant', 'security guard',
  // Closed/applied status noise
  'last date extended', 'walk-in interview', 'walk in interview',
  'applications are invited', 'applications invited',
  // Admission notices
  'admission notice', 'admission fee', 'fee structure', 'prospectus',
  // Faculty directory / department info pages (NOT job postings)
  'faculty members', 'faculty member', 'our faculty', 'meet the faculty',
  'school of biology', 'school of biosciences', 'school of life',
  'department of biosciences', 'department of biochemical', 'department of biology',
  'department of biotechnology', 'department of molecular',
  // Entry-level / archive aggregator content
  'freshers', 'fresher job', 'fresher vacancy',
  // Generic recruitment listing pages (not a specific opening)
  'recruitment 2025', 'recruitment 2024', 'recruitment 2023',
  'vacancy 2025', 'vacancy 2024', 'vacancies 2025',
  'jobs 2025', 'jobs 2024',
]

// URL noise patterns — skip results whose URL suggests non-job content
const URL_NOISE_PATTERNS = [
  '.pdf', '/events/', '/event/', '/seminar/', '/workshop/', '/conference/',
  '/notices/', '/notice/', '/circular/', '/tender/', '/results/', '/result/',
  '/admissions/', '/admission/', '/exam/', '/syllabus/',
  'faculty-profile', 'staff-profile', '/people/', '/person/',
  'profile.aspx', 'profile.php', '/directory/', 'faculty-directory',
  '/faculty/', 'faculty.html', 'faculty.php',
  // Aggregator archive sites — not direct institute postings
  'biotecnika.org', 'pharmatutor.org', 'biotecharticles.com',
  'indiabioscience.org/blogs', 'indiabioscience.org/articles',
  'naukri.com/blog', 'shine.com/articles',
]

// Tier 1 orgs for +1 suitability bonus
const TIER1_ORG_NAMES = new Set([
  'Harvard Medical School', 'Stanford Medicine', 'MIT Biology', 'UCSF',
  'Broad Institute', 'Johns Hopkins Medicine', 'Mayo Clinic Research',
  'Salk Institute', 'Columbia University Medical Center', 'Yale School of Medicine',
  'Gladstone Institutes', 'Scripps Research', 'UT Southwestern Medical Center',
  'Baylor College of Medicine', 'Washington University St Louis', 'Weill Cornell Medicine',
  'NIH NHLBI', 'NIH NIGMS', 'NIH NCI',
  'Karolinska Institute', 'ETH Zurich', 'EMBL Jobs', 'Francis Crick Institute',
  'Wellcome Sanger Institute', 'Max Planck Heart and Lung', 'Roche',
  'Genentech', 'Regeneron', 'Amgen', 'Pfizer Research', 'Merck Research',
  'NCBS Bangalore', 'IISc Bangalore', 'TIFR Mumbai',
  // Europe industry tier-1
  'AstraZeneca UK', 'GSK UK', 'Novartis Basel', 'Roche Research Basel',
  'Bayer Life Sciences', 'Boehringer Ingelheim', 'Novo Nordisk',
  'BioNTech Germany', 'Sanofi Paris', 'UCB Pharma Belgium',
  // Asia industry tier-1
  'Daiichi Sankyo Japan', 'Takeda Japan', 'AstraZeneca China', 'Roche China',
])

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

// Noise filter: rejects event announcements, admin notices, non-science roles
function passesNoiseFilter(title: string): boolean {
  const t = title.toLowerCase()
  if (NOISE_FILTER_TERMS.some(term => t.includes(term))) return false
  // Reject individual person-name titles (faculty profiles returned by Google)
  // Pattern: starts with "Dr." / "Prof." OR is a plain name (2-3 words, no job keywords)
  if (/^(dr\.|prof\.|professor |mr\.|ms\.|mrs\.)/i.test(title.trim())) return false
  return true
}

// URL filter: rejects PDFs, profile pages, event/notice pages, aggregator archives
function passesUrlFilter(url: string): boolean {
  if (!url) return true
  const u = url.toLowerCase()
  return !URL_NOISE_PATTERNS.some(pat => u.includes(pat))
}

// Pooja suitability scorer (0–5 scale). Jobs must score ≥ 3 to be stored.
function poojaSuitabilityScore(title: string, snippet: string, orgName: string): number {
  const text = (title + ' ' + snippet).toLowerCase()
  let score = 0
  if (POOJA_RANK1_KEYWORDS.some(kw => text.includes(kw))) score += 2
  if (TECHNICAL_ANCHORS.some(anchor => text.includes(anchor))) score += 2
  if (TIER1_ORG_NAMES.has(orgName)) score += 1
  return score
}

// Filter out generic social/landing-page URLs that don't point to actual job postings
function extractCanonicalUrl(url: string, fallback: string): string {
  if (!url) return fallback
  const GENERIC_DOMAINS = [
    'linkedin.com/company', 'linkedin.com/in/', 'linkedin.com/jobs',
    'twitter.com', 'x.com', 'facebook.com', 'instagram.com',
    'youtube.com', 'glassdoor.com/Overview'
  ]
  if (GENERIC_DOMAINS.some(d => url.includes(d))) return fallback
  return url
}

/**
 * URL quality gate — confirms the link points to an actual job posting.
 * Rejects news sites, company bios, blog posts, social media.
 */
function isDirectJobUrl(url: string): boolean {
  if (!url || url === '#') return false
  const lower = url.toLowerCase()

  const NOISE_PATTERNS = [
    'reuters.com', 'bloomberg.com', 'cnbc.com', 'wsj.com', 'forbes.com',
    'businessinsider.com', 'techcrunch.com', 'nature.com/articles',
    'sciencedirect.com', 'pubmed.ncbi', 'ncbi.nlm.nih.gov/pubmed',
    'wikipedia.org', 'twitter.com', 'x.com', 'facebook.com',
    'instagram.com', 'youtube.com',
    'linkedin.com/company', 'linkedin.com/in/', 'glassdoor.com/overview',
    'glassdoor.com/reviews', 'indeed.com/cmp/',
    '/about-us', '/about/', '/team/', '/leadership/', '/history/',
    '/blog/', '/news/', '/press/', '/insights/', '/article/', '/resources/',
    '/culture/', '/overview', '/company/',
  ]
  if (NOISE_PATTERNS.some(p => lower.includes(p))) return false

  const JOB_PATTERNS = [
    '/jobs/', '/job/', '/careers/', '/career/', '/openings/', '/vacancies/',
    '/position/', '/apply', '/requisition', '/job-id', '/jobid',
    'jobs.', 'careers.', 'apply.',
    'indeed.com/viewjob', 'linkedin.com/jobs/view',
    'lever.co/', 'greenhouse.io/', 'workday.com', 'myworkdayjobs.com',
    'taleo.net', 'icims.com', 'successfactors.com', 'smartrecruiters.com',
    'bamboohr.com', 'workable.com', 'ashbyhq.com',
  ]
  return JOB_PATTERNS.some(p => lower.includes(p))
}

/**
 * Snippet must contain language typical of a job description.
 * Filters out news summaries, press releases, and research abstracts.
 */
function hasJobLanguage(snippet: string): boolean {
  if (!snippet) return false
  const s = snippet.toLowerCase()
  const JOB_WORDS = [
    'responsibilities', 'requirements', 'qualifications', 'years of experience',
    'required', 'preferred', 'skills', 'bachelor', 'phd', 'postdoc',
    'apply', 'role', 'position', 'opportunity', 'we are looking',
    'you will', 'must have', 'salary', 'benefits', 'full-time',
  ]
  return JOB_WORDS.some(w => s.includes(w))
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

const POOJA_CITY_RE = /\b(bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|kolkata|tokyo|osaka|yokohama|singapore|seoul|busan|shanghai|beijing|guangzhou|shenzhen|boston|cambridge|san francisco|san diego|la jolla|los angeles|new york|seattle|bethesda|new haven|philadelphia|baltimore|houston|chicago|durham|raleigh|london|oxford|edinburgh|manchester|birmingham|stevenage|sandwich|heidelberg|munich|berlin|frankfurt|hamburg|mannheim|darmstadt|mainz|leverkusen|zurich|basel|geneva|lausanne|bern|vienna|graz|stockholm|gothenburg|malmö|malmoe|oslo|bergen|copenhagen|aarhus|paris|lyon|marseille|strasbourg|toulouse|amsterdam|leiden|utrecht|rotterdam|ghent|brussels|antwerp|liege|dublin|cork|madrid|barcelona|milan|rome|florence|bologna|helsinki|tampere|singapore|toronto|montreal|vancouver|calgary|sydney|melbourne|brisbane|perth)\b/i

// Serper web search — Google Jobs cards prioritised, organic fallback with quality gates.
export async function scanViaWebSearch(org: MonitorOrg): Promise<ScannedJob[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) {
    console.warn(`[Monitor] SERPER_API_KEY not set — skipping ${org.name}`)
    return []
  }
  try {
    const resp = await withTimeout(
      fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: org.searchQuery, num: 10 })
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
      ].join(' ').slice(0, 400)
      const link = gj.relatedLinks?.[0]?.link || gj.applyLink || ''
      const postedDate = gj.extensions?.find((e: string) => /ago|day|week|month/i.test(e)) || 'Recent'

      if (!title) continue
      if (!passesHardFilter(title)) continue
      if (!passesNoiseFilter(title)) continue    // faculty profiles, dept pages, archives
      if (!passesUrlFilter(link)) continue        // aggregator archives, PDF links
      if (!isRelevant(title, snippet)) continue
      if (isAgencySpam(title, snippet)) continue

      // Lower suitability threshold for confirmed listings
      const suitability = poojaSuitabilityScore(title, snippet, company)
      if (suitability < 2) continue

      if (!isRelevantLocation(location)) continue

      jobs.push({
        externalId: hashContent(title, company, link || location),
        title,
        orgName: company,
        location,
        country: org.country,
        applyUrl: link || org.careersUrl || '',
        snippet: snippet.slice(0, 300),
        postedDate,
        contentHash: hashContent(title, company, link || location),
        relevanceScore: relevanceScore(title, snippet),
        highSuitability: suitability >= 3,
      })
    }

    // ── Tier B: Organic results — strict quality gates ────────────────────────
    const organicResults: any[] = data.organic || []
    console.log(`[Monitor] ${org.name}: organic=${organicResults.length}`)

    for (const r of organicResults) {
      const title = (r.title || '').replace(/\s*[-|·].*$/, '').trim()
      const snippet = r.snippet || ''
      const link = r.link || ''

      if (!title) continue

      // Strict gates for organic (could be news/blog/aggregator)
      if (!isDirectJobUrl(link)) continue
      if (!passesUrlFilter(link)) continue       // PDF / profile / notice pages
      if (!hasJobLanguage(snippet)) continue
      if (!isRelevant(title, snippet)) continue
      if (!passesHardFilter(title)) continue
      if (!passesNoiseFilter(title)) continue    // event / admin role / circular noise
      if (isAgencySpam(title, snippet)) continue

      const suitability = poojaSuitabilityScore(title, snippet, org.name)
      if (suitability < 3) continue  // Stricter threshold for unverified organic

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
        snippet: snippet.slice(0, 300),
        postedDate: 'Recent',
        contentHash: hashContent(title, org.name, link),
        relevanceScore: relevanceScore(title, snippet),
        highSuitability: suitability >= 3,
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

    return items
      .filter((item: any) => {
        const title = item.MatchedObjectDescriptor?.PositionTitle || ''
        return isRelevant(title) && passesHardFilter(title)
      })
      .filter((item: any) => {
        const d = item.MatchedObjectDescriptor
        const title = d.PositionTitle || ''
        const snippet = (d.UserArea?.Details?.JobSummary || '').slice(0, 300)
        return poojaSuitabilityScore(title, snippet, org.name) >= 3
      })
      .map((item: any) => {
        const d = item.MatchedObjectDescriptor
        const title = d.PositionTitle || ''
        const location = d.PositionLocation?.[0]?.LocationName || 'Washington DC, USA'
        const snippet = (d.UserArea?.Details?.JobSummary || '').slice(0, 300)
        return {
          externalId: d.PositionID || hashContent(title, org.name, location),
          title,
          orgName: d.OrganizationName || org.name,
          location,
          country: 'USA',
          applyUrl: d.ApplyURI?.[0] || '',
          snippet,
          postedDate: d.PublicationStartDate?.split('T')[0] || 'Recent',
          contentHash: hashContent(title, org.name, location),
          relevanceScore: relevanceScore(title),
          highSuitability: true
        }
      })
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
      ).replace(/<[^>]+>/g, '').slice(0, 300).trim()

      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || 'Recent'

      if (!isRelevant(title, desc)) continue
      if (!passesHardFilter(title)) continue
      if (isAgencySpam(title, desc)) continue

      // For RSS — extract city from description if available, fall back to org country
      const rssCity = desc.match(POOJA_CITY_RE) || title.match(POOJA_CITY_RE)
      const location = rssCity ? rssCity[0] : org.country

      if (!isRelevantLocation(location)) continue

      // Lower threshold for RSS (confirmed listings) vs websearch
      const suitability = poojaSuitabilityScore(title, desc, org.name)
      if (suitability < 2) continue

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
        highSuitability: suitability >= 3
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
  const runStart = new Date()

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

    // ── Retroactive DB cleanup — purge noise from all existing records ────────
    // Runs on every scan cycle so old dirty data is cleared without a manual migration.
    const purged = await pool.query(`
      UPDATE monitor_jobs SET is_active = false
      WHERE is_active = true AND (
        -- Title: event / workshop / announcement noise
        title ILIKE '%workshop%' OR title ILIKE '%seminar%'
        OR title ILIKE '%conference%' OR title ILIKE '%symposium%'
        OR title ILIKE '%webinar%' OR title ILIKE '%colloquium%'
        -- Title: exam / result / circular noise
        OR title ILIKE '%merit list%' OR title ILIKE '%answer key%'
        OR title ILIKE '%question paper%' OR title ILIKE '%written test%'
        OR title ILIKE '%tender%' OR title ILIKE '%syllabus for%'
        OR title ILIKE '%interview schedule%' OR title ILIKE '%exam notice%'
        OR title ILIKE '%rate contract%' OR title ILIKE '%quotation%'
        -- Title: non-science administrative roles
        OR title ILIKE '%librarian%' OR title ILIKE '%accountant%'
        OR title ILIKE '%finance officer%' OR title ILIKE '%registrar%'
        OR title ILIKE '%store keeper%' OR title ILIKE '%storekeeper%'
        OR title ILIKE '%housekeeping%' OR title ILIKE '%sanitation%'
        OR title ILIKE '% peon %' OR title ILIKE '%peon)'
        OR title ILIKE '%multi tasking staff%' OR title ILIKE '% mts %'
        OR title ILIKE '%computer operator%' OR title ILIKE '%data entry%'
        OR title ILIKE '%stenographer%' OR title ILIKE '%electrician%'
        OR title ILIKE '%plumber%' OR title ILIKE '% driver%'
        OR title ILIKE '%lower division clerk%' OR title ILIKE '% ldc %'
        OR title ILIKE '%security guard%' OR title ILIKE '%canteen%'
        -- Title: walk-in / admission notices
        OR title ILIKE '%walk-in interview%' OR title ILIKE '%walk in interview%'
        OR title ILIKE '%admission notice%' OR title ILIKE '%admission fee%'
        OR title ILIKE '%last date extended%'
        -- Title: faculty directory / department info pages
        OR title ILIKE '%faculty members%' OR title ILIKE '%faculty member%'
        OR title ILIKE '%our faculty%' OR title ILIKE '%meet the faculty%'
        OR title ILIKE '%school of biology%' OR title ILIKE '%school of biosciences%'
        OR title ILIKE '%department of biosciences%' OR title ILIKE '%department of biochemical%'
        OR title ILIKE '%department of biology%' OR title ILIKE '%department of biotechnology%'
        OR title ILIKE '%department of molecular%'
        -- Title: entry-level / old archive content
        OR title ILIKE '%freshers%'
        OR title ILIKE '%recruitment 2025%' OR title ILIKE '%recruitment 2024%'
        OR title ILIKE '%vacancy 2025%' OR title ILIKE '%vacancy 2024%'
        OR title ILIKE '%jobs 2025%' OR title ILIKE '%jobs 2024%'
        -- Title: individual person names (Dr./Prof. prefix = faculty profile not job)
        OR title ~* '^\s*(Dr\.|Prof\.|Professor |Mr\.|Ms\.|Mrs\.)'
        -- URL: PDF documents
        OR apply_url ILIKE '%.pdf'
        -- URL: event / notice / profile pages
        OR apply_url ILIKE '%/events/%' OR apply_url ILIKE '%/event/%'
        OR apply_url ILIKE '%/seminar/%' OR apply_url ILIKE '%/workshop/%'
        OR apply_url ILIKE '%/notices/%' OR apply_url ILIKE '%/notice/%'
        OR apply_url ILIKE '%/circular/%' OR apply_url ILIKE '%/tender/%'
        OR apply_url ILIKE '%/results/%' OR apply_url ILIKE '%/result/%'
        OR apply_url ILIKE '%/admissions/%' OR apply_url ILIKE '%/admission/%'
        OR apply_url ILIKE '%faculty-profile%' OR apply_url ILIKE '%/people/%'
        OR apply_url ILIKE '%/directory/%' OR apply_url ILIKE '%/exam/%'
        OR apply_url ILIKE '%/faculty/%' OR apply_url ILIKE '%faculty.html%'
        -- URL: aggregator archive sites
        OR apply_url ILIKE '%biotecnika.org%'
        OR apply_url ILIKE '%pharmatutor.org%'
        OR apply_url ILIKE '%biotecharticles.com%'
        -- Age: listings older than 30 days
        OR detected_at < NOW() - INTERVAL '30 days'
      )
      RETURNING id
    `)
    if (purged.rows.length > 0) {
      console.log(`[Monitor] Retroactive cleanup: deactivated ${purged.rows.length} noisy/stale records`)
    }

    // Cost optimisation: scan 15 orgs per run (oldest-first).
    // All 85+ orgs rotate over ~6 days.
    const orgs = await pool.query(
      `SELECT id, name FROM monitor_orgs
       WHERE is_active = true
       ORDER BY last_scanned_at ASC NULLS FIRST
       LIMIT 15`
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

    console.log('[Monitor] Full scan complete')

    await sendPoojaDigest(runStart)
    await sendPoojaTelegram(runStart)

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
