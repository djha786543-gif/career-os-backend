# CareerOS API Contract
# Written by Claude Code CLI backend pass
# Gemini CLI frontend has already consumed this contract

## GET /health → { status, timestamp, env: { anthropic: bool, adzuna: bool } }

## GET /api/jobs?profile=dj|pj
→ { jobs: [{id,title,company,location,salary,posted,url,tags[]}], source: "indeed"|"adzuna"|"offline", profile, total, message? }
- Tier 1: Indeed via Anthropic MCP (requires ANTHROPIC_API_KEY)
- Tier 2: Adzuna REST (requires ADZUNA_APP_ID + ADZUNA_APP_KEY)
- Tier 3: offline signal — jobs:[], source:"offline", message with instructions

## GET /api/trends?profile=dj|pj
→ { trends: {hot[],rising[],stable[],cooling[]}, source: "claude"|"static", profile }
- Claude API when ANTHROPIC_API_KEY set, otherwise static

## GET /api/skills?profile=dj|pj
→ { skills: {current:{skill:number},gaps[],target_roles[]}, source: "static", profile }

## GET /api/salary?profile=dj|pj
→ { data: [{title,low,mid,high,remote_premium}], profile }

## GET /api/market?profile=dj|pj
→ { data: [{city,demand,jobs,yoy}], profile }

## RAILWAY ENV VARS:
ANTHROPIC_API_KEY — Indeed MCP (Tier 1) + AI trends
ADZUNA_APP_ID     — Adzuna job fallback (Tier 2)
ADZUNA_APP_KEY    — Adzuna job fallback (Tier 2)
NODE_ENV=production
