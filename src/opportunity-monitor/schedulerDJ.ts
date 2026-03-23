/**
 * schedulerDJ.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * DJ opportunity monitor scheduler — isolated from Pooja's scheduler.
 * Runs daily at 10:00 UTC (offset from Pooja's 08:00 to spread API usage).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import cron from 'node-cron'
import { runFullScanDJ, seedOrgsDJ } from './monitorEngineDJ'

export async function initMonitorSchedulerDJ(): Promise<void> {
  // Seed DJ orgs on startup
  try {
    await seedOrgsDJ()
  } catch (err) {
    console.error('[MonitorDJ] Seed error:', (err as Error).message)
  }

  // Daily at 10:00 UTC — offset from Pooja's 08:00 to spread API call load.
  // 20 orgs per run × ~6 runs = full 121-org rotation every ~6 days.
  cron.schedule('0 10 * * *', async () => {
    console.log('[MonitorDJ] Cron triggered at', new Date().toISOString())
    try {
      await runFullScanDJ()
    } catch (err) {
      console.error('[MonitorDJ] Cron scan error:', (err as Error).message)
    }
  })

  console.log('[MonitorDJ] DJ Scheduler ready — daily scan at 10:00 UTC (20 orgs per run)')
}
