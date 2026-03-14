/**
 * api/kanban.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CRUD for kanban_cards table (PostgreSQL via pg).
 * Profile isolation: every query includes a profile_id filter AND sets the
 * Postgres session variable `app.current_profile` for Row-Level Security.
 *
 * Routes:
 *   GET    /api/kanban?profile_id=dj|pooja
 *   POST   /api/kanban              body: KanbanCard
 *   PATCH  /api/kanban/:id          body: Partial<KanbanCard>
 *   DELETE /api/kanban/:id?profile_id=dj|pooja
 *
 * Required env:
 *   DATABASE_URL  — postgresql://career_app:pass@host:5432/career_os
 * ─────────────────────────────────────────────────────────────────────────────
 */

import express, { Request, Response } from 'express';
import { Pool, PoolClient } from 'pg';

const router = express.Router();

// Lazy-init pool so the app boots even without DATABASE_URL (e.g. dev without DB)
let _pool: Pool | null = null;
function pool(): Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL env var is not set');
    }
    _pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  }
  return _pool;
}

type ProfileId = 'dj' | 'pooja';
const VALID_PROFILES: ProfileId[] = ['dj', 'pooja'];
const VALID_STAGES = ['wishlist','applied','phone_screen','interview','offer','rejected','archived'];

/** Wrap a DB call with the RLS session variable set */
async function withProfile<T>(profileId: ProfileId, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query(`SET LOCAL app.current_profile = '${profileId}'`);
    return await fn(client);
  } finally {
    client.release();
  }
}

function validateProfile(raw: unknown): ProfileId {
  if (!raw || !VALID_PROFILES.includes(raw as ProfileId)) {
    throw new Error(`Invalid profile_id. Must be one of: ${VALID_PROFILES.join(', ')}`);
  }
  return raw as ProfileId;
}

// ── GET /api/kanban?profile_id=dj ─────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const profileId = validateProfile(req.query.profile_id);
    const cards = await withProfile(profileId, async client => {
      const { rows } = await client.query(
        `SELECT * FROM kanban_cards WHERE profile_id = $1 ORDER BY created_at DESC`,
        [profileId]
      );
      return rows;
    });
    return res.json(cards);
  } catch (err) {
    const msg = (err as Error).message;
    return res.status(msg.includes('Invalid profile') ? 400 : 500).json({ error: msg });
  }
});

// ── POST /api/kanban ───────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const profileId = validateProfile(body.profile_id);

    if (!body.title || !body.company) {
      return res.status(400).json({ error: 'title and company are required' });
    }
    if (body.stage && !VALID_STAGES.includes(body.stage as string)) {
      return res.status(400).json({ error: `Invalid stage. Must be: ${VALID_STAGES.join(', ')}` });
    }

    const card = await withProfile(profileId, async client => {
      const { rows } = await client.query(
        `INSERT INTO kanban_cards
           (profile_id, job_id, title, company, apply_url, match_score, stage, notes, next_action, deadline)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [
          profileId,
          body.job_id     ?? null,
          body.title,
          body.company,
          body.apply_url  ?? null,
          body.match_score ?? null,
          body.stage      ?? 'wishlist',
          body.notes      ?? null,
          body.next_action ?? null,
          body.deadline   ?? null,
        ]
      );
      return rows[0];
    });
    return res.status(201).json(card);
  } catch (err) {
    const msg = (err as Error).message;
    return res.status(msg.includes('Invalid') ? 400 : 500).json({ error: msg });
  }
});

// ── PATCH /api/kanban/:id ──────────────────────────────────────────────────────
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body as Record<string, unknown>;
    const profileId = validateProfile(body.profile_id ?? req.query.profile_id);

    // Build dynamic SET clause — only allow safe fields
    const PATCHABLE = ['stage','notes','next_action','deadline','title','company','apply_url'];
    const sets: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    for (const key of PATCHABLE) {
      if (key in body) {
        if (key === 'stage' && !VALID_STAGES.includes(body[key] as string)) {
          return res.status(400).json({ error: `Invalid stage: ${body[key]}` });
        }
        sets.push(`${key} = $${i++}`);
        vals.push(body[key]);
      }
    }
    if (sets.length === 0) return res.status(400).json({ error: 'No patchable fields provided' });

    vals.push(id);
    vals.push(profileId);

    const card = await withProfile(profileId, async client => {
      const { rows } = await client.query(
        `UPDATE kanban_cards SET ${sets.join(', ')} WHERE id = $${i} AND profile_id = $${i + 1} RETURNING *`,
        vals
      );
      return rows[0] ?? null;
    });

    if (!card) return res.status(404).json({ error: 'Card not found' });
    return res.json(card);
  } catch (err) {
    const msg = (err as Error).message;
    return res.status(msg.includes('Invalid') ? 400 : 500).json({ error: msg });
  }
});

// ── DELETE /api/kanban/:id ─────────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const profileId = validateProfile(req.query.profile_id ?? req.body?.profile_id);

    await withProfile(profileId, async client => {
      await client.query(
        `DELETE FROM kanban_cards WHERE id = $1 AND profile_id = $2`,
        [id, profileId]
      );
    });
    return res.status(204).send();
  } catch (err) {
    const msg = (err as Error).message;
    return res.status(msg.includes('Invalid') ? 400 : 500).json({ error: msg });
  }
});

export default router;
