import { Router } from 'express';
// Direct import of your db configuration
import db from '../db'; 

const router = Router();

router.post('/ingest-mcp', async (req, res) => {
    const { profileId, jobs } = req.body;
    if (!Array.isArray(jobs)) return res.status(400).json({ error: 'Array expected' });

    try {
        for (const job of jobs) {
            const score = job.matchScore || job.match_score || 80;

            await db.query(
                'INSERT INTO job_cache (profile_id, title, company, location, description, apply_url, match_score, fetched_at) VALUES (, , , , , , , )',
                [profileId, job.title, job.company, job.location, job.description || '', job.apply_url || '#', score, new Date().toISOString()]
            );
        }
        res.status(200).json({ success: true, count: jobs.length });
    } catch (err) {
        console.error('DB ERROR:', err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;
