import pool from '../src/db';

const poojasInstitutions = [
  { name: 'Technical University of Munich', sector: 'academic', country: 'Germany' },
  { name: 'National University of Singapore', sector: 'academic', country: 'Singapore' },
  { name: 'McGill University', sector: 'academic', country: 'Canada' },
  { name: 'ETH Zurich', sector: 'academic', country: 'Switzerland' },
  { name: 'University of Toronto', sector: 'academic', country: 'Canada' },
  { name: 'University of British Columbia', sector: 'academic', country: 'Canada' },
  { name: 'University of Melbourne', sector: 'academic', country: 'Australia' },
  { name: 'University of Sydney', sector: 'academic', country: 'Australia' },
  { name: 'University of Tokyo', sector: 'academic', country: 'Japan' },
  { name: 'Kyoto University', sector: 'academic', country: 'Japan' },
  { name: 'Seoul National University', sector: 'academic', country: 'South Korea' },
  { name: 'Pohang University of Science and Technology', sector: 'academic', country: 'South Korea' },
  { name: 'European Space Agency', sector: 'government', country: 'International' }
];

function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function seedPoojasInstitutions() {
  const client = await pool.connect();
  let successCount = 0;
  
  try {
    await client.query('BEGIN');

    for (const institution of poojasInstitutions) {
      try {
        const sector = toTitleCase(institution.sector);
        const country = toTitleCase(institution.country);
        
        await client.query(`
          INSERT INTO monitor_orgs (name, sector, country, is_active)
          VALUES ($1, $2, $3, true)
          ON CONFLICT (name) DO NOTHING
        `, [
          institution.name,
          sector,
          country
        ]);
        successCount++;
      } catch (rowError) {
        console.error(`⚠️ Failed to insert ${institution.name}:`, (rowError as Error).message);
        // Continue to next row
      }
    }

    await client.query('COMMIT');
    console.log(`✅ Successfully seeded ${successCount}/${poojasInstitutions.length} institutions`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Transaction failed:', (error as Error).message);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

seedPoojasInstitutions().catch(() => process.exit(1));
