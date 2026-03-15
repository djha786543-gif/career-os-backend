"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Railway injects DATABASE_PRIVATE_URL with the internal hostname which is
// unreachable from some container configurations. DATABASE_PUBLIC_URL (the
// public proxy) is the stable fallback that always works.
const rawUrl = process.env.DATABASE_PUBLIC_URL ||
    process.env.DATABASE_PRIVATE_URL ||
    process.env.DATABASE_URL ||
    '';
const isInternal = rawUrl.includes('railway.internal');
const isProxy = rawUrl.includes('rlwy.net');
const pool = new pg_1.Pool({
    connectionString: rawUrl,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    max: 10,
    ssl: (isInternal || isProxy)
        ? { rejectUnauthorized: false }
        : false
});
pool.query('SELECT NOW()', (err) => {
    if (err) {
        console.error('❌ DB Connection Error:', err.message);
    }
    else {
        console.log('🐘 PostgreSQL connected successfully');
    }
});
exports.default = pool;
