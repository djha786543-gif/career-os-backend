import cron from 'node-cron'
import { runFullScan, seedOrgs } from './monitorEngine'

export async function initMonitorScheduler(): Promise<void> {
  // Seed orgs on startup
  try {
    await seedOrgs()
  } catch (err) {
    console.error('[Monitor] Seed error:', (err as Error).message)
  }

  // RECOMMENDATION 2: Only one cron instance runs due to advisory lock in runFullScan
  // Schedule: 0:00, 6:00, 12:00, 18:00 UTC daily
  cron.schedule('0 0,6,12,18 * * *', async () => {
    console.log('[Monitor] Cron triggered at', new Date().toISOString())
    try {
      await runFullScan()
    } catch (err) {
      console.error('[Monitor] Cron scan error:', (err as Error).message)
    }
  })

  console.log('[Monitor] Scheduler ready — scans at 0:00, 6:00, 12:00, 18:00 UTC')
}
