# Career OS — Operator Manual

A private, two-profile career intelligence platform for **DJ (Deobrat Jha)** and **Pooja (Dr. Pooja Choubey)**. Built on Node.js / TypeScript + Next.js 14 + PostgreSQL, deployable to Railway in one command.

---

## Architecture at a Glance

```
career-os-backend/          ← root (Express backend)
├── src/
│   ├── api/
│   │   ├── jobs.ts         ← GET /api/jobs  (job search entry point)
│   │   └── kanban.ts       ← CRUD /api/kanban (Tracker board)
│   ├── services/
│   │   ├── jobAggregator.ts      ← DJ pipeline  (Indeed MCP → Adzuna fallback)
│   │   ├── webSearchJobService.ts ← Pooja pipeline (Anthropic web_search)
│   │   └── adzunaFetcher.ts      ← Adzuna API client (production, untouched)
│   ├── config/
│   │   └── searchProfiles.ts     ← All search queries per profile × region
│   ├── utils/
│   │   └── matchScore.ts         ← Scoring engine (100-pt scale)
│   └── db/
│       └── schema.sql            ← PostgreSQL DDL (run once via npm run seed)
├── scripts/
│   └── seed.ts             ← DB initialiser + starter Wishlist cards
└── frontend/               ← Next.js 14 (Pages Router)
    ├── src/
    │   ├── components/
    │   │   ├── Dashboard.tsx     ← At-a-glance summary panel in Job Hub
    │   │   ├── AppLayout.tsx     ← Sticky header + 9-tab nav
    │   │   └── tabs/             ← One file per tab (JobHub, Tracker, …)
    │   ├── context/
    │   │   └── ProfileContext.tsx ← DJ / Pooja theme + profile switcher
    │   └── data/
    │       ├── profiles.ts       ← All heatmap / skill / cert / salary data
    │       └── prepVault.ts      ← Prep vault sections + flashcards
    └── pages/
        └── index.tsx             ← Root page — mounts AppLayout
```

---

## First Run Checklist

### 1. Clone & Install

```bash
git clone <repo-url> career-os
cd career-os
npm install
cd frontend && npm install && cd ..
```

### 2. Configure Environment

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
```

Open `.env` and fill in:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Yes | Powers Indeed MCP + Pooja web search |
| `ADZUNA_APP_ID` | Yes | Job search fallback + Europe/India |
| `ADZUNA_APP_KEY` | Yes | Adzuna credentials |
| `INDEED_MCP_URL` | Optional | Enables Indeed as primary source for DJ |
| `INDEED_MCP_TOKEN` | Optional | MCP server auth token |

Open `frontend/.env.local` and set:
```
NEXT_PUBLIC_API_URL=http://localhost:8080   # local dev
```

### 3. Initialise the Database

Run this **once** to apply the schema and seed both boards with starter Wishlist cards:

```bash
npm run seed
```

The seed script is **idempotent** — you can re-run it safely at any time to reset the board without duplicating existing cards.

### 4. Launch

```bash
npm run dev:all
```

This starts both the backend (port 8080) and Next.js frontend (port 3000) concurrently.

Open: `http://localhost:3000`

---

## Setting `INDEED_MCP_URL`

Indeed MCP gives DJ's US search access to live Indeed listings via the Anthropic MCP protocol.

1. Obtain your MCP server URL and bearer token from the Indeed Developer Portal.
2. Add to `.env`:
   ```
   INDEED_MCP_URL=https://mcp.indeed.com/v1
   INDEED_MCP_TOKEN=your-token-here
   ```
3. Restart the backend. Verify at: `http://localhost:8080/api/status`
   - `"indeed_mcp": "ok"` confirms the key is loaded.
   - If unset, DJ's US search silently falls back to Adzuna — no errors thrown.

> **Timeout**: Both Indeed MCP and the Anthropic web_search tool are capped at a hard **10-second timeout** (`AbortSignal.timeout(10_000)`). If an API is slow, the request aborts and the fallback path activates. The UI will never hang.

---

## How to Interpret the Match Score

Scores are calculated by `src/utils/matchScore.ts` on a **0–100 point scale**:

| Component | Max Points | Logic |
|---|---|---|
| Skill match | 60 pts | Each matched keyword = 10 pts (capped at 6 matches) |
| Region match | 10 pts | Job region in candidate's preferred regions list |
| Experience level | 10 pts | Candidate has ≥5 years AND job has an experience tag |
| Remote preference | 5 pts | Candidate wants remote AND job is remote |
| Hybrid preference | 5 pts | Candidate wants hybrid AND job is hybrid |
| Visa sponsorship | 5 pts | Candidate needs visa AND job offers it |
| Seniority match | 5 pts | Job title contains candidate's seniority keyword |
| **Natural max** | **100 pts** | Hard-capped at `Math.min(100, score)` |

