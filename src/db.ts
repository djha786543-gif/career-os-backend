import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Use the exact Public Proxy URL
const dbUrl = 'postgresql://postgres:RZENXndmOMxgMZxlaKtIwzosuAIsartk@caboose.proxy.rlwy.net:29794/railway';

const pool = new Pool({
    connectionString: dbUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ DB Connection Error:', err.message);
    } else {
        console.log('🐘 PostgreSQL connected successfully via Public Proxy');
    }
});

export default pool;
