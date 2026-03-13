"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const jobs_1 = __importDefault(require("./api/jobs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 8080;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        environment: 'production',
        adzuna: !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY),
        claude: !!process.env.ANTHROPIC_API_KEY,
    });
});
app.get('/', (req, res) => {
    res.send('<h1>Career OS API</h1><p>Backend is Live</p>');
});
app.use('/api/jobs', jobs_1.default);
app.post('/api/claude', async (req, res) => {
    try {
        const { messages, system, max_tokens } = req.body;
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY || '',
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: max_tokens || 1000,
                system: system || '',
                messages,
            }),
        });
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('*', (req, res) => {
    const indexPath = path_1.default.join(__dirname, '../public/index.html');
    const fs = require('fs');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});
app.listen(PORT, '0.0.0.0', () => {
    console.log('Career-OS backend running on port ' + PORT);
});
