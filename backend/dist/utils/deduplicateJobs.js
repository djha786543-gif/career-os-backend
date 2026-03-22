"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deduplicateJobs = deduplicateJobs;
// Helper: compute Jaccard similarity between two strings
function jaccardSimilarity(a, b) {
    const setA = new Set(a.toLowerCase().split(/\W+/));
    const setB = new Set(b.toLowerCase().split(/\W+/));
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
}
// Enhanced deduplication: title, company, location, and description similarity
function deduplicateJobs(jobs) {
    const deduped = [];
    for (const job of jobs) {
        const isDuplicate = deduped.some(existing => {
            const keyMatch = (job.title.toLowerCase() === existing.title.toLowerCase() &&
                job.company.toLowerCase() === existing.company.toLowerCase() &&
                job.location.toLowerCase() === existing.location.toLowerCase());
            // If title, company, and location match, or descriptions are very similar, consider duplicate
            const descSim = jaccardSimilarity(job.description, existing.description);
            return keyMatch || descSim > 0.85;
        });
        if (!isDuplicate)
            deduped.push(job);
    }
    return deduped;
}
