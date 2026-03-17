import pool from './src/db';

async function check() {
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'monitor_orgs'");
    console.log("--- Columns in monitor_orgs ---");
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error("Error fetching columns:", err);
    process.exit(1);
  }
}

check();