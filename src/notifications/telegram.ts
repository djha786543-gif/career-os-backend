/**
 * telegram.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends Telegram message alerts to Pooja and DJ when new high-suitability
 * jobs are detected after each scan run.
 *
 * Required env vars (all optional — silently skipped if absent):
 *   TELEGRAM_BOT_TOKEN     Bot token from @BotFather
 *   TELEGRAM_CHAT_ID_POOJA Pooja's Telegram chat ID
 *   TELEGRAM_CHAT_ID_DJ    DJ's Telegram chat ID
 * ─────────────────────────────────────────────────────────────────────────────
 */

import https from 'https'
import { pool } from '../db/client'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DigestJob {
  title: string
  org_name: string
  location: string
  country?: string
  sector: string
  apply_url: string
  detected_at: string
  suitability_score?: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIER1_ORGS = new Set([
  'Harvard Medical School', 'Stanford Medicine', 'MIT Biology', 'UCSF',
  'Broad Institute', 'Johns Hopkins Medicine', 'Salk Institute',
  'Francis Crick Institute', 'Wellcome Sanger Institute', 'EMBL Jobs',
  'ETH Zurich', 'Karolinska Institute', 'Max Planck Heart and Lung',
  'NIH NHLBI', 'NIH NIGMS', 'NIH NCI',
  'Genentech', 'Regeneron', 'Amgen', 'Roche',
  'EY US Technology Risk', 'EY India GDS', 'Deloitte US Risk Advisory',
  'KPMG US Technology Risk', 'PwC US Digital Assurance',
  'Goldman Sachs', 'JPMorgan Chase', 'Amazon Web Services', 'Microsoft',
])

function escapeMarkdown(text: string): string {
  // Escape special characters for Telegram MarkdownV2
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&')
}

function formatJobEntry(j: DigestJob, index: number): string {
  const isTier1 = TIER1_ORGS.has(j.org_name)
  const tier1Tag = isTier1 ? ' ⭐' : ''
  const location = j.location || j.country || 'Location TBC'
  const score = j.suitability_score != null ? ` · Score: ${j.suitability_score}` : ''

  const title    = escapeMarkdown(j.title)
  const org      = escapeMarkdown(j.org_name)
  const loc      = escapeMarkdown(location)
  const sector   = escapeMarkdown(j.sector)
  const applyLine = j.apply_url
    ? `[Apply →](${j.apply_url})`
    : '_No URL_'

  return [
    `*${index}\\. ${title}*${tier1Tag}`,
    `🏢 ${org} · ${loc}`,
    `🏷 ${sector}${escapeMarkdown(score)}`,
    applyLine,
  ].join('\n')
}

function buildMessage(candidate: string, profileLine: string, jobs: DigestJob[]): string {
  const tier1Count = jobs.filter(j => TIER1_ORGS.has(j.org_name)).length
  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  const header = [
    `🚀 *Career OS — ${escapeMarkdown(jobs.length.toString())} new match${jobs.length !== 1 ? 'es' : ''} for ${escapeMarkdown(candidate)}*`,
    `_${escapeMarkdown(profileLine)}_`,
    `_${escapeMarkdown(dateStr)}_`,
    tier1Count > 0 ? `✅ ${escapeMarkdown(tier1Count.toString())} from Tier\\-1 orgs` : '',
  ].filter(Boolean).join('\n')

  const jobLines = jobs.map((j, i) => formatJobEntry(j, i + 1)).join('\n\n')

  return `${header}\n\n${jobLines}`
}

function sendTelegramMessage(token: string, chatId: string, text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true,
    })

    const req = https.request(
      {
        hostname: 'api.telegram.org',
        path: `/bot${token}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve()
          } else {
            reject(new Error(`Telegram API ${res.statusCode}: ${data}`))
          }
        })
      }
    )

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function isTelegramConfigured(): boolean {
  return !!process.env.TELEGRAM_BOT_TOKEN
}

// ── Chunked send (Telegram max message length is 4096 chars) ──────────────────

async function sendInChunks(token: string, chatId: string, jobs: DigestJob[], header: string): Promise<void> {
  const MAX_LEN = 4000
  let chunk: DigestJob[] = []
  let chunkIndex = 1

  for (let i = 0; i < jobs.length; i++) {
    chunk.push(jobs[i])
    const preview = buildMessage('', '', chunk)
    if (preview.length > MAX_LEN || i === jobs.length - 1) {
      if (preview.length > MAX_LEN && chunk.length > 1) {
        // Last job pushed it over — send without it, then start new chunk
        chunk.pop()
        i--
      }
      const msgJobs = chunk.map((j, idx) => formatJobEntry(j, (chunkIndex - 1) * 20 + idx + 1)).join('\n\n')
      const msg = chunkIndex === 1
        ? `${header}\n\n${msgJobs}`
        : `_(continued — part ${escapeMarkdown(chunkIndex.toString())})_\n\n${msgJobs}`
      await sendTelegramMessage(token, chatId, msg)
      chunkIndex++
      chunk = []
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Query for Pooja's new high-suitability jobs found during this scan run
 * and send a Telegram alert. No-ops silently if env vars are not configured.
 */
export async function sendPoojaTelegram(runStart: Date): Promise<void> {
  if (!isTelegramConfigured()) return
  const chatId = process.env.TELEGRAM_CHAT_ID_POOJA
  if (!chatId) return

  try {
    const result = await pool.query<DigestJob>(
      `SELECT title, org_name, location, country, sector, apply_url, detected_at
       FROM monitor_jobs
       WHERE high_suitability = true
         AND is_new = true
         AND is_active = true
         AND detected_at >= $1
       ORDER BY detected_at DESC`,
      [runStart]
    )

    if (result.rows.length === 0) {
      console.log('[Monitor] No new high-fit jobs this run — skipping Telegram alert')
      return
    }

    const token  = process.env.TELEGRAM_BOT_TOKEN!
    const header = buildMessage('Pooja', 'Life Sciences · Cardiovascular · Molecular Biology', result.rows)

    if (header.length <= 4000) {
      await sendTelegramMessage(token, chatId, header)
    } else {
      const tier1Count = result.rows.filter(j => TIER1_ORGS.has(j.org_name)).length
      const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      const headerOnly = [
        `🚀 *Career OS — ${escapeMarkdown(result.rows.length.toString())} new matches for Pooja*`,
        `_Life Sciences · Cardiovascular · Molecular Biology_`,
        `_${escapeMarkdown(dateStr)}_`,
        tier1Count > 0 ? `✅ ${escapeMarkdown(tier1Count.toString())} from Tier\\-1 orgs` : '',
      ].filter(Boolean).join('\n')
      await sendInChunks(token, chatId, result.rows, headerOnly)
    }

    console.log(`[Monitor] Telegram alert sent to Pooja — ${result.rows.length} new high-fit jobs`)
  } catch (err) {
    console.error('[Monitor] Failed to send Pooja Telegram alert:', (err as Error).message)
  }
}

/**
 * Query for DJ's new high-suitability jobs found during this scan run
 * and send a Telegram alert. No-ops silently if env vars are not configured.
 */
export async function sendDJTelegram(runStart: Date): Promise<void> {
  if (!isTelegramConfigured()) return
  const chatId = process.env.TELEGRAM_CHAT_ID_DJ
  if (!chatId) return

  try {
    const result = await pool.query<DigestJob>(
      `SELECT title, org_name, location, country, sector, apply_url, detected_at, suitability_score
       FROM dj_monitor_jobs
       WHERE high_suitability = true
         AND is_new = true
         AND is_active = true
         AND detected_at >= $1
       ORDER BY suitability_score DESC, detected_at DESC`,
      [runStart]
    )

    if (result.rows.length === 0) {
      console.log('[MonitorDJ] No new high-fit jobs this run — skipping Telegram alert')
      return
    }

    const token  = process.env.TELEGRAM_BOT_TOKEN!
    const header = buildMessage('DJ', 'IT Audit · SOX · Cloud Risk · GRC · Manager+', result.rows)

    if (header.length <= 4000) {
      await sendTelegramMessage(token, chatId, header)
    } else {
      const tier1Count = result.rows.filter(j => TIER1_ORGS.has(j.org_name)).length
      const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      const headerOnly = [
        `🚀 *Career OS — ${escapeMarkdown(result.rows.length.toString())} new matches for DJ*`,
        `_IT Audit · SOX · Cloud Risk · GRC · Manager\\+_`,
        `_${escapeMarkdown(dateStr)}_`,
        tier1Count > 0 ? `✅ ${escapeMarkdown(tier1Count.toString())} from Tier\\-1 orgs` : '',
      ].filter(Boolean).join('\n')
      await sendInChunks(token, chatId, result.rows, headerOnly)
    }

    console.log(`[MonitorDJ] Telegram alert sent to DJ — ${result.rows.length} new high-fit jobs`)
  } catch (err) {
    console.error('[MonitorDJ] Failed to send DJ Telegram alert:', (err as Error).message)
  }
}
