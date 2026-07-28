require('dotenv').config();
const { Client } = require('pg');

async function test() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query('SELECT id, name, slug FROM "Product"');
    console.log("PRODUCTS IN DB:", res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
test();
