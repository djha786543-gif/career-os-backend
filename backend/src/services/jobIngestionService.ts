import { Job } from '../models/Job';
import { JobBoard } from '../models/JobBoard';
import { normalizeJob } from '../utils/jobNormalizer';
import { deduplicateJobs } from '../utils/deduplicateJobs';
import axios from 'axios';
import { fetchIndeedJobs } from './indeedFetcher';
import { extractSkillsAI } from '../utils/aiSkillExtractor';
import { fetchNaukriJobs } from './naukriFetcher';
import { fetchGlassdoorJobs } from './glassdoorFetcher';
import { fetchLinkedInJobs } from './linkedinFetcher';
import { fetchEuroJobs } from './eurojobsFetcher';
import { getCache, setCache } from '../utils/cache';

// Helper: build a search query from candidate profile
function buildCandidateQuery(candidate: any): string {
  // Use specialization and top 3 skills for the query
  const skills = (candidate.skills || []).slice(0, 3).join(' ');
  return [candidate.specialization, skills].filter(Boolean).join(' ');
}

// Placeholder for API fetchers for each job board
async function fetchJobsFromBoard(jobBoard: JobBoard, region: string, candidate?: any): Promise<any[]> {
  const query = candidate ? buildCandidateQuery(candidate) : '';
  switch (jobBoard) {
    case 'Indeed':
      return await fetchIndeedJobs(region, query);
    case 'Naukri':
      return await fetchNaukriJobs(region, query);
    case 'Glassdoor':
      return await fetchGlassdoorJobs(region, query);
    case 'LinkedIn':
      return await fetchLinkedInJobs(region, query);
    case 'EuroJobs':
      return await fetchEuroJobs(region, query);
    default:
      return [];
  }
}

export async function ingestJobs(regions: string[], jobBoards: JobBoard[], candidate?: any): Promise<Job[]> {
  const cacheKey = `jobs:${regions.join(',')}:${jobBoards.join(',')}:${candidate?.id || ''}`;
  const cached = getCache(cacheKey);
  if (Array.isArray(cached)) return cached as Job[];
  let allJobs: Job[] = [];
  for (const region of regions) {
    for (const board of jobBoards) {
      const rawJobs = await fetchJobsFromBoard(board, region, candidate);
      let normalized = rawJobs.map(raw => normalizeJob(raw, board));
      for (const job of normalized) {
        if (!job.skills || job.skills.length === 0) {
          job.skills = await extractSkillsAI(job.description);
        }
      }
      allJobs = allJobs.concat(normalized);
    }
  }
  const deduped = deduplicateJobs(allJobs);
  setCache(cacheKey, deduped);
  return deduped;
}
