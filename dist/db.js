"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Use the exact Public Proxy URL
const dbUrl = 'postgresql://postgres:RZENXndmOMxgMZxlaKtIwzosuAIsartk@caboose.proxy.rlwy.net:29794/railway';
const pool = new pg_1.Pool({
    connectionString: dbUrl,
    ssl: {
        rejectUnauthorized: false
    }
});
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ DB Connection Error:', err.message);
    }
    else {
        console.log('🐘 PostgreSQL connected successfully via Public Proxy');
    }
});
exports.default = pool;
