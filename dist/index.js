"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const pg_1 = require("pg");
const jobs_1 = __importDefault(require("./api/jobs"));
const kanban_1 = __importDefault(require("./api/kanban"));
const intelligence_1 = __importDefault(require("./api/intelligence"));
const ai_1 = __importDefault(require("./api/ai"));
const monitor_1 = __importDefault(require("./api/monitor"));
const scheduler_1 = require("./opportunity-monitor/scheduler");
const init_1 = require("./db/init");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 8080;
// ─── Middleware ───────────────────────────────────────────────────────────────
app.use((0, cors_1.default)({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Global 30s request timeout
app.use((req, res, next) => {
    res.setTimeout(30000, () => {
        if (!res.headersSent)
            res.status(503).json({ error: 'Request timeout' });
    });
    next();
});
// 1. Health check (Railway ping + env status)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: Date.now(),
        env: {
            anthropic: !!process.env.ANTHROPIC_API_KEY,
            adzuna: !!process.env.ADZUNA_APP_ID,
            gemini: !!process.env.GEMINI_API_KEY,
            deepseek: !!process.env.DEEPSEEK_API_KEY,
        },
    });
});
// 2. Deep status check (Railway healthcheckPath + dashboard use)
app.get('/api/status', async (req, res) => {
    const checks = {};
    let httpStatus = 200;
    // PostgreSQL
    if (process.env.DATABASE_URL) {
        try {
            const pg = new pg_1.Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false },
                max: 1,
            });
            await pg.query('SELECT 1');
            await pg.end();
            checks.database = 'ok';
        }
        catch {
            checks.database = 'error';
            httpStatus = 503;
        }
    }
    else {
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
app.use('/api/jobs', jobs_1.default);
app.use('/api/kanban', kanban_1.default);
app.use('/api/ai', ai_1.default); // /api/ai/skill, /api/ai/trend, /api/ai/assist, etc.
app.use('/api/monitor', monitor_1.default); // /api/monitor/jobs, /api/monitor/orgs, /api/monitor/scan, /api/monitor/stats
app.use('/api', intelligence_1.default); // /api/trends, /api/skills, /api/salary, /api/market, /api/market/heatmap, /api/study/plan
// Global error handler (must be last)
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    if (!res.headersSent)
        res.status(500).json({ error: err.message });
});
// 5. Start server — run DB init, then monitor scheduler in sequence
app.listen(PORT, '0.0.0.0', async () => {
    console.log('✅ Career-OS backend running on port ' + PORT);
    // dbInit must complete first so monitor tables exist before seeder runs
    await (0, init_1.dbInit)().catch(err => console.error('dbInit error:', err.message));
    (0, scheduler_1.initMonitorScheduler)().catch(err => console.error('[Monitor] Scheduler init failed:', err.message));
});
