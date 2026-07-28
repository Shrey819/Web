// env loaded by node
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const fs = require('fs');
const path = require('path');

neonConfig.webSocketConstructor = ws;

async function runSeed() {
  console.log("Connecting to database...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const sqlPath = path.join(__dirname, '../database/seeds/001_base_catalog.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log("Running seed...");
    await pool.query(sql);
    console.log("Seed successful!");
  } catch(e) {
    console.error("Seed failed:", e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeed();
