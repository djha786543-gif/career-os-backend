"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const jobs_1 = __importDefault(require("./api/jobs"));
const alerts_1 = __importDefault(require("./api/alerts"));
const CandidatesData_1 = require("./models/CandidatesData");
dotenv_1.default.config();
const app = (0, express_1.default)();
// ─── CORS — allow all origins (restrict in production if needed) ──────────────
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS')
        return res.status(204).end();
    next();
});
app.use(express_1.default.json());
// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/jobs', jobs_1.default);
app.use('/api/alerts', alerts_1.default);
// Candidates list — lets the frontend know which profiles are available
app.get('/api/candidates', (_req, res) => {
    res.json(CandidatesData_1.candidates.map(c => ({
        id: c.id,
        name: c.name,
        specialization: c.specialization,
        regions: c.regions,
    })));
});
// Liveness + readiness check
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        adzuna: !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY),
    });
});
// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
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
