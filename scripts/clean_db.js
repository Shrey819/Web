const { Pool } = require('@neondatabase/serverless');

async function cleanMockSessions() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log("Cleaning up old mock sessions from database...");
    const res = await pool.query(`DELETE FROM "UserSession" WHERE "ipAddress" LIKE '198.51.100.%' OR "country" IN ('Singapore', 'Canada')`);
    console.log(`Deleted ${res.rowCount} old mock sessions!`);
  } catch (e) {
    console.error("Cleanup error:", e);
  } finally {
    await pool.end();
  }
}

cleanMockSessions();
