const { Client } = require('pg');

const connectionString = 'postgresql://postgres:%3FWGRkpAaKGX3cyk@db.bvgvyslczhooyvqqztyx.supabase.co:5432/postgres';

async function createBucket() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check columns of storage.buckets
    const colsRes = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'storage' AND table_name = 'buckets'
    `);
    console.log('storage.buckets columns:');
    console.table(colsRes.rows);

    // Let's check if candidate-photos bucket exists
    const checkRes = await client.query("SELECT * FROM storage.buckets WHERE id = 'candidate-photos'");
    if (checkRes.rows.length === 0) {
      console.log('Creating candidate-photos bucket...');
      // Insert public bucket
      await client.query("INSERT INTO storage.buckets (id, name, public) VALUES ('candidate-photos', 'candidate-photos', true)");
      console.log('Bucket created!');
    } else {
      console.log('candidate-photos bucket already exists.');
    }
  } catch (err) {
    console.error('Error creating bucket:', err);
  } finally {
    await client.end();
  }
}

createBucket();
