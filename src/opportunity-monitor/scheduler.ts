import cron from 'node-cron'
import { runFullScan, seedOrgs } from './monitorEngine'
import { runFullScanDJ, seedDJOrgs } from './monitorEngineDJ'

export async function initMonitorScheduler(): Promise<void> {
  // ── Seed both profiles on startup ──────────────────────────────────────────
  try {
    await seedOrgs()
  } catch (err) {
    console.error('[Monitor] Pooja seed error:', (err as Error).message)
  }
  try {
    await seedDJOrgs()
  } catch (err) {
    console.error('[MonitorDJ] DJ seed error:', (err as Error).message)
  }

  // ── Pooja scan: daily at 08:00 UTC, 10 orgs per run ──────────────────────
  cron.schedule('0 8 * * *', async () => {
    console.log('[Monitor] Pooja cron triggered at', new Date().toISOString())
    try { await runFullScan() }
    catch (err) { console.error('[Monitor] Pooja cron error:', (err as Error).message) }
  })

  // ── DJ scan: daily at 10:00 UTC, 12 orgs per run (offset to avoid concurrency)
  cron.schedule('0 10 * * *', async () => {
    console.log('[MonitorDJ] DJ cron triggered at', new Date().toISOString())
    try { await runFullScanDJ() }
    catch (err) { console.error('[MonitorDJ] DJ cron error:', (err as Error).message) }
  })

  console.log('[Monitor] Scheduler ready — Pooja @ 08:00 UTC | DJ @ 10:00 UTC (NULLS FIRST priority)')
}
