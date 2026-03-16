import cron from 'node-cron'
import { runFullScan, seedOrgs } from './monitorEngine'

export async function initMonitorScheduler(): Promise<void> {
  // Seed orgs on startup
  try {
    await seedOrgs()
  } catch (err) {
    console.error('[Monitor] Seed error:', (err as Error).message)
  }

  // Cost optimisation: once daily at 08:00 UTC, scanning 10 orgs per run.
  // All 65 orgs rotate through over 6-7 days (oldest-first ordering in runFullScan).
  cron.schedule('0 8 * * *', async () => {
    console.log('[Monitor] Cron triggered at', new Date().toISOString())
    try {
      await runFullScan()
    } catch (err) {
      console.error('[Monitor] Cron scan error:', (err as Error).message)
    }
  })

  console.log('[Monitor] Scheduler ready — daily scan at 08:00 UTC (10 orgs per run)')
}
