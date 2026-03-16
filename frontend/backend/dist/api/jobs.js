"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jobIngestionService_1 = require("../services/jobIngestionService");
const jobSearchService_1 = require("../services/jobSearchService");
const CandidatesData_1 = require("../models/CandidatesData");
const router = express_1.default.Router();
// GET /api/jobs?candidate=deobrat&region=US&remote=true
router.get('/', async (req, res) => {
    const { candidate: candidateId, region, track, ...filters } = req.query;
    let candidate = CandidatesData_1.candidates.find(c => c.id === candidateId);
    if (!candidate)
        return res.status(400).json({ error: 'Invalid candidate' });
    // Only add track if candidate is pooja and track is valid
    let candidateWithTrack = candidate;
    if (candidate.id === 'pooja' && track && (track === 'Academic' || track === 'Industry')) {
        candidateWithTrack = Object.assign({}, candidate, { track });
    }
    // Ensure regions is always a string[]
    const regions = region ? [region] : candidate.regions;
    const jobBoards = ['LinkedIn', 'Indeed', 'Glassdoor', 'Naukri', 'EuroJobs'];
    const jobs = await (0, jobIngestionService_1.ingestJobs)(regions, jobBoards);
    // filterAndScoreJobs expects candidateWithTrack to possibly have a track
    const filtered = (0, jobSearchService_1.filterAndScoreJobs)(jobs, candidateWithTrack, filters);
    res.json(filtered);
});
exports.default = router;
