import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Priority: 1. Private URL (Internal) 2. Standard URL (Public)
const dbUrl = process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_URL || '';

const pool = new Pool({
    connectionString: dbUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

// Immediate connection test for Railway Logs
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ DB Connection Error:', err.message);
        console.log('TIP: Check if DATABASE_PRIVATE_URL is set in Railway Variables.');
    } else {
        console.log('🐘 PostgreSQL connected successfully via Railway internal network');
    }
});

export default pool;
