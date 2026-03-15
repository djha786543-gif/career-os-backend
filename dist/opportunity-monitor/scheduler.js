"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMonitorScheduler = initMonitorScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const monitorEngine_1 = require("./monitorEngine");
async function initMonitorScheduler() {
    // Seed orgs on startup
    try {
        await (0, monitorEngine_1.seedOrgs)();
    }
    catch (err) {
        console.error('[Monitor] Seed error:', err.message);
    }
    // RECOMMENDATION 2: Only one cron instance runs due to advisory lock in runFullScan
    // Schedule: 0:00, 6:00, 12:00, 18:00 UTC daily
    node_cron_1.default.schedule('0 0,6,12,18 * * *', async () => {
        console.log('[Monitor] Cron triggered at', new Date().toISOString());
        try {
            await (0, monitorEngine_1.runFullScan)();
        }
        catch (err) {
            console.error('[Monitor] Cron scan error:', err.message);
        }
    });
    console.log('[Monitor] Scheduler ready — scans at 0:00, 6:00, 12:00, 18:00 UTC');
}
