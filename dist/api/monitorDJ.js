"use strict";
/**
 * api/monitorDJ.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * DJ (Deobrat Jha) Opportunity Monitor API — isolated from Pooja's monitor.ts.
 * Mounted at: /api/monitor/dj/*
 *
 * Endpoints:
 *   GET  /api/monitor/dj/jobs     — DJ job listings with sector filter
 *   GET  /api/monitor/dj/orgs     — DJ org list
 *   POST /api/monitor/dj/scan     — Trigger DJ scan
 *   POST /api/monitor/dj/mark-seen — Mark DJ jobs as seen
 *   GET  /api/monitor/dj/stats    — DJ scan stats
 * ─────────────────────────────────────────────────────────────────────────────
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("../db/client");
const monitorEngineDJ_1 = require("../opportunity-monitor/monitorEngineDJ");
const orgConfigDJ_1 = require("../opportunity-monitor/orgConfigDJ");
const router = (0, express_1.Router)();
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;
const VALID_DJ_SECTORS = ['big4', 'banking', 'tech-cloud', 'manufacturing'];
// GET /api/monitor/dj/jobs?sector=big4&country=USA&isNew=true&limit=50&offset=0
router.get('/jobs', async (req, res) => {
    try {
        const sector = req.query.sector;
        const country = req.query.country;
        const isNew = req.query.isNew === 'true';
        const limit = Math.min(parseInt(req.query.limit || String(DEFAULT_LIMIT)), MAX_LIMIT);
        const offset = Math.max(parseInt(req.query.offset || '0'), 0);
        const params = [];
        let where = 'WHERE j.is_active = true';
        if (sector && VALID_DJ_SECTORS.includes(sector)) {
            params.push(sector);
            where += ` AND j.sector = $${params.length}`;
        }
        if (country && ['USA', 'India'].includes(country)) {
            params.push(country);
            where += ` AND j.country = $${params.length}`;
        }
        if (isNew) {
            where += ` AND j.is_new = true`;
        }
        params.push(limit);
        params.push(offset);
        const result = await client_1.pool.query(`SELECT j.*, o.last_scanned_at, o.api_type, o.ead_friendly as org_ead_friendly, o.managerial_grade as org_managerial_grade
       FROM dj_monitor_jobs j
       JOIN dj_monitor_orgs o ON j.org_id = o.id
       ${where}
       ORDER BY j.suitability_score DESC, j.is_new DESC, j.detected_at DESC
       LIMIT $${params.length - 1}
       OFFSET $${params.length}`, params);
        const counts = await client_1.pool.query(`SELECT sector, country,
         COUNT(*) FILTER (WHERE is_active = true) as total,
         COUNT(*) FILTER (WHERE is_new = true AND is_active = true) as new_count
       FROM dj_monitor_jobs
       GROUP BY sector, country`);
        res.json({
            status: 'success',
            profile: 'dj',
            jobs: result.rows,
            counts: counts.rows,
            total: result.rows.length,
            limit,
            offset,
        });
    }
    catch (err) {
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});
// GET /api/monitor/dj/orgs?sector=big4&country=USA
router.get('/orgs', async (req, res) => {
    try {
        const sector = req.query.sector;
        const country = req.query.country;
        const params = [];
        let where = 'WHERE o.is_active = true';
        if (sector && VALID_DJ_SECTORS.includes(sector)) {
            params.push(sector);
            where += ` AND o.sector = $${params.length}`;
        }
        if (country && ['USA', 'India'].includes(country)) {
            params.push(country);
            where += ` AND o.country = $${params.length}`;
        }
        const result = await client_1.pool.query(`SELECT o.*,
         COUNT(j.id) FILTER (WHERE j.is_active = true) as total_jobs,
         COUNT(j.id) FILTER (WHERE j.is_new = true AND j.is_active = true) as new_jobs
       FROM dj_monitor_orgs o
       LEFT JOIN dj_monitor_jobs j ON o.id = j.org_id
       ${where}
       GROUP BY o.id
       ORDER BY new_jobs DESC, total_jobs DESC`, params);
        res.json({ status: 'success', profile: 'dj', orgs: result.rows });
    }
    catch (err) {
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});
// POST /api/monitor/dj/scan
router.post('/scan', async (req, res) => {
    try {
        const { orgId } = req.body;
        if (orgId) {
            const orgRow = await client_1.pool.query('SELECT * FROM dj_monitor_orgs WHERE id = $1', [orgId]);
            if (!orgRow.rows.length) {
                return res.status(404).json({ error: 'DJ organization not found' });
            }
            const orgConfig = orgConfigDJ_1.DJ_MONITOR_ORGS.find(o => o.name === orgRow.rows[0].name);
            if (!orgConfig) {
                return res.status(404).json({ error: 'DJ organization config not found' });
            }
            res.json({ status: 'scanning', profile: 'dj', orgId, message: `Scanning ${orgConfig.name}...` });
            (0, monitorEngineDJ_1.scanOrgDJ)(orgId, orgConfig).catch(console.error);
        }
        else {
            res.json({ status: 'scanning', profile: 'dj', message: 'Full DJ scan started in background' });
            (0, monitorEngineDJ_1.runFullScanDJ)().catch(console.error);
        }
    }
    catch (err) {
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});
// POST /api/monitor/dj/mark-seen
router.post('/mark-seen', async (req, res) => {
    try {
        const { sector } = req.body;
        if (sector && VALID_DJ_SECTORS.includes(sector)) {
            await client_1.pool.query('UPDATE dj_monitor_jobs SET is_new = false WHERE sector = $1 AND is_active = true', [sector]);
        }
        else {
            await client_1.pool.query('UPDATE dj_monitor_jobs SET is_new = false WHERE is_active = true');
        }
        res.json({ status: 'success', profile: 'dj', message: 'DJ jobs marked as seen' });
    }
    catch (err) {
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});
// GET /api/monitor/dj/stats
router.get('/stats', async (req, res) => {
    try {
        const sectors = await client_1.pool.query(`SELECT sector, country,
         COUNT(*) FILTER (WHERE is_active = true) as total_jobs,
         COUNT(*) FILTER (WHERE is_new = true AND is_active = true) as new_jobs,
         COUNT(*) FILTER (WHERE ead_friendly = true AND is_active = true) as ead_jobs,
         COUNT(*) FILTER (WHERE managerial_grade = true AND is_active = true) as mgr_jobs,
         MAX(detected_at) FILTER (WHERE is_active = true) as last_detected
       FROM dj_monitor_jobs
       GROUP BY sector, country
       ORDER BY sector, country`);
        const lastScan = await client_1.pool.query(`SELECT MAX(scanned_at) as last_scan
       FROM dj_monitor_scans
       WHERE status = 'success'`);
        const orgCount = await client_1.pool.query('SELECT COUNT(*) as total FROM dj_monitor_orgs WHERE is_active = true');
        const pendingScan = await client_1.pool.query(`SELECT COUNT(*) as pending
       FROM dj_monitor_orgs
       WHERE is_active = true AND last_scanned_at IS NULL`);
        res.json({
            status: 'success',
            profile: 'dj',
            sectors: sectors.rows,
            lastScan: lastScan.rows[0]?.last_scan,
            totalOrgs: parseInt(orgCount.rows[0]?.total || '0'),
            pendingScan: parseInt(pendingScan.rows[0]?.pending || '0'),
        });
    }
    catch (err) {
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});
// POST /api/monitor/dj/seed — manual seed trigger (admin use)
router.post('/seed', async (req, res) => {
    try {
        await (0, monitorEngineDJ_1.seedOrgsDJ)();
        res.json({ status: 'success', message: 'DJ orgs seeded' });
    }
    catch (err) {
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});
// GET /api/monitor/dj/debug — deployment verification
router.get('/debug', async (req, res) => {
    try {
        const tables = await client_1.pool.query(`SELECT tablename FROM pg_tables
       WHERE schemaname = 'public' AND tablename LIKE 'dj_%'
       ORDER BY tablename`);
        const orgs = await client_1.pool.query(`SELECT sector, country, COUNT(*) as n
       FROM dj_monitor_orgs WHERE is_active = true
       GROUP BY sector, country ORDER BY sector, country`);
        const jobs = await client_1.pool.query(`SELECT sector, country, COUNT(*) as n
       FROM dj_monitor_jobs WHERE is_active = true
       GROUP BY sector, country ORDER BY sector, country`);
        const recentScans = await client_1.pool.query(`SELECT s.status, s.error_message, s.jobs_found, s.new_jobs,
              s.scanned_at, o.name as org_name
       FROM dj_monitor_scans s
       JOIN dj_monitor_orgs o ON s.org_id = o.id
       ORDER BY s.scanned_at DESC LIMIT 20`);
        res.json({
            codeVersion: 'Serper-V1-Success',
            env: {
                serperKey: !!process.env.SERPER_API_KEY,
                databaseUrl: !!process.env.DATABASE_URL,
            },
            tables: tables.rows.map((r) => r.tablename),
            orgs: { total: orgs.rows.reduce((s, r) => s + parseInt(r.n), 0), bySector: orgs.rows },
            jobs: { total: jobs.rows.reduce((s, r) => s + parseInt(r.n), 0), bySector: jobs.rows },
            recentScans: recentScans.rows,
        });
    }
    catch (err) {
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});
exports.default = router;
