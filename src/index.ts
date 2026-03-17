import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import { Pool } from 'pg';
import jobsRouter from './api/jobs';
import kanbanRouter from './api/kanban';
import intelligenceRouter from './api/intelligence';
import aiRouter from './api/ai';
import monitorRouter from './api/monitor';
import adminRouter from './api/admin';
import { initMonitorScheduler } from './opportunity-monitor/scheduler';
import { dbInit } from './db/init';

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 8080;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Global 30s request timeout
app.use((req: Request, res: Response, next: NextFunction) => {
	res.setTimeout(30000, () => {
		if (!res.headersSent) res.status(503).json({ error: 'Request timeout' });
	});
	next();
});

// 1. Health check (Railway ping + env status)
app.get('/health', (req: Request, res: Response) => {
	res.status(200).json({
		status: 'ok',
		timestamp: Date.now(),
		env: {
			anthropic: !!process.env.ANTHROPIC_API_KEY,
			adzuna:    !!process.env.ADZUNA_APP_ID,
			gemini:    !!process.env.GEMINI_API_KEY,
			deepseek:  !!process.env.DEEPSEEK_API_KEY,
		},
	});
});

// 2. Deep status check (Railway healthcheckPath + dashboard use)
app.get('/api/status', async (req, res) => {
	const checks: Record<string, 'ok' | 'not_configured' | 'error'> = {};
	let httpStatus = 200;

	// PostgreSQL
	if (process.env.DATABASE_URL) {
		try {
			const pg = new Pool({
				connectionString: process.env.DATABASE_URL,
				ssl: { rejectUnauthorized: false },
				max: 1,
			});
			await pg.query('SELECT 1');
			await pg.end();
			checks.database = 'ok';
		} catch {
			checks.database = 'error';
			httpStatus = 503;
		}
	} else {
		checks.database = 'not_configured';
	}

	// Anthropic API key present
	checks.anthropic = process.env.ANTHROPIC_API_KEY ? 'ok' : 'not_configured';

	// Indeed MCP configured
	checks.indeed_mcp = process.env.INDEED_MCP_URL ? 'ok' : 'not_configured';

	// Adzuna configured
	checks.adzuna = process.env.ADZUNA_APP_ID ? 'ok' : 'not_configured';

	res.status(httpStatus).json({
		status: httpStatus === 200 ? 'ok' : 'degraded',
		version: '2.0.0',
		checks,
	});
});

// 3. Home Page
app.get('/', (req, res) => {
	res.send('<h1>Career OS API</h1><p>Backend is Live and Running</p>');
});

// 4. Feature routes
app.use('/api/jobs',          jobsRouter);
app.use('/api/kanban',        kanbanRouter);
app.use('/api/ai',            aiRouter);            // /api/ai/skill, /api/ai/trend, /api/ai/assist, etc.
app.use('/api/monitor',       monitorRouter);       // /api/monitor/jobs, /api/monitor/orgs, /api/monitor/scan, /api/monitor/stats
app.use('/api/admin',         adminRouter);         // /api/admin/usage
app.use('/api',               intelligenceRouter);  // /api/trends, /api/skills, /api/salary, /api/market, /api/market/heatmap, /api/study/plan

// Global error handler (must be last)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	console.error('[ERROR]', err.message);
	if (!res.headersSent) res.status(500).json({ error: err.message });
});

// 5. Start server — run DB init, then monitor scheduler in sequence
app.listen(PORT, '0.0.0.0', async () => {
	console.log('✅ Career-OS backend running on port ' + PORT);
	// dbInit must complete first so monitor tables exist before seeder runs
	await dbInit().catch(err => console.error('dbInit error:', err.message));
	initMonitorScheduler().catch(err =>
		console.error('[Monitor] Scheduler init failed:', err.message)
	);
});
