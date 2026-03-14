"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cache_1 = require("../utils/cache");
const router = express_1.default.Router();
// In-memory alerts (replace with DB in production)
const alerts = [];
// POST /api/alerts
router.post('/', (req, res) => {
    const { candidate, region, track, filters, email } = req.body;
    alerts.push({ candidate, region, track, filters, email });
    res.json({ status: 'alert registered' });
});
// GET /api/alerts/check (simulate alert trigger)
router.get('/check', (req, res) => {
    // In production, this would be a scheduled job
    const newJobs = (0, cache_1.getCache)('jobs:US,Europe,India:LinkedIn,Indeed,Glassdoor,Naukri,EuroJobs') || [];
    // For demo, just return all jobs for all alerts
    res.json(alerts.map(alert => ({ ...alert, jobs: newJobs })));
});
exports.default = router;
