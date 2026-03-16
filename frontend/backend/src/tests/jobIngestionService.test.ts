import { ingestJobs } from '../services/jobIngestionService';
import { JobBoard } from '../models/JobBoard';

describe('ingestJobs', () => {
  it('should return an array (mocked)', async () => {
    const jobs = await ingestJobs(['US'], ['LinkedIn' as JobBoard]);
    expect(Array.isArray(jobs)).toBe(true);
  });
});
