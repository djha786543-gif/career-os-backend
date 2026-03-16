"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleDailyJob = scheduleDailyJob;
const node_cron_1 = __importDefault(require("node-cron"));
function scheduleDailyJob(fn) {
    // Runs every day at 2am
    node_cron_1.default.schedule('0 2 * * *', fn);
}
