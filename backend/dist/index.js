"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const scheduler_1 = require("./utils/scheduler");
const cache_1 = require("./utils/cache");
const jobIngestionService_1 = require("./services/jobIngestionService");
const alerts_1 = __importDefault(require("./api/alerts"));
const jobs_1 = __importDefault(require("./api/jobs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/jobs', jobs_1.default);
app.use('/api/alerts', alerts_1.default);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// Schedule daily refresh of job cache
(0, scheduler_1.scheduleDailyJob)(async () => {
    const regions = ['US', 'Europe', 'India'];
    const jobBoards = ['LinkedIn', 'Indeed', 'Glassdoor', 'Naukri', 'EuroJobs'];
    const jobs = await (0, jobIngestionService_1.ingestJobs)(regions, jobBoards);
    (0, cache_1.setCache)('jobs:US,Europe,India:LinkedIn,Indeed,Glassdoor,Naukri,EuroJobs', jobs);
    console.log('Job cache refreshed');
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
