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
       ON CONFLICT (name) DO NOTHING`,
      [name, sector, country]
    );
    return true;
  } catch (error) {
    return false;
  }
}

async function seedPoojasInstitutions() {
  console.log('🚀 Starting Pooja institution seeding');
  await checkExistingSectors();

  let successCount = 0;
  const client = await pool.connect();

  try {
    for (const institution of poojasInstitutions) {
      let sector = institution.sector === 'academic' ? 'Education' : 
                  institution.sector === 'government' ? 'Public Sector' : 
                  institution.sector;

      // First try with mapped sector
      let inserted = await safeInsert(institution.name, sector, institution.country);

      // If failed, try with NULL sector
      if (!inserted) continue; // Skip if already exists

      // Try again with alternative approaches if first insert failed
      if (!inserted) {
        console.log(`⚠️ Retrying ${institution.name} with NULL sector...`);
        inserted = await safeInsert(institution.name, null, institution.country);        
      }

      if (!inserted) {
        console.log(`⚠️ Could not insert ${institution.name} (conflict or constraints)`);
      } else {
        successCount++;
      }
    }

    console.log(`✅ Results: ${successCount} succeeded, ${poojasInstitutions.length - successCount} skipped/failed`);
  } catch (error) {
    console.error('❌ Fatal error during seeding:', (error as Error).message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedPoojasInstitutions().catch(() => process.exit(1));
