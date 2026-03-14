import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import { Pool } from 'pg';
import jobsRouter from './api/jobs';
import kanbanRouter from './api/kanban';

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.use(cors({
	origin: 'https://djha786543-gif.github.io',
	credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 1. Simple health check (Railway ping)
app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok' });
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
app.use('/api/jobs',   jobsRouter);
app.use('/api/kanban', kanbanRouter);

app.listen(PORT, '0.0.0.0', () => {
	console.log('✅ Career-OS backend running on port ' + PORT);
});
