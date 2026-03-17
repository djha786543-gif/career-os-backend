import pool from '../src/db';

const poojasInstitutions = [
  // Academic Institutions
  { name: 'Technical University of Munich', sector: 'academic' },
  { name: 'National University of Singapore', sector: 'academic' },
  { name: 'McGill University', sector: 'academic' },
  { name: 'ETH Zurich', sector: 'academic' },
  { name: 'University of Toronto', sector: 'academic' },
  { name: 'University of British Columbia', sector: 'academic' },
  { name: 'University of Melbourne', sector: 'academic' },
  { name: 'University of Sydney', sector: 'academic' },
  { name: 'University of Tokyo', sector: 'academic' },
  { name: 'Kyoto University', sector: 'academic' },
  { name: 'Seoul National University', sector: 'academic' },
  { name: 'Pohang University of Science and Technology', sector: 'academic' },
  // Include government/international organizations if needed
  // { name: 'European Space Agency', sector: 'government' },
];

async function seedPoojasInstitutions() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // First check if url column exists (safe way to handle schema variations)
    const { rows } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'monitor_orgs' AND column_name = 'url'
    `);
    const hasUrlColumn = rows.length > 0;

    const insertQuery = hasUrlColumn
      ? `
        INSERT INTO monitor_orgs (name, sector, candidate_id, url)
        VALUES ($1, $2, 'pooja', '')
        ON CONFLICT (name) DO NOTHING
      `
      : `
        INSERT INTO monitor_orgs (name, sector, candidate_id)
        VALUES ($1, $2, 'pooja')
        ON CONFLICT (name) DO NOTHING
      `;

    for (const institution of poojasInstitutions) {
      await client.query(insertQuery, [institution.name, institution.sector]);
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
