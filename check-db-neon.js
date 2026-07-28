require('dotenv').config();
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

async function test() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query('SELECT id, name, slug FROM "Product"');
    console.log("PRODUCTS IN DB:", res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
test();
