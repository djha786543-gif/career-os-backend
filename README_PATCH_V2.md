# Career-OS Backend — Patch v2 (Wiring Fixes)

## What this patch fixes

| # | File | Bug | Symptom |
|---|------|-----|---------|
| 1 | `src/api/jobs.ts` + `dist/api/jobs.js` | Pooja only ever got Industry jobs (default track hard-coded to `'Industry'`) | PJ Job Hub showed **ACADEMIA = 0** in category tabs — always empty |
| 2 | `src/api/jobs.ts` + `dist/api/jobs.js` | `source` field said `'mock'` when 0 results returned | Misleading status in API response |
| 3 | `nixpacks.toml` | UTF-8 BOM (`\xEF\xBB\xBF`) at start of file | Could silently break Railway TOML parsing on fresh deploys |
| 4 | `server.js` | BOM-only empty file | Confusing; replaced with clean placeholder comment |

---

## How to apply

Drop the files from this patch into your project at the matching paths:

```
career-os-backend/
├── src/
│   └── api/
│       └── jobs.ts          ← replace
├── dist/
│   └── api/
│       └── jobs.js          ← replace
├── nixpacks.toml            ← replace (BOM stripped)
└── server.js                ← replace (clean placeholder)
```

Then redeploy to Railway. Because `railway.json` starts with `node dist/index.js`
directly, **the dist file takes effect immediately** — no TypeScript recompile needed.

If Railway runs `npm run build` (tsc) during deploy, the fixed `src/api/jobs.ts`
regenerates `dist/api/jobs.js` automatically.

---

## What the dual-track fix does

**Before:**
```
GET /api/jobs?profile=pj&country=United States
  → resolvedTrack = 'Industry'  (hardcoded default)
  → ingestJobs('pooja', ['US'], 'Industry')
  → 0 Academia results ever returned
```

**After:**
```
GET /api/jobs?profile=pj&country=United States   (no ?track= param)
  → Promise.all([
      ingestJobs('pooja', ['US'], 'Industry'),   ← parallel fetch
      ingestJobs('pooja', ['US'], 'Academic'),   ← parallel fetch
    ])
  → each set scored with its own track filter
  → jobs tagged { category: 'INDUSTRY' } or { category: 'ACADEMIA' }
  → merged & sorted by fitScore DESC
  → frontend category tabs populated correctly
```

Cache isolation is preserved — Industry and Academic use separate cache keys:
- `adzuna:pooja:Industry:us`
- `adzuna:pooja:Academic:us`

---

## Verification checklist

After deploying, confirm in browser:

- [ ] `https://<your-backend>.up.railway.app/health` → `{ "status": "ok" }`
- [ ] DJ Job Hub → Search → shows remote CISA/SOX roles
- [ ] PJ Job Hub → Search → shows both 🏭 INDUSTRY and 🎓 ACADEMIA tabs with jobs
- [ ] PJ category tabs correctly split the results
- [ ] Career AI → select a job → Generate → cover letter / interview prep works
- [ ] AI Skill Engine → any analysis mode → response loads

---

## No frontend changes required

`career-os-v2.html` is correctly wired:
- `BACKEND_URL` → `https://career-os-backend-production.up.railway.app` ✓
- `profile=dj` / `profile=pj` → correct candidateId mapping ✓
- `country=United States` → `region=US` mapping ✓
- Category tabs read `job.category === 'INDUSTRY' | 'ACADEMIA'` from backend ✓
- Error states, pagination, auto-refresh, Kanban tracker all correct ✓
