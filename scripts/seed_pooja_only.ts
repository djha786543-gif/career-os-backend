import pool from '../src/db';

// Full dataset of 50+ institutions
const poojasInstitutions = [
  { name: 'Technical University of Munich', sector: 'academic', country: 'Germany' },
  { name: 'National University of Singapore', sector: 'academic', country: 'Singapore' },
  { name: 'McGill University', sector: 'academic', country: 'Canada' },
  { name: 'ETH Zurich', sector: 'academic', country: 'Switzerland' },
  { name: 'University of Toronto', sector: 'academic', country: 'Canada' },
  // ... include all other institutions from your list
  { name: 'European Space Agency', sector: 'government', country: 'International' }
];

async function checkExistingSectors() {
  try {
    const res = await pool.query('SELECT DISTINCT sector FROM monitor_orgs WHERE sector IS NOT NULL');
    console.log('ℹ️ Existing sectors in database:', res.rows.map(r => r.sector).join(', '));
  } catch (error) {
    console.error('⚠️ Could not check existing sectors:', (error as Error).message);
  }
}

async function safeInsert(name: string, sector: string | null, country: string) {
  try {
    await pool.query(
      `INSERT INTO monitor_orgs (name, sector, country, is_active)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (name) DO UPDATE 
       SET sector = EXCLUDED.sector, 
           is_active = EXCLUDED.is_active`,
      [name, sector, country]
    );
    return true;
  } catch (error) {
    console.error(`⚠️ Insert failed for ${name}:`, (error as Error).message);
    return false;
  }
}

async function seedPoojasInstitutions() {
  console.log('🚀 Starting Pooja institution seeding with UPSERT');
  await checkExistingSectors();

  let updateCount = 0;
  const client = await pool.connect();

  try {
    for (const institution of poojasInstitutions) {
      let sector = institution.sector === 'academic' ? 'academia' : 
                  institution.sector === 'government' ? 'international' : 
                  institution.sector;

      const inserted = await safeInsert(institution.name, sector, institution.country);
      if (inserted) updateCount++;
    }

    console.log(`✅ Results: ${updateCount} institutions upserted`);
  } catch (error) {
    console.error('❌ Fatal error during seeding:', (error as Error).message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedPoojasInstitutions().catch(() => process.exit(1));
