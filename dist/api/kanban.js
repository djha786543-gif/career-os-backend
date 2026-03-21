"use strict";
/**
 * api/kanban.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Kanban Board API (Persistence Layer)
 * ─────────────────────────────────────────────────────────────────────────────
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../db"));
const router = express_1.default.Router();
const VALID_PROFILES = ['dj', 'pooja'];
const VALID_STAGES = ['wishlist', 'applied', 'phone_screen', 'interview', 'offer', 'rejected', 'archived'];
/** Wrap a DB call with the RLS session variable set */
async function withProfile(profileId, fn) {
    const client = await db_1.default.connect();
    try {
        await client.query(`SET LOCAL app.current_profile = '${profileId}'`);
        return await fn(client);
    }
    finally {
        client.release();
    }
}
// ─── GET /api/kanban ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    const profileId = req.query.profile;
    if (!VALID_PROFILES.includes(profileId))
        return res.status(400).json({ error: 'Invalid profile' });
    try {
        const cards = await withProfile(profileId, async (client) => {
            const { rows } = await client.query('SELECT * FROM kanban_cards ORDER BY updated_at DESC');
            return rows;
        });
        res.json(cards);
    }
    catch (err) {
        if (!res.headersSent)
            res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});
// ─── POST /api/kanban ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    const profileId = req.query.profile;
    if (!VALID_PROFILES.includes(profileId))
        return res.status(400).json({ error: 'Invalid profile' });
    const { title, company, apply_url, match_score, stage } = req.body;
    if (!title || !company)
        return res.status(400).json({ error: 'Title and Company required' });
    try {
        const card = await withProfile(profileId, async (client) => {
            const { rows } = await client.query(`INSERT INTO kanban_cards (profile_id, title, company, apply_url, match_score, stage) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [profileId, title, company, apply_url, match_score || 0, stage || 'wishlist']);
            return rows[0];
        });
        res.json(card);
    }
    catch (err) {
        if (!res.headersSent)
            res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});
// ─── PATCH /api/kanban/:id ──────────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
    const profileId = req.query.profile;
    if (!VALID_PROFILES.includes(profileId))
        return res.status(400).json({ error: 'Invalid profile' });
    const { stage } = req.body;
    if (!stage || !VALID_STAGES.includes(stage))
        return res.status(400).json({ error: 'Invalid stage' });
    try {
        const card = await withProfile(profileId, async (client) => {
            const { rows } = await client.query('UPDATE kanban_cards SET stage = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [stage, req.params.id]);
            return rows[0];
        });
        if (!card)
            return res.status(404).json({ error: 'Card not found' });
        res.json(card);
    }
    catch (err) {
        if (!res.headersSent)
            res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});
// ─── DELETE /api/kanban/:id ─────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
    const profileId = req.query.profile;
    if (!VALID_PROFILES.includes(profileId))
        return res.status(400).json({ error: 'Invalid profile' });
    try {
        await withProfile(profileId, async (client) => {
            await client.query('DELETE FROM kanban_cards WHERE id = $1', [req.params.id]);
        });
        res.status(204).end();
    }
    catch (err) {
        if (!res.headersSent)
            res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});
exports.default = router;
