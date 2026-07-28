require("dotenv").config();
const { Pool } = require("@neondatabase/serverless");
const fs = require("fs");
const ws = require("ws");

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }
  
  const pool = new Pool({ connectionString });
  
  try {
    const sql = fs.readFileSync("schema.sql", "utf8");
    console.log("Executing schema.sql over WebSockets on port 443...");
    await pool.query(sql);
    console.log("SUCCESS! Database schema pushed successfully via WebSockets.");
  } catch (error) {
    console.error("Error executing schema:", error);
  } finally {
    await pool.end();
  }
}

run();
