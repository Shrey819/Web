const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

async function seedWixDemo() {
  console.log("Connecting to database for Wix demo seed...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const prodId = "prod_hello_wix_demo";
    const slug = "hello";
    const name = "Hello";
    const sku = "110001";
    const description = "<p>1. Hello <strong>This is Shrey and look</strong> dedscs<br/>1. sdff<br/>2. sdfs<br/>3. d</p>";

    // 1. Categories
    await pool.query(`
      INSERT INTO "Category" ("id", "name", "slug", "status", "sortOrder", "createdAt", "updatedAt")
      VALUES 
        ('cat2', 'cat2', 'cat2', 'active', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('cat3', 'cat3', 'cat3', 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('cat4', 'cat4', 'cat4', 'inactive', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "updatedAt" = CURRENT_TIMESTAMP;
    `);

    // 2. Ribbons
    await pool.query(`
      INSERT INTO "ProductRibbon" ("id", "name", "color")
      VALUES 
        ('rib_newarrival', 'New Arrival', '#10b981'),
        ('rib_bestseller', 'Best Seller', '#f59e0b'),
        ('rib_sale', 'Sale', '#ef4444')
      ON CONFLICT ("name") DO NOTHING;
    `);

    // 3. Tags
    const tagNames = ["5", "6", "tag_here", "tag.name", "tag_me", "me_tag", "more_tag", "zero_tag", "play_tag", "2", "3", "4", "1"];
    for (let i = 0; i < tagNames.length; i++) {
      await pool.query(`
        INSERT INTO "ProductTag" ("id", "name")
        VALUES ($1, $2)
        ON CONFLICT ("name") DO UPDATE SET "name" = EXCLUDED."name";
      `, [`tag_${i + 100}`, tagNames[i]]);
    }

    // 4. Product Record
    await pool.query(`
      INSERT INTO "Product" (
        "id", "name", "slug", "sku", "description", "status", "visible", "showInPos",
        "categoryId", "primaryCategoryId", "primaryRibbon", "brand",
        "basePrice", "price", "compareAtPrice", "strikethroughPrice",
        "showPricePerUnit", "baseUnit", "baseUnitMeasurement", "totalUnits", "totalUnitsMeasurement", "taxGroup",
        "createdAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, 'ACTIVE', true, true,
        'cat2', 'cat2', 'New Arrival', 'samsung',
        45000, 45000, 50000, 50000,
        true, 100, 'g', 25, 'g', 'Products (default rate)',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT ("id") DO UPDATE SET
        "name" = EXCLUDED."name",
        "slug" = EXCLUDED."slug",
        "description" = EXCLUDED."description",
        "primaryRibbon" = EXCLUDED."primaryRibbon",
        "brand" = EXCLUDED."brand",
        "price" = EXCLUDED."price",
        "basePrice" = EXCLUDED."basePrice",
        "strikethroughPrice" = EXCLUDED."strikethroughPrice",
        "showPricePerUnit" = EXCLUDED."showPricePerUnit",
        "updatedAt" = CURRENT_TIMESTAMP;
    `, [prodId, name, slug, sku, description]);

    // 5. ProductCategory join
    await pool.query(`
      INSERT INTO "ProductCategory" ("productId", "categoryId")
      VALUES ($1, 'cat2'), ($1, 'cat3')
      ON CONFLICT ("productId", "categoryId") DO NOTHING;
    `, [prodId]);

    // 6. Product Tag Assignments
    const tagRows = await pool.query(`SELECT id FROM "ProductTag"`);
    for (const t of tagRows.rows) {
      await pool.query(`
        INSERT INTO "ProductTagAssignment" ("productId", "tagId")
        VALUES ($1, $2)
        ON CONFLICT ("productId", "tagId") DO NOTHING;
      `, [prodId, t.id]);
    }

    // 7. Product Images
    await pool.query(`DELETE FROM "ProductImage" WHERE "productId" = $1;`, [prodId]);
    const images = [
      { url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=80", isPrimary: true },
      { url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=80", isPrimary: false },
      { url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1000&auto=format&fit=crop&q=80", isPrimary: false }
    ];
    for (let i = 0; i < images.length; i++) {
      await pool.query(`
        INSERT INTO "ProductImage" ("id", "productId", "url", "alt", "isPrimary", "order")
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [`med_hello_${i + 1}`, prodId, images[i].url, "Hello Product Image", images[i].isPrimary, i]);
    }

    // 8. Options & Choices
    await pool.query(`DELETE FROM "ProductOption" WHERE "productId" = $1;`, [prodId]);

    // Color option (5 swatches)
    const optColorId = "opt_hello_color";
    await pool.query(`
      INSERT INTO "ProductOption" ("id", "productId", "name", "fieldType", "sortOrder")
      VALUES ($1, $2, 'Color', 'SWATCH_CHOICES', 0);
    `, [optColorId, prodId]);

    const colorChoices = [
      { name: "Butter Yellow", hex: "#F5F0B2" },
      { name: "Burgundy", hex: "#530C1E" },
      { name: "Dark Green", hex: "#164F19" },
      { name: "Red", hex: "#C61515" },
      { name: "Sky Blue", hex: "#83C6E3" }
    ];
    for (let i = 0; i < colorChoices.length; i++) {
      await pool.query(`
        INSERT INTO "ProductOptionChoice" ("id", "optionId", "name", "colorHex", "sortOrder")
        VALUES ($1, $2, $3, $4, $5);
      `, [`ch_col_${i + 1}`, optColorId, colorChoices[i].name, colorChoices[i].hex, i]);
    }

    // Size option (3 pills)
    const optSizeId = "opt_hello_size";
    await pool.query(`
      INSERT INTO "ProductOption" ("id", "productId", "name", "fieldType", "sortOrder")
      VALUES ($1, $2, 'Size', 'TEXT_CHOICES', 1);
    `, [optSizeId, prodId]);

    const sizeChoices = ["4", "5", "6"];
    for (let i = 0; i < sizeChoices.length; i++) {
      await pool.query(`
        INSERT INTO "ProductOptionChoice" ("id", "optionId", "name", "sortOrder")
        VALUES ($1, $2, $3, $4);
      `, [`ch_size_${i + 1}`, optSizeId, sizeChoices[i], i]);
    }

    // Model option (3 pills)
    const optModelId = "opt_hello_model";
    await pool.query(`
      INSERT INTO "ProductOption" ("id", "productId", "name", "fieldType", "sortOrder")
      VALUES ($1, $2, 'Model', 'TEXT_CHOICES', 2);
    `, [optModelId, prodId]);

    const modelChoices = ["f", "a", "m"];
    for (let i = 0; i < modelChoices.length; i++) {
      await pool.query(`
        INSERT INTO "ProductOptionChoice" ("id", "optionId", "name", "sortOrder")
        VALUES ($1, $2, $3, $4);
      `, [`ch_mod_${i + 1}`, optModelId, modelChoices[i], i]);
    }

    // 9. Generate 45 Variants (5 × 3 × 3 = 45 combinations)
    await pool.query(`DELETE FROM "ProductVariant" WHERE "productId" = $1;`, [prodId]);

    let variantIdx = 1;
    for (const color of colorChoices) {
      for (const size of sizeChoices) {
        for (const model of modelChoices) {
          const varId = `var_hello_${variantIdx}`;
          const vSku = `VAR-HELLO-${String(variantIdx).padStart(3, '0')}`;
          const attrs = { Color: color.name, Size: size, Model: model };
          const price = color.name === "Dark Green" ? 40000 : 45000;
          const strikethrough = 50000;

          await pool.query(`
            INSERT INTO "ProductVariant" (
              "id", "productId", "sku", "price", "strikethroughPrice",
              "trackQuantity", "stockQuantity", "inventoryStatus", "preOrderEnabled",
              "totalUnits", "totalUnitsMeasurement", "packageLength", "packageWidth", "packageHeight", "packageUnit",
              "attributes", "createdAt", "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, false, 100, 'IN_STOCK', false, 25, 'g', 25, 25, 20, 'cm', $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
          `, [varId, prodId, vSku, price, strikethrough, JSON.stringify(attrs)]);

          variantIdx++;
        }
      }
    }

    // 10. Assigned Info Sections
    await pool.query(`DELETE FROM "ProductAssignedInfoSection" WHERE "productId" = $1;`, [prodId]);
    const sections = ["sec_demo", "sec_prodinfo", "sec_return", "sec_shipping"];
    for (let i = 0; i < sections.length; i++) {
      await pool.query(`
        INSERT INTO "ProductAssignedInfoSection" ("productId", "sectionId", "sortOrder")
        VALUES ($1, $2, $3)
        ON CONFLICT ("productId", "sectionId") DO UPDATE SET "sortOrder" = $3;
      `, [prodId, sections[i], i]);
    }

    console.log("Successfully seeded Wix Demo product with 45 variants and all relations!");
  } catch (e) {
    console.error("Seed failed:", e);
  } finally {
    await pool.end();
  }
}

seedWixDemo();
