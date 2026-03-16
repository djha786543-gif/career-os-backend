"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchLinkedInJobs = fetchLinkedInJobs;
const axios_1 = __importDefault(require("axios"));
const jobNormalizer_1 = require("../utils/jobNormalizer");
async function fetchLinkedInJobs(region, query = '', page = 1) {
    const apiKey = process.env.LINKEDIN_API_KEY;
    if (!apiKey)
        throw new Error('LINKEDIN_API_KEY not set');
    // Replace with real LinkedIn API endpoint and params
    const url = `https://api.linkedin.com/v2/jobs`;
    const params = {
        apiKey,
        region,
        q: query,
        page,
        limit: 50
    };
    const { data } = await axios_1.default.get(url, { params });
    return (data.jobs || []).map((raw) => (0, jobNormalizer_1.normalizeJob)(raw, 'LinkedIn'));
}
