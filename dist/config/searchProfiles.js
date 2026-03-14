"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEARCH_PROFILES = void 0;
exports.getSearchProfile = getSearchProfile;
exports.SEARCH_PROFILES = {
    dj: { keywords: ['AI Audit', 'CISA IT Audit', 'SOX Compliance', 'IT Auditor'], locations: ['us'] },
    pj: { keywords: ['Cardiovascular Research', 'Molecular Biology', 'Biomedical Research'], locations: ['us', 'gb'] }
};
function getSearchProfile(candidateId) {
    const isDJ = candidateId === 'dj' || candidateId === 'deobrat';
    const keywords = isDJ ? exports.SEARCH_PROFILES.dj.keywords : exports.SEARCH_PROFILES.pj.keywords;
    return { us: { queries: keywords, pages: 2 }, gb: { queries: keywords, pages: 2 }, in: { queries: keywords, pages: 2 } };
}
