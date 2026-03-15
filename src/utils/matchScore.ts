import { Job } from '../models/Job';
import { Candidate } from '../models/Candidate';

interface KeywordWeight { kw: string; pts: number }

// ── DJ (Deobrat) keyword weights ──────────────────────────────────────────────
const DJ_KEYWORDS: KeywordWeight[] = [
  // High +15 — core IT audit domain
  { kw: 'cisa',              pts: 15 },
  { kw: 'sox',               pts: 15 },
  { kw: 'itgc',              pts: 15 },
  { kw: 'it audit',          pts: 15 },
  { kw: 'grc',               pts: 15 },
  { kw: 'ai governance',     pts: 15 },
  { kw: 'cloud security',    pts: 15 },
  { kw: 'risk management',   pts: 15 },
  // Medium +10 — closely related
  { kw: 'compliance',        pts: 10 },
  { kw: 'internal audit',    pts: 10 },
  { kw: 'audit',             pts: 10 },
  { kw: 'information security', pts: 10 },
  { kw: 'aws',               pts: 10 },
  { kw: 'azure',             pts: 10 },
  { kw: 'nist',              pts: 10 },
  { kw: 'iso 27001',         pts: 10 },
  { kw: 'governance',        pts: 10 },
  { kw: 'risk',              pts: 10 },
  { kw: 'controls',          pts: 10 },
  // Low +5 — broad indicators
  { kw: 'technology audit',  pts: 5 },
  { kw: 'it manager',        pts: 5 },
  { kw: 'technology',        pts: 5 },
  { kw: 'manager',           pts: 5 },
  { kw: 'senior',            pts: 5 },
  { kw: 'director',          pts: 5 },
];

// ── Pooja keyword weights ─────────────────────────────────────────────────────
const PJ_KEYWORDS: KeywordWeight[] = [
  // High +15 — core research domain
  { kw: 'postdoc',            pts: 15 },
  { kw: 'postdoctoral',       pts: 15 },
  { kw: 'cardiovascular',     pts: 15 },
  { kw: 'molecular biology',  pts: 15 },
  { kw: 'cell biology',       pts: 15 },
  { kw: 'research scientist', pts: 15 },
  { kw: 'research fellow',    pts: 15 },
  // Medium +10 — closely related
  { kw: 'genomics',           pts: 10 },
  { kw: 'rna-seq',            pts: 10 },
  { kw: 'rna',                pts: 10 },
  { kw: 'sequencing',         pts: 10 },
  { kw: 'crispr',             pts: 10 },
  { kw: 'biology',            pts: 10 },
  { kw: 'cardiac',            pts: 10 },
  { kw: 'heart',              pts: 10 },
  { kw: 'research associate', pts: 10 },
  { kw: 'scientist',          pts: 10 },
  // Low +5 — broad indicators
  { kw: 'research',           pts: 5 },
  { kw: 'laboratory',         pts: 5 },
  { kw: 'lab',                pts: 5 },
  { kw: 'science',            pts: 5 },
  { kw: 'medicine',           pts: 5 },
  { kw: 'university',         pts: 5 },
  { kw: 'academic',           pts: 5 },
  { kw: 'institute',          pts: 5 },
];

export function computeMatchScore(job: Job, candidate: Candidate): number {
  const text = `${job.title} ${job.description}`.toLowerCase();

  let score = 20; // base score

  const keywords =
    candidate.id === 'deobrat' ? DJ_KEYWORDS :
    candidate.id === 'pooja'   ? PJ_KEYWORDS : [];

  for (const { kw, pts } of keywords) {
    if (text.includes(kw)) score += pts;
  }

  return Math.min(99, score);
}
