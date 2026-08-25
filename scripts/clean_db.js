const { Pool } = require('@neondatabase/serverless');

async function updateMainframeData() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const cleanMainframeHero = {
      eyebrow: "INDUSTRIAL AUTOMATION SYSTEM",
      subheading: "High-Precision Sensors, PLCs & Factory Drives",
      headline: "Engineered for 99.9% industrial uptime. Factory-certified OEM components with same-day B2B dispatch. What system are we powering today?",
      videoUrl: "/videos/Character_horizontal_eye_scan.mp4",
      ctaText: "Request Instant Quote",
      ctaUrl: "/quote",
      salesEmailText: "Reach Sales:",
      salesEmail: "omautomation2012@gmail.com",
      navPills: [
        { label: "Sensors & Perception", url: "/category/sensors" },
        { label: "Ballscrew", url: "/products" },
        { label: "Linear Guideway", url: "/products" },
        { label: "Instant RFQ Portal", url: "/quote" }
      ]
    };

    console.log("Updating homepage_mainframe_hero in SystemSetting...");
    await pool.query(
      `INSERT INTO "SystemSetting" ("key", "value", "updatedAt")
       VALUES ('homepage_mainframe_hero', $1, NOW())
       ON CONFLICT ("key") DO UPDATE SET "value" = $1, "updatedAt" = NOW()`,
      [JSON.stringify(cleanMainframeHero)]
    );

    const res = await pool.query(`SELECT "value" FROM "SystemSetting" WHERE "key" = 'homepage_section_instances'`);
    if (res.rows.length > 0 && res.rows[0].value) {
      try {
        const instances = JSON.parse(res.rows[0].value);
        for (const k of Object.keys(instances)) {
          if (k.startsWith('sec-mainframe')) {
            instances[k] = cleanMainframeHero;
          }
        }
        await pool.query(
          `UPDATE "SystemSetting" SET "value" = $1, "updatedAt" = NOW() WHERE "key" = 'homepage_section_instances'`,
          [JSON.stringify(instances)]
        );
        console.log("Updated sectionInstances for sec-mainframe");
      } catch (e) {
        console.error("Instances parse error:", e);
      }
    }

    console.log("Mainframe Hero data updated successfully!");
  } catch (e) {
    console.error("Update error:", e);
  } finally {
    await pool.end();
  }
}

updateMainframeData();

