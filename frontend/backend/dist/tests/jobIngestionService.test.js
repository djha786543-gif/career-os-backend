"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jobIngestionService_1 = require("../services/jobIngestionService");
describe('ingestJobs', () => {
    it('should return an array (mocked)', async () => {
        const jobs = await (0, jobIngestionService_1.ingestJobs)(['US'], ['LinkedIn']);
        expect(Array.isArray(jobs)).toBe(true);
    });
});
