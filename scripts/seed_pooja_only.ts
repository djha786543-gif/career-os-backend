import pool from '../src/db';

const poojasTargetCompanies = [
  'Technical University of Munich',
  'National University of Singapore',
  'McGill University',
  'ETH Zurich',
  'University of Toronto',
  'University of British Columbia',
  'University of Melbourne',
  'University of Sydney', 
  'University of Tokyo',
  'Kyoto University',
  'Seoul National University',
  'Pohang University of Science and Technology',
  'University of Hong Kong',
  'Chinese University of Hong Kong',
  'Tsinghua University',
  'Peking University',
  'Shanghai Jiao Tong University',
  'Fudan University',
  'Nanyang Technological University',
  'University College London',
  'Imperial College London',
  'University of Edinburgh',
  'University of Manchester',
  'University of Copenhagen',
  'Karolinska Institute',
  'University of Helsinki',
  'University of Oslo',
  'University of Amsterdam',
  'Delft University of Technology',
  'University of Groningen',
  'University of Berlin',
  'University of Munich',
  'Heidelberg University',
  'University of Freiburg',
  'University of Zurich',
  'University of Geneva',
  'University of Vienna',
  'University of Copenhagen',
  'University of Uppsala',
  'University of Lund',
  'University of Oslo',
  'University of Helsinki',
  'University of Copenhagen',
  'University of Dublin',
  'University of Glasgow',
  'University of Birmingham',
  'University of Leeds',
  'University of Sheffield',
  'University of Nottingham'
];

async function seedPoojasCompanies() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    for (const company of poojasTargetCompanies) {
      await client.query(`
        INSERT INTO TargetCompanies (name, candidate_id)
        VALUES ($1, 'pooja')
        ON CONFLICT (name) DO NOTHING
      `, [company]);
    }

    await client.query('COMMIT');
    console.log(`✅ Successfully seeded ${poojasTargetCompanies.length} companies for Pooja`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding Pooja companies:', error);
    throw error;
  } finally {
    client.release();
  }
}

seedPoojasCompanies()
  .then(() => pool.end())
  .catch(() => process.exit(1));
