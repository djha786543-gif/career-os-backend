"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deduplicateJobs = deduplicateJobs;
function deduplicateJobs(jobs) {
    const seen = new Set();
    return jobs.filter(job => {
        const key = `${job.title}|${job.company}|${job.location}`.toLowerCase();
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}
