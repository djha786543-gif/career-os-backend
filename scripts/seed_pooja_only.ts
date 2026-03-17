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
  // Example government organization:
  { name: 'European Space Agency', sector: 'government', country: 'International' }
];

async function seedPoojasInstitutions() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const insertQuery = `
      INSERT INTO monitor_orgs (name, sector, country, is_active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (name) DO NOTHING
    `;

    for (const institution of poojasInstitutions) {
      await client.query(insertQuery, [
        institution.name,
        institution.sector,
        institution.country
      ]);
    }

    await client.query('COMMIT');
    console.log(`✅ Successfully seeded ${poojasInstitutions.length} institutions for Pooja`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding Pooja institutions:', error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

seedPoojasInstitutions().catch(() => process.exit(1));
