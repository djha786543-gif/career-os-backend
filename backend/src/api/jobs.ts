import express from 'express';
import { ingestJobs } from '../services/jobIngestionService';
import { filterAndScoreJobs } from '../services/jobSearchService';
import { candidates } from '../models/CandidatesData';
import { JobBoard } from '../models/JobBoard';

const router = express.Router();

// GET /api/jobs?candidate=deobrat&region=US&remote=true
router.get('/', async (req, res) => {
  const { candidate: candidateId, region, track, ...filters } = req.query;
  let candidate = candidates.find(c => c.id === candidateId);
  if (!candidate) return res.status(400).json({ error: 'Invalid candidate' });
  // Only add track if candidate is pooja and track is valid
  let candidateWithTrack: any = candidate;
  if (candidate.id === 'pooja' && track && (track === 'Academic' || track === 'Industry')) {
    candidateWithTrack = Object.assign({}, candidate, { track });
  }
  // Ensure regions is always a string[]
  const regions: string[] = region ? [region as string] : candidate.regions;
  const jobBoards: JobBoard[] = ['LinkedIn', 'Indeed', 'Glassdoor', 'Naukri', 'EuroJobs'];
  // Pass candidateWithTrack to ingestJobs for candidate-specific queries
  const jobs = await ingestJobs(regions, jobBoards, candidateWithTrack);
  // filterAndScoreJobs expects candidateWithTrack to possibly have a track
  const filtered = filterAndScoreJobs(jobs, candidateWithTrack as any, filters);
  res.json(filtered);
});

export default router;
