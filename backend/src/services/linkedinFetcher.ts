import axios from 'axios';
import { Job } from '../models/Job';
import { normalizeJob } from '../utils/jobNormalizer';

export async function fetchLinkedInJobs(region: string, query: string = '', page: number = 1): Promise<Job[]> {
  const apiKey = process.env.LINKEDIN_API_KEY;
  if (!apiKey) throw new Error('LINKEDIN_API_KEY not set');
  // Replace with real LinkedIn API endpoint and params
  const url = `https://api.linkedin.com/v2/jobs`;
  const params = {
    apiKey,
    region,
    q: query,
    page,
    limit: 50
  };
  const { data } = await axios.get(url, { params });
  return (data.jobs || []).map((raw: any) => normalizeJob(raw, 'LinkedIn'));
}
