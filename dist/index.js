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
app.use('/api', intelligence_1.default); // /api/trends, /api/skills, /api/salary, /api/market
// Global error handler (must be last)
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    if (!res.headersSent)
        res.status(500).json({ error: err.message });
});
app.listen(PORT, '0.0.0.0', () => {
    console.log('✅ Career-OS backend running on port ' + PORT);
});
