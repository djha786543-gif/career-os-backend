"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestJobs = ingestJobs;
const jobNormalizer_1 = require("../utils/jobNormalizer");
const deduplicateJobs_1 = require("../utils/deduplicateJobs");
const indeedFetcher_1 = require("./indeedFetcher");
const aiSkillExtractor_1 = require("../utils/aiSkillExtractor");
const naukriFetcher_1 = require("./naukriFetcher");
const glassdoorFetcher_1 = require("./glassdoorFetcher");
const linkedinFetcher_1 = require("./linkedinFetcher");
const eurojobsFetcher_1 = require("./eurojobsFetcher");
const cache_1 = require("../utils/cache");
// Helper: build a search query from candidate profile
function buildCandidateQuery(candidate) {
    // Use specialization and top 3 skills for the query
    const skills = (candidate.skills || []).slice(0, 3).join(' ');
    return [candidate.specialization, skills].filter(Boolean).join(' ');
}
// Placeholder for API fetchers for each job board
async function fetchJobsFromBoard(jobBoard, region, candidate) {
    const query = candidate ? buildCandidateQuery(candidate) : '';
    switch (jobBoard) {
        case 'Indeed':
            return await (0, indeedFetcher_1.fetchIndeedJobs)(region, query);
        case 'Naukri':
            return await (0, naukriFetcher_1.fetchNaukriJobs)(region, query);
        case 'Glassdoor':
            return await (0, glassdoorFetcher_1.fetchGlassdoorJobs)(region, query);
        case 'LinkedIn':
            return await (0, linkedinFetcher_1.fetchLinkedInJobs)(region, query);
        case 'EuroJobs':
            return await (0, eurojobsFetcher_1.fetchEuroJobs)(region, query);
        default:
            return [];
    }
}
async function ingestJobs(regions, jobBoards, candidate) {
    const cacheKey = `jobs:${regions.join(',')}:${jobBoards.join(',')}:${candidate?.id || ''}`;
    const cached = (0, cache_1.getCache)(cacheKey);
    if (Array.isArray(cached))
        return cached;
    let allJobs = [];
    for (const region of regions) {
        for (const board of jobBoards) {
            const rawJobs = await fetchJobsFromBoard(board, region, candidate);
            let normalized = rawJobs.map(raw => (0, jobNormalizer_1.normalizeJob)(raw, board));
            for (const job of normalized) {
                if (!job.skills || job.skills.length === 0) {
                    job.skills = await (0, aiSkillExtractor_1.extractSkillsAI)(job.description);
                }
            }
            allJobs = allJobs.concat(normalized);
        }
    }
    const deduped = (0, deduplicateJobs_1.deduplicateJobs)(allJobs);
    (0, cache_1.setCache)(cacheKey, deduped);
    return deduped;
}
