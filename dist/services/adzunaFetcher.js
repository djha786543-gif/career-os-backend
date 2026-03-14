"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAdzunaJobs = fetchAdzunaJobs;
const axios_1 = __importDefault(require("axios"));
async function fetchAdzunaJobs(profile, country) {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    console.log('DEBUG: Attempting Adzuna Fetch. Auth ID present:', !!appId);
    let allJobs = [];
    for (const query of profile.queries) {
        const url = 'https://api.adzuna.com/v1/api/jobs/' + country + '/search/1?app_id=' + appId + '&app_key=' + appKey + '&what=' + encodeURIComponent(query);
        try {
            const res = await axios_1.default.get(url);
            console.log('ADZUNA_STATUS:', res.status, 'Count:', res.data.results?.length);
            allJobs.push(...(res.data.results || []));
        }
        catch (e) {
            console.error('ADZUNA_ERROR for ' + query);
        }
    }
    return allJobs;
}
