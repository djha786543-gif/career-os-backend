import axios from 'axios';
import { Job } from '../models/Job';
import { normalizeJob } from '../utils/jobNormalizer';

// Fetch jobs from Naukri API (replace with real endpoint and params)
export async function fetchNaukriJobs(region: string, query: string = '', page: number = 1): Promise<Job[]> {
  const apiKey = process.env.NAUKRI_API_KEY;
  if (!apiKey) throw new Error('NAUKRI_API_KEY not set');
  // Example endpoint and params (replace with real Naukri API)
  const url = `https://api.naukri.com/v2/jobs`;
  const params = {
    apiKey,
    region,
    q: query,
    page,
    limit: 50
  };
  const { data } = await axios.get(url, { params });
  // Assume data.jobs is an array of raw jobs
  return (data.jobs || []).map((raw: any) => normalizeJob(raw, 'Naukri'));
}
