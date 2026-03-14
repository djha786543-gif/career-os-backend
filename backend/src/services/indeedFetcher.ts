import axios from 'axios';
import { Job } from '../models/Job';
import { normalizeJob } from '../utils/jobNormalizer';

// Fetch jobs from Indeed API (example, replace with real endpoint and params)
export async function fetchIndeedJobs(region: string, query: string = '', page: number = 1): Promise<Job[]> {
  const apiKey = process.env.INDEED_API_KEY;
  if (!apiKey) throw new Error('INDEED_API_KEY not set');
  // Example endpoint and params (replace with real Indeed API)
  const url = `https://api.indeed.com/v2/jobs`;
  const params = {
    apiKey,
    region,
    q: query,
    page,
    limit: 50
  };
  const { data } = await axios.get(url, { params });
  // Assume data.jobs is an array of raw jobs
  return (data.jobs || []).map((raw: any) => normalizeJob(raw, 'Indeed'));
}
