import { Job } from '../models/Job';
import { Candidate } from '../models/Candidate';
import { computeMatchScore } from '../utils/matchScore';
import { classifyAcademicIndustry } from '../utils/classifyAcademicIndustry';
import { poojaProfiles } from '../models/PoojaProfiles';
import { Track } from '../models/Track';

export interface JobFilters {
  remote?: string | boolean; hybrid?: string | boolean;
  visaSponsorship?: string | boolean; seniority?: string;
  salaryMin?: string | number; salaryMax?: string | number;
}

function toBool(v: string | boolean | undefined) { if (v === undefined) return undefined; if (typeof v === 'boolean') return v; return v === 'true'; }
function toNum(v: string | number | undefined) { if (v === undefined) return undefined; const n = Number(v); return isNaN(n) ? undefined : n; }

// Word-boundary regex — 'intern' must not match 'internal'
function makeBlockRegex(keywords: string[]): RegExp {
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp('(?<![a-z])(' + escaped.join('|') + ')(?![a-z])', 'i');
}

// Deobrat: 10yr Manager — block intern/junior/entry level (word-boundary safe)
const DJ_BLOCK_REGEX = makeBlockRegex([
  'intern', 'internship', 'trainee', 'apprentice',
  'entry level', 'entry-level', 'junior', 'jr\\.',
  'graduate program', 'new grad', 'co-op', 'coop',
  'assistant auditor', 'audit clerk', 'audit assistant',
  'staff accountant', 'bookkeeper',
]);

// Pooja: postdoc researcher — block undergrad/tech/student roles
const PJ_BLOCK_REGEX = makeBlockRegex([
  'intern', 'internship', 'trainee', 'undergraduate', 'undergrad',
  'lab aide', 'lab assistant', 'lab technician',
  'research technician', 'research technologist',
  'laboratory technician', 'laboratory assistant',
  'junior researcher', 'junior scientist',
  'student researcher', 'phd student', 'graduate student',
  'visiting student', 'co-op', 'coop',
]);

const MIN_FIT = 40;

export function filterAndScoreJobs(
  jobs: Job[],
  candidate: Candidate & { track?: Track },
  filters: JobFilters,
): Job[] {
  let scoringProfile: Candidate = candidate;
  if (candidate.id === 'pooja' && candidate.track) {
    const td = poojaProfiles[candidate.track];
    if (td) scoringProfile = { ...candidate, skills: td.skills, specialization: td.specialization, experienceYears: td.experienceYears };
  }

  const wantRemote = toBool(filters.remote), wantHybrid = toBool(filters.hybrid), wantVisa = toBool(filters.visaSponsorship);
  const wantSeniority = filters.seniority ? String(filters.seniority).toLowerCase() : undefined;
  const wantSalMin = toNum(filters.salaryMin), wantSalMax = toNum(filters.salaryMax);
  const isDJ = candidate.id === 'deobrat', isPJ = candidate.id === 'pooja';

  const filtered = jobs.filter(job => {
    const title = job.title || '';
    // Word-boundary safe blocking — 'intern' won't match 'internal'
    if (isDJ && DJ_BLOCK_REGEX.test(title)) {
      console.log(`[Filter] Blocking DJ title: "${title}"`);
      return false;
    }
    if (isPJ && PJ_BLOCK_REGEX.test(title)) {
      console.log(`[Filter] Blocking PJ title: "${title}"`);
      return false;
    }
    if (isPJ && candidate.track && classifyAcademicIndustry(job) !== candidate.track) return false;
    if (wantRemote === true && !job.remote) return false;
    if (wantHybrid === true && !job.hybrid) return false;
    if (wantVisa   === true && !job.visaSponsorship) return false;
    if (wantSeniority && !job.experienceLevel.toLowerCase().includes(wantSeniority)) return false;
    if (wantSalMin !== undefined && job.salaryRange && job.salaryRange.max < wantSalMin) return false;
    if (wantSalMax !== undefined && job.salaryRange && job.salaryRange.min > wantSalMax) return false;
    return true;
  });

  const scored = filtered
    .map(j => ({ ...j, matchScore: computeMatchScore(j, scoringProfile), fitScore: computeMatchScore(j, scoringProfile) }))
    .filter(j => (j.fitScore ?? 0) >= MIN_FIT);

  // Company dedup: keep highest-scored per company
  const best = new Map<string, typeof scored[0]>();
  for (const j of scored) {
    const k = (j.company || '').toLowerCase().trim() || j.id;
    const ex = best.get(k);
    if (!ex || (j.fitScore ?? 0) > (ex.fitScore ?? 0)) best.set(k, j);
  }

  return Array.from(best.values()).sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
}
