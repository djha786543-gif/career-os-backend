import express from 'express';
import dotenv from 'dotenv';
import alertsRouter from './api/alerts';
import jobsRouter from './api/jobs';

dotenv.config();

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/jobs', jobsRouter);
app.use('/api/alerts', alertsRouter);

// ── Claude proxy ──────────────────────────────────────────────────────────
// Keeps the Anthropic key server-side; frontend sends messages/system/max_tokens
app.post('/api/claude', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server' });
  }

  const { messages, system, max_tokens = 1000, model = 'claude-sonnet-4-20250514' } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens,
        ...(system ? { system } : {}),
        messages,
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Anthropic API error',
        detail: data
      });
    }

    return res.json(data);
  } catch (err: any) {
    console.error('Claude proxy error:', err);
    return res.status(500).json({ error: 'Failed to reach Anthropic API', detail: err.message });
  }
});

// ── Health ────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    adzuna: !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY),
    claude: !!process.env.ANTHROPIC_API_KEY
  });
});

// ── Candidates ────────────────────────────────────────────────────────────
app.get('/api/candidates', (_req, res) => {
  res.json([
    { id: 'deobrat', name: 'Deobrat Jha',       role: 'IT Audit Manager' },
    { id: 'pooja',   name: 'Dr. Pooja Choubey', role: 'Research Scientist' }
  ]);
});

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅  Career-OS backend running on port ${PORT}`);
  console.log(`   Claude proxy: ${process.env.ANTHROPIC_API_KEY ? '✅ ready' : '❌ ANTHROPIC_API_KEY missing'}`);
  console.log(`   Adzuna:       ${process.env.ADZUNA_APP_ID ? '✅ ready' : '❌ ADZUNA keys missing'}`);
});
