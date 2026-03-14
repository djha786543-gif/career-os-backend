# Backend

Node.js/Express backend for multi-region, multi-profile job search. Contains API fetchers, normalization, scoring, deduplication, and REST API routes.

## Features
- Multi-region, multi-profile job discovery
- API integration: LinkedIn, Indeed, Glassdoor, Naukri, EuroJobs (extensible)
- Unified job ingestion pipeline: normalization, deduplication, region tagging, skill filtering, scoring
- Profile-based search logic and match scoring
- Caching and scheduled refresh (to be implemented)
- REST API for job search, candidate/region selection, saved jobs, alerts
- Modular, extensible TypeScript codebase

## Setup
1. `cd backend`
2. `cp .env.example .env` and fill in API keys
3. `npm install`
4. `npm run dev` (development) or `npm run build && npm start` (production)

## Testing
- `npm test` (Jest)

## Extending
- Add new job boards: implement fetcher in `src/services/jobIngestionService.ts` and normalization in `src/utils/jobNormalizer.ts`
- Add new regions/candidates: update models and data

## API
- `GET /api/jobs?candidate=deobrat&region=US&remote=true` – Search jobs for a candidate, region, and filters
- `GET /health` – Health check

## To Do
- Implement real API fetchers
- Add caching and scheduled refresh
- Saved jobs and alerts endpoints

---
See `docs/ARCHITECTURE.md` for more details.