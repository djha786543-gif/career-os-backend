"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeJob = normalizeJob;
// Normalizes raw job data from different job boards to the Job interface
function normalizeJob(raw, jobBoard) {
    switch (jobBoard) {
        case 'Glassdoor':
            return {
                id: raw.jobId || raw.id,
                title: raw.title,
                company: raw.employer || raw.company || '',
                location: raw.location || '',
                region: raw.region || '',
                description: raw.description || '',
                skills: raw.skills || [],
                experienceLevel: raw.experienceLevel || '',
                employmentType: raw.employmentType || '',
                remote: raw.remote || false,
                hybrid: raw.hybrid || false,
                visaSponsorship: raw.visaSponsorship || false,
                salaryRange: raw.salaryRange,
                jobBoard: 'Glassdoor',
                applyUrl: raw.url || '',
                postedDate: raw.postedDate || '',
                normalized: true
            };
        case 'LinkedIn':
            return {
                id: raw.id || raw.jobId,
                title: raw.title,
                company: raw.companyName || '',
                location: raw.location || '',
                region: raw.region || '',
                description: raw.description || '',
                skills: raw.skills || [],
                experienceLevel: raw.experienceLevel || '',
                employmentType: raw.employmentType || '',
                remote: raw.remote || false,
                hybrid: raw.hybrid || false,
                visaSponsorship: raw.visaSponsorship || false,
                salaryRange: raw.salaryRange,
                jobBoard: 'LinkedIn',
                applyUrl: raw.applyUrl || '',
                postedDate: raw.postedDate || '',
                normalized: true
            };
        case 'Indeed':
            return {
                id: raw.jobkey || raw.id,
                title: raw.jobtitle || raw.title,
                company: raw.company || '',
                location: raw.formattedLocation || raw.location || '',
                region: raw.region || '',
                description: raw.snippet || raw.description || '',
                skills: raw.skills || [],
                experienceLevel: raw.experienceLevel || '',
                employmentType: raw.employmentType || '',
                remote: raw.remote || false,
                hybrid: raw.hybrid || false,
                visaSponsorship: raw.visaSponsorship || false,
                salaryRange: raw.salaryRange,
                jobBoard: 'Indeed',
                applyUrl: raw.url || '',
                postedDate: raw.date || '',
                normalized: true
            };
        case 'Naukri':
            return {
                id: raw.jobId || raw.id,
                title: raw.title,
                company: raw.companyName || '',
                location: raw.location || '',
                region: raw.region || '',
                description: raw.jobDescription || raw.description || '',
                skills: raw.keySkills ? raw.keySkills.split(',').map((s) => s.trim()) : [],
                experienceLevel: raw.experienceLevel || '',
                employmentType: raw.employmentType || '',
                remote: raw.remote || false,
                hybrid: raw.hybrid || false,
                visaSponsorship: raw.visaSponsorship || false,
                salaryRange: raw.salaryRange,
                jobBoard: 'Naukri',
                applyUrl: raw.url || '',
                postedDate: raw.postedDate || '',
                normalized: true
            };
        case 'EuroJobs':
            return {
                id: raw.jobId || raw.id,
                title: raw.title,
                company: raw.company || '',
                location: raw.location || '',
                region: raw.region || '',
                description: raw.description || '',
                skills: raw.skills || [],
                experienceLevel: raw.experienceLevel || '',
                employmentType: raw.employmentType || '',
                remote: raw.remote || false,
                hybrid: raw.hybrid || false,
                visaSponsorship: raw.visaSponsorship || false,
                salaryRange: raw.salaryRange,
                jobBoard: 'EuroJobs',
                applyUrl: raw.url || '',
                postedDate: raw.postedDate || '',
                normalized: true
            };
        // Add cases for other job boards (Glassdoor, etc.)
        default:
            throw new Error('Unknown job board');
    }
}
