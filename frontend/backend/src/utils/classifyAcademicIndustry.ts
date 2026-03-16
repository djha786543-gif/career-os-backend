// Classifies a job as Academic or Industry for Pooja
export function classifyAcademicIndustry(job: { title: string; description: string }): 'Academic' | 'Industry' {
  const academicKeywords = [
    'university', 'professor', 'postdoctoral', 'postdoc', 'faculty', 'school', 'core facility', 'research fellow', 'medical school', 'lecturer', 'academic', 'publication', 'teaching', 'mentorship'
  ];
  const industryKeywords = [
    'biotech', 'pharma', 'preclinical', 'in vivo', 'industry', 'company', 'senior scientist', 'staff scientist', 'bioinformatics', 'molecular biology', 'translational', 'research associate', 'clinical', 'drug', 'pipeline', 'product', 'team', 'startup', 'corporate'
  ];
  const text = `${job.title} ${job.description}`.toLowerCase();
  if (academicKeywords.some(k => text.includes(k))) return 'Academic';
  if (industryKeywords.some(k => text.includes(k))) return 'Industry';
  // Default: Industry (more jobs are industry in public APIs)
  return 'Industry';
}
