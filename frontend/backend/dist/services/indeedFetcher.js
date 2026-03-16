"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchIndeedJobs = fetchIndeedJobs;
const axios_1 = __importDefault(require("axios"));
const jobNormalizer_1 = require("../utils/jobNormalizer");
// Fetch jobs from Indeed API (example, replace with real endpoint and params)
async function fetchIndeedJobs(region, query = '', page = 1) {
    const apiKey = process.env.INDEED_API_KEY;
    if (!apiKey)
        throw new Error('INDEED_API_KEY not set');
    // Example endpoint and params (replace with real Indeed API)
    const url = `https://api.indeed.com/v2/jobs`;
    const params = {
        apiKey,
        region,
        q: query,
        page,
        limit: 50
    };
    const { data } = await axios_1.default.get(url, { params });
    // Assume data.jobs is an array of raw jobs
    return (data.jobs || []).map((raw) => (0, jobNormalizer_1.normalizeJob)(raw, 'Indeed'));
}
