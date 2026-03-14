"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let dbUrl = process.env.DATABASE_URL || '';
// Hardening: Force Internal Railway Networking
if (dbUrl.includes('proxy.rlwy.net')) {
    dbUrl = dbUrl.replace('proxy.rlwy.net', 'postgres.railway.internal');
}
const pool = new pg_1.Pool({
    connectionString: dbUrl,
    ssl: {
        rejectUnauthorized: false
    }
});
exports.default = pool;
