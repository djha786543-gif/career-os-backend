"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const matchScore_1 = require("../utils/matchScore");
describe('computeMatchScore', () => {
    const candidate = {
        id: 'deobrat',
        name: 'Deobrat Jha',
        specialization: 'Senior Internal Auditor',
        skills: ['SOX 404', 'ITGC', 'ERP'],
        experienceYears: 10,
        regions: ['US'],
        preferences: { remote: true, hybrid: true, visaSponsorship: true, seniority: 'Senior' }
    };
    const job = {
        id: '1',
        title: 'IT Auditor',
        company: 'Big4',
        location: 'New York',
        region: 'US',
        description: '',
        skills: ['SOX 404', 'ERP'],
        experienceLevel: 'Senior',
        employmentType: 'Full-time',
        remote: true,
        hybrid: false,
        visaSponsorship: true,
        jobBoard: 'LinkedIn',
        applyUrl: '',
        postedDate: '',
        normalized: true
    };
    it('should compute a positive match score', () => {
        const score = (0, matchScore_1.computeMatchScore)(job, candidate);
        expect(score).toBeGreaterThan(0);
        expect(score).toBeLessThanOrEqual(100);
    });
});
