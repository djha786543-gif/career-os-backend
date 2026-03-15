export function classifyAcademicIndustry(job: { title: string; description: string; company?: string }): 'Academic' | 'Industry' {
  const company = (job.company || '').toLowerCase();
  const title   = (job.title   || '').toLowerCase();
  const desc    = (job.description || '').toLowerCase();

  // ── 1. Company name check (most reliable) ────────────────────────────────
  const academicCompanyKw = [
    'university', 'université', 'college', 'school of',
    'institute of', 'hospital', 'health system', 'medical center',
    'medical school', 'nih', 'nci', 'nhlbi', 'nhgri', 'cdc', 'usda', 'fda',
    'national institutes', 'national laboratory', 'national lab',
    'department of', 'faculty of', 'research institute',
  ];
  const industryCompanyKw = [
    'therapeutics', 'biosciences', 'biopharma', 'pharma', 'pharmaceuticals',
    'genomics', 'biotech', 'biotechnology', 'life sciences', 'health sciences',
    ' inc', 'corp', 'corporation', 'llc', 'ltd', 'limited',
    'genentech', 'amgen', 'pfizer', 'novartis', 'astrazeneca',
    'bristol myers', 'merck', 'abbvie', 'biogen', 'regeneron', 'vertex',
    'alnylam', 'ionis', 'moderna', 'illumina', 'tenax', 'nudge',
  ];

  if (academicCompanyKw.some(k => company.includes(k))) return 'Academic';
  if (industryCompanyKw.some(k => company.includes(k))) return 'Industry';

  // ── 2. Job title check ────────────────────────────────────────────────────
  const academicTitleKw = [
    'professor', 'postdoctoral', 'postdoc', 'faculty', 'lecturer',
    'research fellow', 'core facility',
  ];
  const industryTitleKw = [
    'senior scientist', 'staff scientist', 'principal scientist',
    'scientist i', 'scientist ii', 'scientist iii',
    'research associate', 'associate director',
  ];

  if (academicTitleKw.some(k => title.includes(k))) return 'Academic';
  if (industryTitleKw.some(k => title.includes(k))) return 'Industry';

  // ── 3. Description fallback ───────────────────────────────────────────────
  const text = `${title} ${desc}`;
  const academicDescKw = ['tenure', 'tenured', 'assistant professor', 'grant writing', 'academic medical'];
  const industryDescKw = ['biotech', 'pharma', 'preclinical', 'in vivo', 'drug discovery', 'pipeline', 'clinical trial', 'startup'];

  if (academicDescKw.some(k => text.includes(k))) return 'Academic';
  if (industryDescKw.some(k => text.includes(k))) return 'Industry';

  // Default: treat as Industry (Adzuna returns mostly industry roles)
  return 'Industry';
}
