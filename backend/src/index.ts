import express from 'express';
import dotenv from 'dotenv';
import { scheduleDailyJob } from './utils/scheduler';
import { setCache } from './utils/cache';
import { ingestJobs } from './services/jobIngestionService';
import { JobBoard } from './models/JobBoard';
import alertsRouter from './api/alerts';
import jobsRouter from './api/jobs';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/jobs', jobsRouter);
app.use('/api/alerts', alertsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Schedule daily refresh of job cache
scheduleDailyJob(async () => {
  const regions = ['US', 'Europe', 'India'];
  const jobBoards: JobBoard[] = ['LinkedIn', 'Indeed', 'Glassdoor', 'Naukri', 'EuroJobs'];
  const jobs = await ingestJobs(regions, jobBoards);
  setCache('jobs:US,Europe,India:LinkedIn,Indeed,Glassdoor,Naukri,EuroJobs', jobs);
  console.log('Job cache refreshed');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
