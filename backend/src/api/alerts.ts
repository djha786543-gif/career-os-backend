import express from 'express';
import { getCache } from '../utils/cache';

const router = express.Router();

// In-memory alerts (replace with DB in production)
const alerts: any[] = [];

// POST /api/alerts
router.post('/', (req, res) => {
  const { candidate, region, track, filters, email } = req.body;
  alerts.push({ candidate, region, track, filters, email });
  res.json({ status: 'alert registered' });
});

// GET /api/alerts/check (simulate alert trigger)
router.get('/check', (req, res) => {
  // In production, this would be a scheduled job
  const newJobs = getCache('jobs:US,Europe,India:LinkedIn,Indeed,Glassdoor,Naukri,EuroJobs') || [];
  // For demo, just return all jobs for all alerts
  res.json(alerts.map(alert => ({ ...alert, jobs: newJobs })));
});

export default router;
