/**
 * index.ts — Career-OS Backend Entry Point
 * ─────────────────────────────────────────────────────────────────────────────
 * Routes:
 *   GET  /health                → liveness check
 *   GET  /api/candidates        → list of supported candidate profiles
 *   GET  /api/jobs              → search jobs (see api/jobs.ts for params)
 *   POST /api/jobs/refresh      → force cache invalidation
 *   POST /api/alerts            → register a job alert
 *   GET  /api/alerts/check      → list registered alerts
 *
 * All other portal pages and functions are unaffected by job-search changes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import jobsRouter    from './api/jobs';
import alertsRouter  from './api/alerts';
import { candidates } from './models/CandidatesData';

dotenv.config();

const app = express();

// ─── CORS — allow all origins (restrict in production if needed) ──────────────
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/jobs',    jobsRouter);
app.use('/api/alerts',  alertsRouter);

// Candidates list — lets the frontend know which profiles are available
app.get('/api/candidates', (_req: Request, res: Response) => {
  res.json(candidates.map(c => ({
    id:             c.id,
    name:           c.name,
    specialization: c.specialization,
    regions:        c.regions,
  })));
});

// Liveness + readiness check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    adzuna:    !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY),
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  const adzunaStatus = (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY)
    ? '✅ Adzuna LIVE'
    : '⚠️  Adzuna not configured — mock fallback active';
  console.log(`✅  Career-OS backend running on port ${PORT}`);
  console.log(`    ${adzunaStatus}`);
});
