/**
 * mailer.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends post-scan email digests to Pooja and DJ when new high-suitability
 * jobs are detected.
 *
 * Required env vars (all optional — silently skipped if absent):
 *   GMAIL_USER          sender Gmail address (e.g. careerOS@gmail.com)
 *   GMAIL_APP_PASSWORD  Gmail App Password (not your login password)
 *                       → myaccount.google.com > Security > App passwords
 *   ALERT_EMAIL_POOJA   Pooja's delivery address
 *   ALERT_EMAIL_DJ      DJ's delivery address
 * ─────────────────────────────────────────────────────────────────────────────
 */

import nodemailer from 'nodemailer'
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

// ── HTML template ─────────────────────────────────────────────────────────────

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

function sectorBadge(sector: string): string {
  const colours: Record<string, string> = {
    academia:      'background:#dbeafe;color:#1e40af',
    industry:      'background:#dcfce7;color:#166534',
    international: 'background:#ede9fe;color:#5b21b6',
    india:         'background:#fef3c7;color:#92400e',
    big4:          'background:#dbeafe;color:#1e40af',
    banking:       'background:#dcfce7;color:#166534',
    'tech-cloud':  'background:#ede9fe;color:#5b21b6',
    manufacturing: 'background:#fef3c7;color:#92400e',
  }
  const style = colours[sector] ?? 'background:#f3f4f6;color:#374151'
  return `<span style="${style};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;text-transform:capitalize;">${sector}</span>`
}

function buildJobRow(j: DigestJob): string {
  const isTier1 = TIER1_ORGS.has(j.org_name)
  const tier1Mark = isTier1
    ? `<span style="background:#fef9c3;color:#713f12;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:700;margin-left:6px;">Tier 1</span>`
    : ''
  const applyBtn = j.apply_url
    ? `<a href="${j.apply_url}" style="background:#1d4ed8;color:white;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;">Apply</a>`
    : '<span style="color:#9ca3af;font-size:12px;">No URL</span>'

  return `
    <tr>
      <td style="padding:14px 8px;border-bottom:1px solid #f3f4f6;vertical-align:top;">
        <div style="font-weight:600;color:#111827;font-size:14px;line-height:1.3;">
          ${j.title}${tier1Mark}
        </div>
        <div style="color:#6b7280;font-size:12px;margin-top:3px;">
          ${j.org_name} &middot; ${j.location || j.country || ''}
        </div>
        <div style="margin-top:5px;">${sectorBadge(j.sector)}</div>
      </td>
      <td style="padding:14px 8px;border-bottom:1px solid #f3f4f6;vertical-align:middle;text-align:right;white-space:nowrap;">
        ${applyBtn}
      </td>
    </tr>`
}

function buildHtml(candidate: string, jobs: DigestJob[], profileLine: string): string {
  const tier1Count = jobs.filter(j => TIER1_ORGS.has(j.org_name)).length
  const tier1Note  = tier1Count > 0
    ? `<span style="color:#22c55e;font-weight:600;">${tier1Count} from Tier-1 organisations.</span>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
  <tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

    <!-- Header band -->
    <tr>
      <td style="background:#0f172a;padding:28px 32px;">
        <div style="color:#22c55e;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Career OS &rsaquo; Opportunity Alert</div>
        <div style="color:white;font-size:22px;font-weight:700;line-height:1.2;">
          ${jobs.length} new match${jobs.length !== 1 ? 'es' : ''} for ${candidate}
        </div>
        <div style="color:#94a3b8;font-size:12px;margin-top:8px;">
          ${profileLine} &middot;
          ${new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </div>
        ${tier1Count > 0 ? `<div style="margin-top:10px;font-size:12px;">${tier1Note}</div>` : ''}
      </td>
    </tr>

    <!-- Jobs list -->
    <tr>
      <td style="padding:24px 32px 8px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tbody>
            ${jobs.map(buildJobRow).join('')}
          </tbody>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:20px 32px 28px;">
        <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.6;">
          These positions passed the Zero-Trust validation pipeline and are confirmed high-suitability.
          Open the Career OS portal to browse full details, filter by region, and track applications.
          <br><br>
          You are receiving this because a new scan run detected fresh postings.
        </p>
      </td>
    </tr>

  </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── Transport factory (created per-send to pick up env changes) ───────────────

function makeTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

function isConfigured(): boolean {
  return !!(
    process.env.GMAIL_USER &&
    process.env.GMAIL_APP_PASSWORD
  )
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Query for Pooja's new high-suitability jobs found during this scan run
 * and send an email digest. No-ops silently if env vars are not configured.
 */
export async function sendPoojaDigest(runStart: Date): Promise<void> {
  if (!isConfigured()) return
  const toEmail = process.env.ALERT_EMAIL_POOJA
  if (!toEmail) return

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
      console.log('[Monitor] No new high-fit jobs this run — skipping digest')
      return
    }

    const subject = `Career OS: ${result.rows.length} new position${result.rows.length !== 1 ? 's' : ''} matched Pooja's profile`
    const html    = buildHtml('Pooja', result.rows, 'Life Sciences · Cardiovascular · Molecular Biology')

    await makeTransport().sendMail({
      from: `"Career OS" <${process.env.GMAIL_USER}>`,
      to:   toEmail,
      subject,
      html,
    })

    console.log(`[Monitor] Digest sent to Pooja (${toEmail}) — ${result.rows.length} new high-fit jobs`)
  } catch (err) {
    // Non-fatal: log but don't crash the scan
    console.error('[Monitor] Failed to send Pooja digest:', (err as Error).message)
  }
}

/**
 * Query for DJ's new high-suitability jobs found during this scan run
 * and send an email digest. No-ops silently if env vars are not configured.
 */
export async function sendDJDigest(runStart: Date): Promise<void> {
  if (!isConfigured()) return
  const toEmail = process.env.ALERT_EMAIL_DJ
  if (!toEmail) return

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
      console.log('[MonitorDJ] No new high-fit jobs this run — skipping digest')
      return
    }

    const subject = `Career OS: ${result.rows.length} new IT Audit position${result.rows.length !== 1 ? 's' : ''} matched DJ's profile`
    const html    = buildHtml('DJ', result.rows, 'IT Audit · SOX · Cloud Risk · GRC · Manager+')

    await makeTransport().sendMail({
      from: `"Career OS" <${process.env.GMAIL_USER}>`,
      to:   toEmail,
      subject,
      html,
    })

    console.log(`[MonitorDJ] Digest sent to DJ (${toEmail}) — ${result.rows.length} new high-fit jobs`)
  } catch (err) {
    console.error('[MonitorDJ] Failed to send DJ digest:', (err as Error).message)
  }
}
