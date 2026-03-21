"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("../db/client");
const router = (0, express_1.Router)();
const COST_PER_AI_CALL = 0.0013; // claude-haiku-4-5 @ ~500 in / ~500 out tokens
const COST_PER_SCAN_CYCLE = 0.008; // user-visible rate (full batch of ~6 websearch calls)
// GET /api/admin/usage
// Returns Anthropic credit balance (requires ANTHROPIC_ADMIN_KEY env var)
// plus estimated usage calculated from our own scan logs.
// Safe to call from the frontend — returns nulls gracefully when admin key absent.
router.get('/usage', async (req, res) => {
    try {
        // ── 1. Try Anthropic Admin API for real credit balance ────────────────────
        // Requires a separate ANTHROPIC_ADMIN_KEY (Settings → API Keys → Admin key).
        // Falls back silently if not configured — regular API keys cannot read billing.
        let available_balance = null;
        let total_spent_api = null;
        const adminKey = process.env.ANTHROPIC_ADMIN_KEY;
        if (adminKey) {
            try {
                const r = await fetch('https://api.anthropic.com/v1/organizations/usage', {
                    headers: {
                        'anthropic-admin-key': adminKey,
                        'anthropic-version': '2023-06-01',
                    },
                });
                if (r.ok) {
                    const data = await r.json();
                    available_balance = data.available_balance ?? null;
                    total_spent_api = data.total_cost ?? null;
                }
            }
            catch { /* admin key present but endpoint unavailable — ignore */ }
        }
        // ── 2. Compute estimated usage from our own scan logs ────────────────────
        const stats = await client_1.pool.query(`
      SELECT
        COUNT(s.id) FILTER (WHERE s.status = 'success' AND o.api_type = 'websearch')::int AS ai_calls_month,
        COUNT(s.id) FILTER (WHERE s.status = 'success')::int                              AS total_scans_month,
        COALESCE(SUM(s.jobs_found), 0)::int                                               AS jobs_found_month
      FROM monitor_scans s
      JOIN monitor_orgs o ON s.org_id = o.id
      WHERE s.scanned_at >= date_trunc('month', NOW())
    `);
        const row = stats.rows[0];
        const ai_calls = row.ai_calls_month || 0;
        const total_scans = row.total_scans_month || 0;
        const jobs_found = row.jobs_found_month || 0;
        const estimated_cost = parseFloat((ai_calls * COST_PER_AI_CALL).toFixed(3));
        // ── 3. Budget fallback ───────────────────────────────────────────────────
        // If no admin key, use ANTHROPIC_MONTHLY_BUDGET env var (e.g. 20) to
        // synthesise a pseudo available_balance = budget - estimated_monthly_cost.
        let source = 'estimated';
        if (available_balance !== null) {
            source = 'anthropic_api';
        }
        else {
            const budget = parseFloat(process.env.ANTHROPIC_MONTHLY_BUDGET || '');
            if (!isNaN(budget) && budget > 0) {
                available_balance = parseFloat((budget - estimated_cost).toFixed(3));
                source = 'budgeted';
            }
        }
        res.json({
            available_balance,
            total_spent: total_spent_api ?? estimated_cost,
            // Local scan tracking (always available)
            estimated_monthly_cost: estimated_cost,
            monthly_ai_calls: ai_calls,
            monthly_total_scans: total_scans,
            jobs_found_month: jobs_found,
            // Rates for frontend calculations
            cost_per_ai_call: COST_PER_AI_CALL,
            cost_per_scan_cycle: COST_PER_SCAN_CYCLE,
            // 'anthropic_api' | 'budgeted' | 'estimated'
            source,
        });
    }
    catch (err) {
        if (!res.headersSent)
            res.status(500).json({ error: err.message });
    }
});
exports.default = router;
