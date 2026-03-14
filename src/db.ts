import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

let dbUrl = process.env.DATABASE_URL || '';

// Hardening: Force Internal Railway Networking
if (dbUrl.includes('proxy.rlwy.net')) {
    dbUrl = dbUrl.replace('proxy.rlwy.net', 'postgres.railway.internal');
}

const pool = new Pool({
    connectionString: dbUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

export default pool;
