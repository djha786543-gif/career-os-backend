# Architecture Overview

- Modular backend (Node.js/Express, TypeScript)
- Modular frontend (React, TypeScript)
- API fetchers for LinkedIn, Indeed, Glassdoor, Naukri, EuroJobs, etc.
- Unified job ingestion pipeline: normalization, deduplication, region tagging, skill filtering, scoring
- Profile-based search logic
- Caching and scheduled refresh
- Extensible for new regions/candidates
