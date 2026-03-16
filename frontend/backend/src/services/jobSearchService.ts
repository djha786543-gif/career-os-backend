import { Job } from '../models/Job';
import { Candidate } from '../models/Candidate';
import { computeMatchScore } from '../utils/matchScore';
import { classifyAcademicIndustry } from '../utils/classifyAcademicIndustry';
import { poojaProfiles } from '../models/PoojaProfiles';
import { Track } from '../models/Track';

export function filterAndScoreJobs(jobs: Job[], candidate: Candidate & { track?: Track }, filters: any): Job[] {
  let profile = candidate;
  if (candidate.id === 'pooja' && candidate.track) {
    profile = { ...candidate, ...poojaProfiles[candidate.track] };
  }
  return jobs
    .filter(job => {
      // Require at least 2 skill matches
      const skillMatches = profile.skills.filter(skill =>
        job.skills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
      ).length;
      if (skillMatches < 2) return false;
      // Require region match
      if (!profile.regions.includes(job.region)) return false;
      if (candidate.id === 'pooja' && candidate.track) {
        const track = classifyAcademicIndustry(job);
        if (track !== candidate.track) return false;
      }
      if (filters.remote !== undefined && job.remote !== filters.remote) return false;
      if (filters.hybrid !== undefined && job.hybrid !== filters.hybrid) return false;
      if (filters.visaSponsorship !== undefined && job.visaSponsorship !== filters.visaSponsorship) return false;
      if (filters.salaryRange) {
        if (!job.salaryRange) return false;
        if (job.salaryRange.min < filters.salaryRange.min || job.salaryRange.max > filters.salaryRange.max) return false;
      }
      if (filters.seniority && job.experienceLevel?.toLowerCase() !== filters.seniority.toLowerCase()) return false;
      if (filters.domain && candidate.id === 'pooja' && candidate.track && filters.domain !== candidate.track) return false;
      return true;
    })
    .map(job => ({ ...job, matchScore: computeMatchScore(job, profile) }))
    // Only keep jobs with matchScore >= 60
    .filter(job => job.matchScore >= 60)
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}
