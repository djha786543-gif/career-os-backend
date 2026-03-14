import { deduplicateJobs } from '../utils/deduplicateJobs';
import { Job } from '../models/Job';

describe('deduplicateJobs', () => {
  const jobs: Job[] = [
    { id: '1', title: 'IT Auditor', company: 'Big4', location: 'NY', region: 'US', description: '', skills: [], experienceLevel: '', employmentType: '', remote: false, hybrid: false, visaSponsorship: false, jobBoard: 'LinkedIn', applyUrl: '', postedDate: '', normalized: true },
    { id: '2', title: 'IT Auditor', company: 'Big4', location: 'NY', region: 'US', description: '', skills: [], experienceLevel: '', employmentType: '', remote: false, hybrid: false, visaSponsorship: false, jobBoard: 'Indeed', applyUrl: '', postedDate: '', normalized: true },
    { id: '3', title: 'IT Auditor', company: 'Other', location: 'NY', region: 'US', description: '', skills: [], experienceLevel: '', employmentType: '', remote: false, hybrid: false, visaSponsorship: false, jobBoard: 'Glassdoor', applyUrl: '', postedDate: '', normalized: true }
  ];
  it('should deduplicate jobs by title, company, and location', () => {
    const deduped = deduplicateJobs(jobs);
    expect(deduped.length).toBe(2);
  });
});
