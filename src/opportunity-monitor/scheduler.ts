import cron from 'node-cron'
import { runFullScan, seedOrgs } from './monitorEngine'

export async function initMonitorScheduler(): Promise<void> {
  // Seed orgs on startup
  try {
    await seedOrgs()
  } catch (err) {
    console.error('[Monitor] Seed error:', (err as Error).message)
  }

  // Daily at 08:00 UTC, scanning 20 orgs per run (oldest-first).
  // 134 active orgs rotate fully every ~7 days.
  cron.schedule('0 8 * * *', async () => {
    console.log('[Monitor] Cron triggered at', new Date().toISOString())
    try {
      await runFullScan()
    } catch (err) {
      console.error('[Monitor] Cron scan error:', (err as Error).message)
    }
  })

  console.log('[Monitor] Scheduler ready — daily scan at 08:00 UTC (20 orgs per run)')
}
