require("dotenv").config();
const { Pool } = require("@neondatabase/serverless");

async function seedCategories() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log("Seeding categories...");
    
    // Seed Categories
    await pool.query(`
      INSERT INTO "Category" ("id", "name", "slug", "description", "createdAt", "updatedAt") 
      VALUES 
        ('cat_sensors', 'Sensors', 'sensors', 'Industrial sensors', NOW(), NOW()),
        ('cat_motors', 'Motors & Drives', 'motors', 'Heavy duty motors', NOW(), NOW()),
        ('cat_plcs', 'PLCs & Controllers', 'plcs', 'Logic controllers', NOW(), NOW())
      ON CONFLICT ("slug") DO NOTHING
    `);

    console.log("SUCCESS! Categories seeded.");
  } catch (error) {
    console.error("Error seeding categories:", error);
  } finally {
    await pool.end();
  }
}

seedCategories();
