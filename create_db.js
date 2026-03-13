import pg from 'pg';

const client = new pg.Client({
  host: 'localhost',
  port: 5432,
  user: 'digitalprashant07',
  database: 'postgres'
});

async function createDatabase() {
  try {
    await client.connect();
    await client.query('CREATE DATABASE tradermind');
    console.log('Database created');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

createDatabase();