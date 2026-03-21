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
    // Cost optimisation: once daily at 08:00 UTC, scanning 10 orgs per run.
    // All 65 orgs rotate through over 6-7 days (oldest-first ordering in runFullScan).
    node_cron_1.default.schedule('0 8 * * *', async () => {
        console.log('[Monitor] Cron triggered at', new Date().toISOString());
        try {
            await (0, monitorEngine_1.runFullScan)();
        }
        catch (err) {
            console.error('[Monitor] Cron scan error:', err.message);
        }
    });
    console.log('[Monitor] Scheduler ready — daily scan at 08:00 UTC (10 orgs per run)');
}
