"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyAcademicIndustry = classifyAcademicIndustry;
function classifyAcademicIndustry(job) {
    const academicKw = [
        'university', 'professor', 'postdoctoral', 'postdoc', 'faculty', 'school',
        'core facility', 'research fellow', 'medical school', 'lecturer', 'academic',
        'publication', 'teaching', 'mentorship'
    ];
    const industryKw = [
        'biotech', 'pharma', 'preclinical', 'in vivo', 'industry', 'company',
        'senior scientist', 'staff scientist', 'bioinformatics', 'molecular biology',
        'translational', 'research associate', 'clinical', 'drug', 'pipeline',
        'product', 'startup', 'corporate'
    ];
    const text = `${job.title} ${job.description}`.toLowerCase();
    if (academicKw.some(k => text.includes(k)))
        return 'Academic';
    if (industryKw.some(k => text.includes(k)))
        return 'Industry';
    return 'Industry';
}
