const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

async function seedActiveProducts() {
  console.log("Connecting to database to seed active products...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // 1. Ensure categories exist
    await pool.query(`
      INSERT INTO "Category" (id, name, slug, description, status, "sortOrder", "createdAt", "updatedAt")
      VALUES 
        ('cat_sensors', 'Sensors & Perception', 'sensors-perception', 'Precision industrial sensors and detectors', 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('cat_motors', 'Motors & Servo Drives', 'motors-drives', 'High performance motors and drives', 'active', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('cat_plcs', 'PLCs & Controllers', 'plcs-controllers', 'Programmable logic controllers and automation hubs', 'active', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = 'active';
    `);

    // 2. Ensure brand exists
    await pool.query(`
      INSERT INTO "Brand" (id, name, slug, status, "sortOrder", "createdAt", "updatedAt")
      VALUES ('default-brand', 'Industrial Automation Co.', 'industrial-automation-co', 'active', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 3. Insert active sample products
    const sampleProducts = [
      {
        id: 'prod_omron_sensor_01',
        name: 'Omron E2E-X5ME1 Inductive Proximity Sensor 24V DC',
        slug: 'omron-e2e-x5me1-inductive-proximity-sensor',
        sku: 'OMR-E2E-X5ME1',
        description: 'High reliability M12 shielded inductive proximity sensor with 5mm sensing distance, 24V DC operating voltage, and IP67 industrial protection rating.',
        shortDescription: 'M12 5mm sensing distance 24V DC IP67 sensor',
        categoryId: 'cat_sensors',
        basePrice: 450000, // ₹4,500.00
        compareAtPrice: 550000, // ₹5,500.00
        status: 'ACTIVE',
        imgUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'
      },
      {
        id: 'prod_siemens_plc_02',
        name: 'Siemens SIMATIC S7-1200 CPU 1214C DC/DC/DC',
        slug: 'siemens-simatic-s7-1200-cpu-1214c',
        sku: 'SIE-6ES7214-1AG40-0XB0',
        description: 'Compact industrial controller with 14 digital inputs, 10 digital outputs, 2 analog inputs, and integrated PROFINET Ethernet interface for factory automation.',
        shortDescription: '14 DI / 10 DO / 2 AI PROFINET compact PLC',
        categoryId: 'cat_plcs',
        basePrice: 2800000, // ₹28,000.00
        compareAtPrice: 3200000, // ₹32,000.00
        status: 'ACTIVE',
        imgUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80'
      },
      {
        id: 'prod_siemens_motor_03',
        name: 'Siemens 1FL6 Servo Motor 1.5kW 3000 RPM',
        slug: 'siemens-1fl6-servo-motor-15kw',
        sku: 'SIE-1FL6044-2AF21-1AA1',
        description: 'High dynamic AC servo motor 1.5 kW output, 3000 RPM rated speed, IP65 protection, designed for precision CNC motion control.',
        shortDescription: '1.5kW 3000 RPM IP65 precision AC servo motor',
        categoryId: 'cat_motors',
        basePrice: 3400000, // ₹34,000.00
        compareAtPrice: 3900000, // ₹39,000.00
        status: 'ACTIVE',
        imgUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80'
      },
      {
        id: 'prod_keyence_laser_04',
        name: 'Keyence LR-T5000 Laser Distance Sensor 0.5-5m',
        slug: 'keyence-lr-t5000-laser-distance-sensor',
        sku: 'KEY-LRT5000',
        description: 'Time-of-flight laser distance sensor featuring OLED digital display, up to 5 meter measurement range, and dual NPN/PNP output.',
        shortDescription: '0.5-5m Range TOF Laser Sensor with OLED',
        categoryId: 'cat_sensors',
        basePrice: 1850000, // ₹18,500.00
        compareAtPrice: 2100000, // ₹21,000.00
        status: 'ACTIVE',
        imgUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&auto=format&fit=crop&q=80'
      }
    ];

    for (const prod of sampleProducts) {
      await pool.query(`
        INSERT INTO "Product" (
          id, name, slug, sku, description, "shortDescription", "categoryId", "brandId", 
          "basePrice", "compareAtPrice", status, "publishedAt", "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'default-brand', $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          "basePrice" = EXCLUDED."basePrice",
          status = EXCLUDED.status;
      `, [prod.id, prod.name, prod.slug, prod.sku, prod.description, prod.shortDescription, prod.categoryId, prod.basePrice, prod.compareAtPrice, prod.status]);

      await pool.query(`
        INSERT INTO "Inventory" (id, "productId", quantity, status, reserved, "updatedAt")
        VALUES ($1, $2, 100, 'IN_STOCK', 0, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO NOTHING;
      `, ['inv_' + prod.id, prod.id]);

      await pool.query(`
        INSERT INTO "ProductImage" (id, "productId", url, alt, "isPrimary", "order", "createdAt")
        VALUES ($1, $2, $3, $4, true, 0, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO NOTHING;
      `, ['img_' + prod.id, prod.id, prod.imgUrl, prod.name]);
    }

    console.log("Active products successfully seeded!");
  } catch (err) {
    console.error("Failed to seed active products:", err);
  } finally {
    await pool.end();
  }
}

seedActiveProducts();
