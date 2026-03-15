import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const rawUrl = process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_URL || '';
const isInternal = rawUrl.includes('railway.internal');
const isProxy = rawUrl.includes('rlwy.net');

const pool = new Pool({
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
    } else {
        console.log('🐘 PostgreSQL connected successfully');
    }
});

export default pool;
