require("dotenv").config();
const { Pool } = require("@neondatabase/serverless");
const argon2 = require("argon2");

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
    const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
    const name = process.env.SEED_ADMIN_NAME || "Admin";

    const hashedPassword = await argon2.hash(password);

    console.log("Seeding admin user...");
    await pool.query(
      `INSERT INTO "User" ("id", "email", "name", "password", "role", "createdAt", "updatedAt") 
       VALUES (gen_random_uuid(), $1, $2, $3, 'SUPER_ADMIN', NOW(), NOW())
       ON CONFLICT ("email") DO NOTHING`,
      [email, name, hashedPassword]
    );
    console.log("SUCCESS! Admin user seeded.");
  } catch (error) {
    console.error("Error seeding:", error);
  } finally {
    await pool.end();
  }
}

seed();
