# Deployment Guide

## Backend
1. Set environment variables (see `.env.example`).
2. `cd backend && npm install`
3. `npm run build && npm start` (production) or `npm run dev` (development)
4. Expose port 4000 (or set `PORT`)

## Frontend
1. `cd frontend && npm install`
2. `npm run build && npm start` (production) or `npm run dev` (development)
3. Ensure frontend can reach backend API (proxy or CORS as needed)

## Environment Variables
- Place API keys and config in backend `.env` file

## Extending
- Add new job boards: backend `src/services/jobIngestionService.ts`
- Add new regions/candidates: update models/data

## Cloud/CI
- Use Railway, Render, or similar for deployment
- Add build steps for both backend and frontend
- Set environment variables in cloud dashboard

---
See `ARCHITECTURE.md` for more details.
