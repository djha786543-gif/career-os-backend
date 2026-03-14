export type AdzunaCountry = 'us' | 'gb' | 'in';
export interface SearchProfile { queries: string[]; pages: number; }
export const SEARCH_PROFILES = {
  dj: { keywords: ['AI Audit', 'CISA IT Audit', 'SOX Compliance', 'IT Auditor'], locations: ['us'] as AdzunaCountry[] },
  pj: { keywords: ['Cardiovascular Research', 'Molecular Biology', 'Biomedical Research'], locations: ['us', 'gb'] as AdzunaCountry[] }
};
export function getSearchProfile(candidateId: string) {
  const isDJ = candidateId === 'dj' || candidateId === 'deobrat';
  const keywords = isDJ ? SEARCH_PROFILES.dj.keywords : SEARCH_PROFILES.pj.keywords;
  return { us: { queries: keywords, pages: 2 }, gb: { queries: keywords, pages: 2 }, in: { queries: keywords, pages: 2 } };
}