### DJ Geographic Boost (applied post-scoring)

DJ's results get an additional location boost **after** the base score is calculated, before display:

| Location | Boost | Rationale |
|---|---|---|
| `remote: true` | +20 pts | Geographic sniper priority #1 |
| Location contains "Torrance" | +15 pts | Home base — 0 commute |
| Location contains "California" or ", CA" | +5 pts | State proximity bonus |

Score is still capped at 100. This boost only applies when `profileId === 'dj'`.

### Display Threshold

The backend enforces a **60-point minimum** before sending jobs to the frontend. Anything below 60 is filtered out as noise. The dashboard's "REMOTE LEADS 90+" tile shows the premium tier (≥ 90 pts after boost).

### Score Colour Guide (Job Hub cards)

| Range | Colour | Meaning |
|---|---|---|
| 80–100 | Green `#10b981` | Strong fit — apply immediately |
| 65–79 | Amber `#f59e0b` | Good fit — worth applying |
| 50–64 | Indigo `#6366f1` | Moderate fit — review carefully |
| < 50 | Grey `#5f6580` | Weak fit — shown only in edge cases |

---

## Adding New Targets

### Targeting a New Certification or Skill (DJ)

Open `src/config/searchProfiles.ts` → `deobratProfiles.us.queries` and add your query string:

```typescript
// Example: targeting FedRAMP auditors
'IT Audit Manager FedRAMP cloud security',
```

Then update `src/models/CandidatesData.ts` to add the skill keyword to DJ's `skills` array so it scores correctly:
```typescript
skills: [...existing, 'FedRAMP'],
```

### Targeting a New Location (DJ)

The geographic boost logic lives in `src/services/jobAggregator.ts` around the "DJ geographic sniper boost" comment. Add a new `else if` clause:

```typescript
} else if (locLower.includes('new york')) {
  boost = 10;
}
```

### Adding a New Track (Pooja)

1. Add the track string to `src/models/Track.ts`
2. Create a new `RegionProfileMap` in `src/config/searchProfiles.ts`
3. Add a resolver branch in `getSearchProfile()`
4. Add the track data (weeks, tasks, color) to `frontend/src/data/profiles.ts` under `pj.tracks`
5. Add prep vault sections to `frontend/src/data/prepVault.ts` under `pj`

### Updating the Dashboard Data

All static intelligence data (market heatmap, salary benchmarks, cert pathways, skill gaps, trend radar) is in:

```
frontend/src/data/profiles.ts    ← numeric data, track plans, certs, heatmap
frontend/src/data/prepVault.ts   ← study content, flashcards
```

These are **TypeScript files** — edit them directly, the type system will catch inconsistencies at build time. No API calls needed.

---

## Healthcheck & Monitoring

`GET /api/status` returns a structured health report:

```json
{
  "status": "ok",
  "version": "2.0.0",
  "checks": {
    "database":   "ok",
    "anthropic":  "ok",
    "indeed_mcp": "not_configured",
    "adzuna":     "ok"
  }
}
```

- `"ok"` — service healthy and key present
- `"not_configured"` — key not set (degraded but not broken)
- `"error"` — DB ping failed (HTTP 503, Railway will restart)

Railway uses `/api/status` as the healthcheck endpoint (configured in `railway.json`).

---

## Deployment to Railway

```bash
# Push to main — Railway auto-deploys on push
git push origin main
```

Set all env vars in the Railway dashboard under **Variables**. The `DATABASE_URL` is provided automatically if you provision a Railway PostgreSQL addon.

After first deploy, run seed remotely:
```bash
railway run npm run seed
```

---

## Data Provenance

| File | Source | Status |
|---|---|---|
| `frontend/src/data/profiles.ts` | Extracted from `career-os-v2.html` | ✅ 460 lines, fully typed |
| `frontend/src/data/prepVault.ts` | Extracted from `career-os-v2.html` | ✅ 547 lines, fully typed |
| `career-os-v2.html` | Original prototype | Can be archived — all data extracted |

The original `career-os-v2.html` is no longer required for operation. It is safe to move to an archive folder or remove from the working tree once you have verified the app renders correctly in production.
