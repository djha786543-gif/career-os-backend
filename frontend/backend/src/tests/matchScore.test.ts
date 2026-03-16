import { computeMatchScore } from '../utils/matchScore';
import { Job } from '../models/Job';
import { Candidate } from '../models/Candidate';

describe('computeMatchScore', () => {
  const candidate: Candidate = {
    id: 'deobrat',
    name: 'Deobrat Jha',
    specialization: 'Senior Internal Auditor',
    skills: ['SOX 404', 'ITGC', 'ERP'],
    experienceYears: 10,
    regions: ['US'],
    preferences: { remote: true, hybrid: true, visaSponsorship: true, seniority: 'Senior' }
  };
  const job: Job = {
    id: '1',
    title: 'IT Auditor',
    company: 'Big4',
    location: 'New York',
    region: 'US',
    description: '',
    skills: ['SOX 404', 'ERP'],
    experienceLevel: 'Senior',
    employmentType: 'Full-time',
    remote: true,
    hybrid: false,
    visaSponsorship: true,
    jobBoard: 'LinkedIn',
    applyUrl: '',
    postedDate: '',
    normalized: true
  };
  it('should compute a positive match score', () => {
    const score = computeMatchScore(job, candidate);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
