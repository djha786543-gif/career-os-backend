import axios from 'axios';
import { Job } from '../models/Job';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://career-os-portal-production.up.railway.app').replace(/\/$/, '');

export async function fetchJobs(candidate: string, region: string, filters: Record<string, any> = {}): Promise<Job[]> {
  const params = { candidate, region, ...filters };
  const { data } = await axios.get<Job[]>(`${API_URL}/api/jobs`, { params });
  return data;
}
