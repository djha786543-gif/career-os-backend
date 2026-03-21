"use strict";
/**
 * schedulerDJ.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * DJ opportunity monitor scheduler — isolated from Pooja's scheduler.
 * Runs daily at 10:00 UTC (offset from Pooja's 08:00 to spread API usage).
 * ─────────────────────────────────────────────────────────────────────────────
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMonitorSchedulerDJ = initMonitorSchedulerDJ;
const node_cron_1 = __importDefault(require("node-cron"));
const monitorEngineDJ_1 = require("./monitorEngineDJ");
async function initMonitorSchedulerDJ() {
    // Seed DJ orgs on startup
    try {
        await (0, monitorEngineDJ_1.seedOrgsDJ)();
    }
    catch (err) {
        console.error('[MonitorDJ] Seed error:', err.message);
    }
    // Daily at 10:00 UTC — offset from Pooja's 08:00 to spread API call load.
    // 10 orgs per run × 8-9 runs = full 85-org rotation every ~9 days.
    node_cron_1.default.schedule('0 10 * * *', async () => {
        console.log('[MonitorDJ] Cron triggered at', new Date().toISOString());
        try {
            await (0, monitorEngineDJ_1.runFullScanDJ)();
        }
        catch (err) {
            console.error('[MonitorDJ] Cron scan error:', err.message);
        }
    });
    console.log('[MonitorDJ] DJ Scheduler ready — daily scan at 10:00 UTC (10 orgs per run)');
}
