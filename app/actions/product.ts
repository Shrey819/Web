"use server";

import { transaction, query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { productFormSchema, type ProductFormValues } from "@/lib/validations/product";
import { PoolClient } from "@neondatabase/serverless";

const generateId = () => "cl" + crypto.randomBytes(12).toString("hex");

/**
 * Generate unique slug with numeric collision fallback
 */
async function generateUniqueSlug(baseName: string, currentId?: string): Promise<string> {
  let baseSlug = baseName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  if (!baseSlug) baseSlug = "product-" + Date.now();

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await query(
      `SELECT "id" FROM "Product" WHERE "slug" = $1 ${currentId ? 'AND "id" != $2' : ''} LIMIT 1`,
      currentId ? [slug, currentId] : [slug]
    );

    if (existing.rows.length === 0) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * Generate human-readable product code using PostgreSQL sequence
 */
async function generateProductCode(client: PoolClient): Promise<string> {
  const year = new Date().getFullYear();
  const seqRes = await client.query(`SELECT NEXTVAL('product_code_seq') as seq`);
  const seqNum = String(seqRes.rows[0].seq).padStart(6, '0');
  return `PRD-${year}-${seqNum}`;
}

/**
 * Safe revalidation helper
 */
function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore outside Next.js request context
  }
}

/**
 * CREATE PRODUCT (Atomic PostgreSQL Transaction)
 */
export async function createProduct(input: ProductFormValues) {
  try {
    const validated = productFormSchema.parse(input);
    const productId = generateId();
    const slug = await generateUniqueSlug(validated.name);

    let productCode = validated.productCode;

    await transaction(async (client) => {
      if (!productCode) {
        productCode = await generateProductCode(client);
      }

      // 1. Resolve Brand
      const finalBrandId = validated.brandId || "default-brand";
      await client.query(`
        INSERT INTO "Brand" ("id", "name", "slug", "status", "sortOrder", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'active', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("slug") DO NOTHING
      `, [finalBrandId, 'Default Brand', 'default-brand']);

      // 2. Insert Core Product
      await client.query(`
        INSERT INTO "Product" (
          "id", "name", "slug", "sku", "productCode", "barcode", "mpn", "upc", "ean", "gtin", "manufacturer",
          "shortDescription", "description", "categoryId", "brandId", "status",
          "basePrice", "salePrice", "compareAtPrice", "costPrice", "wholesalePrice", "dealerPrice",
          "gstRate", "priceIncTax", "unit", "packSize", "minOrderQuantity",
          "b2bQuoteRequired", "priceOnRequest", "featured", "bestSeller", "newArrival", "quoteOnly",
          "isPhysical", "weight", "weightUnit", "length", "width", "height", "dimensionUnit",
          "shippingClass", "freeShipping", "isFragile", "isDangerousGoods", "countryOfOrigin", "hsCode",
          "seoTitle", "seoDesc", "canonicalUrl", "openGraphTitle", "openGraphDesc", "openGraphImage", "noIndex",
          "warrantyPeriod", "warrantyType", "isReturnable", "returnWindowDays",
          "installationAvailable", "technicalSupportAvailable", "calibrationRequired",
          "publishedAt", "createdAt", "updatedAt"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22,
          $23, $24, $25, $26, $27,
          $28, $29, $30, $31, $32, $33,
          $34, $35, $36, $37, $38, $39, $40,
          $41, $42, $43, $44, $45, $46,
          $47, $48, $49, $50, $51, $52, $53,
          $54, $55, $56, $57,
          $58, $59, $60,
          ${validated.status === 'ACTIVE' ? 'CURRENT_TIMESTAMP' : 'NULL'},
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `, [
        productId, validated.name, slug, validated.sku, productCode, validated.barcode || null, validated.mpn || null, validated.upc || null, validated.ean || null, validated.gtin || null, validated.manufacturer || null,
        validated.shortDescription || null, validated.description || null, validated.categoryId, finalBrandId, validated.status,
        validated.basePrice, validated.salePrice || null, validated.compareAtPrice || null, validated.costPrice || null, validated.wholesalePrice || null, validated.dealerPrice || null,
        validated.gstRate, validated.priceIncTax, validated.unit, validated.packSize, validated.minOrderQuantity,
        validated.b2bQuoteRequired, validated.priceOnRequest, validated.featured, validated.bestSeller, validated.newArrival, validated.quoteOnly,
        validated.isPhysical, validated.weight || null, validated.weightUnit, validated.length || null, validated.width || null, validated.height || null, validated.dimensionUnit,
        validated.shippingClass || null, validated.freeShipping, validated.isFragile, validated.isDangerousGoods, validated.countryOfOrigin || null, validated.hsCode || null,
        validated.seoTitle || null, validated.seoDesc || null, validated.canonicalUrl || null, validated.openGraphTitle || null, validated.openGraphDesc || null, validated.openGraphImage || null, validated.noIndex,
        validated.warrantyPeriod || null, validated.warrantyType || null, validated.isReturnable, validated.returnWindowDays,
        validated.installationAvailable, validated.technicalSupportAvailable, validated.calibrationRequired
      ]);

      // 3. Insert Inventory
      await client.query(`
        INSERT INTO "Inventory" ("id", "productId", "quantity", "status", "reserved", "updatedAt")
        VALUES ($1, $2, $3, $4, 0, CURRENT_TIMESTAMP)
      `, [generateId(), productId, validated.stockQuantity, validated.stockQuantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK']);

      // 4. Insert Images
      if (validated.images && validated.images.length > 0) {
        for (let idx = 0; idx < validated.images.length; idx++) {
          const img = validated.images[idx];
          await client.query(`
            INSERT INTO "ProductImage" ("id", "productId", "url", "alt", "isPrimary", "order", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          `, [generateId(), productId, img.url, img.altText || validated.name, img.isPrimary, idx]);
        }
      }

      // 5. Insert Industrial Documents
      if (validated.documents && validated.documents.length > 0) {
        for (let idx = 0; idx < validated.documents.length; idx++) {
          const doc = validated.documents[idx];
          await client.query(`
            INSERT INTO "ProductDocument" ("id", "productId", "title", "documentType", "fileUrl", "version", "fileSize", "sortOrder", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
          `, [generateId(), productId, doc.title, doc.documentType, doc.fileUrl, doc.version || 'v1.0', doc.fileSize || '', idx]);
        }
      }

      // 6. Insert Specifications
      if (validated.specifications && validated.specifications.length > 0) {
        const groupsMap = new Map<string, typeof validated.specifications>();
        validated.specifications.forEach(s => {
          const list = groupsMap.get(s.groupName) || [];
          list.push(s);
          groupsMap.set(s.groupName, list);
        });

        let groupOrder = 0;
        for (const [groupName, specsList] of Array.from(groupsMap.entries())) {
          const groupId = generateId();
          await client.query(`
            INSERT INTO "SpecificationGroup" ("id", "productId", "name", "order", "createdAt")
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          `, [groupId, productId, groupName, groupOrder++]);

          for (let sIdx = 0; sIdx < specsList.length; sIdx++) {
            const spec = specsList[sIdx];
            await client.query(`
              INSERT INTO "ProductSpecification" ("id", "groupId", "name", "value", "order")
              VALUES ($1, $2, $3, $4, $5)
            `, [generateId(), groupId, spec.name, spec.value, sIdx]);
          }
        }
      }

      // 7. Audit Log
      await client.query(`
        INSERT INTO "ProductAuditLog" ("id", "productId", "action", "changedBy", "newData", "changedAt")
        VALUES ($1, $2, 'CREATED', 'admin', $3, CURRENT_TIMESTAMP)
      `, [generateId(), productId, JSON.stringify({ name: validated.name, sku: validated.sku, productCode })]);
    });

    safeRevalidate("/admin/products");
    safeRevalidate("/products");
    return { success: true, id: productId, productCode };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    console.error("Failed to create product:", error);
    return { success: false, error: message };
  }
}

/**
 * UPDATE PRODUCT (Atomic PostgreSQL Transaction)
 */
export async function updateProduct(productId: string, input: ProductFormValues) {
  try {
    const validated = productFormSchema.parse(input);
    const slug = await generateUniqueSlug(validated.name, productId);

    await transaction(async (client) => {
      // 1. Fetch Previous State for Audit
      const prev = await client.query(`SELECT * FROM "Product" WHERE "id" = $1`, [productId]);
      const prevData = prev.rows[0] || {};

      // 2. Update Core Product
      await client.query(`
        UPDATE "Product" SET
          "name" = $1, "slug" = $2, "sku" = $3, "barcode" = $4, "mpn" = $5, "upc" = $6, "ean" = $7, "gtin" = $8, "manufacturer" = $9,
          "shortDescription" = $10, "description" = $11, "categoryId" = $12, "brandId" = $13, "status" = $14,
          "basePrice" = $15, "salePrice" = $16, "compareAtPrice" = $17, "costPrice" = $18, "wholesalePrice" = $19, "dealerPrice" = $20,
          "gstRate" = $21, "priceIncTax" = $22, "unit" = $23, "packSize" = $24, "minOrderQuantity" = $25,
          "b2bQuoteRequired" = $26, "priceOnRequest" = $27, "featured" = $28, "bestSeller" = $29, "newArrival" = $30, "quoteOnly" = $31,
          "isPhysical" = $32, "weight" = $33, "weightUnit" = $34, "length" = $35, "width" = $36, "height" = $37, "dimensionUnit" = $38,
          "shippingClass" = $39, "freeShipping" = $40, "isFragile" = $41, "isDangerousGoods" = $42, "countryOfOrigin" = $43, "hsCode" = $44,
          "seoTitle" = $45, "seoDesc" = $46, "canonicalUrl" = $47, "openGraphTitle" = $48, "openGraphDesc" = $49, "openGraphImage" = $50, "noIndex" = $51,
          "warrantyPeriod" = $52, "warrantyType" = $53, "isReturnable" = $54, "returnWindowDays" = $55,
          "installationAvailable" = $56, "technicalSupportAvailable" = $57, "calibrationRequired" = $58,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = $59
      `, [
        validated.name, slug, validated.sku, validated.barcode || null, validated.mpn || null, validated.upc || null, validated.ean || null, validated.gtin || null, validated.manufacturer || null,
        validated.shortDescription || null, validated.description || null, validated.categoryId, validated.brandId || 'default-brand', validated.status,
        validated.basePrice, validated.salePrice || null, validated.compareAtPrice || null, validated.costPrice || null, validated.wholesalePrice || null, validated.dealerPrice || null,
        validated.gstRate, validated.priceIncTax, validated.unit, validated.packSize, validated.minOrderQuantity,
        validated.b2bQuoteRequired, validated.priceOnRequest, validated.featured, validated.bestSeller, validated.newArrival, validated.quoteOnly,
        validated.isPhysical, validated.weight || null, validated.weightUnit, validated.length || null, validated.width || null, validated.height || null, validated.dimensionUnit,
        validated.shippingClass || null, validated.freeShipping, validated.isFragile, validated.isDangerousGoods, validated.countryOfOrigin || null, validated.hsCode || null,
        validated.seoTitle || null, validated.seoDesc || null, validated.canonicalUrl || null, validated.openGraphTitle || null, validated.openGraphDesc || null, validated.openGraphImage || null, validated.noIndex,
        validated.warrantyPeriod || null, validated.warrantyType || null, validated.isReturnable, validated.returnWindowDays,
        validated.installationAvailable, validated.technicalSupportAvailable, validated.calibrationRequired,
        productId
      ]);

      // 3. Update Inventory
      await client.query(`
        UPDATE "Inventory" SET "quantity" = $1, "status" = $2, "updatedAt" = CURRENT_TIMESTAMP WHERE "productId" = $3
      `, [validated.stockQuantity, validated.stockQuantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK', productId]);

      // 4. Replace Images
      await client.query(`DELETE FROM "ProductImage" WHERE "productId" = $1`, [productId]);
      if (validated.images && validated.images.length > 0) {
        for (let idx = 0; idx < validated.images.length; idx++) {
          const img = validated.images[idx];
          await client.query(`
            INSERT INTO "ProductImage" ("id", "productId", "url", "alt", "isPrimary", "order", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          `, [generateId(), productId, img.url, img.altText || validated.name, img.isPrimary, idx]);
        }
      }

      // 5. Replace Documents
      await client.query(`DELETE FROM "ProductDocument" WHERE "productId" = $1`, [productId]);
      if (validated.documents && validated.documents.length > 0) {
        for (let idx = 0; idx < validated.documents.length; idx++) {
          const doc = validated.documents[idx];
          await client.query(`
            INSERT INTO "ProductDocument" ("id", "productId", "title", "documentType", "fileUrl", "version", "fileSize", "sortOrder", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
          `, [generateId(), productId, doc.title, doc.documentType, doc.fileUrl, doc.version || 'v1.0', doc.fileSize || '', idx]);
        }
      }

      // 6. Replace Specifications
      await client.query(`DELETE FROM "SpecificationGroup" WHERE "productId" = $1`, [productId]);
      if (validated.specifications && validated.specifications.length > 0) {
        const groupsMap = new Map<string, typeof validated.specifications>();
        validated.specifications.forEach(s => {
          const list = groupsMap.get(s.groupName) || [];
          list.push(s);
          groupsMap.set(s.groupName, list);
        });

        let groupOrder = 0;
        for (const [groupName, specsList] of Array.from(groupsMap.entries())) {
          const groupId = generateId();
          await client.query(`
            INSERT INTO "SpecificationGroup" ("id", "productId", "name", "order", "createdAt")
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          `, [groupId, productId, groupName, groupOrder++]);

          for (let sIdx = 0; sIdx < specsList.length; sIdx++) {
            const spec = specsList[sIdx];
            await client.query(`
              INSERT INTO "ProductSpecification" ("id", "groupId", "name", "value", "order")
              VALUES ($1, $2, $3, $4, $5)
            `, [generateId(), groupId, spec.name, spec.value, sIdx]);
          }
        }
      }

      // 7. Audit Log
      await client.query(`
        INSERT INTO "ProductAuditLog" ("id", "productId", "action", "changedBy", "previousData", "newData", "changedAt")
        VALUES ($1, $2, 'UPDATED', 'admin', $3, $4, CURRENT_TIMESTAMP)
      `, [generateId(), productId, JSON.stringify(prevData), JSON.stringify({ name: validated.name, status: validated.status })]);
    });

    safeRevalidate("/admin/products");
    safeRevalidate(`/admin/products/${productId}`);
    safeRevalidate("/products");
    return { success: true, id: productId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update product";
    console.error("Failed to update product:", error);
    return { success: false, error: message };
  }
}

/**
 * DUPLICATE PRODUCT
 */
export async function duplicateProduct(productId: string) {
  try {
    const original = await query(`SELECT * FROM "Product" WHERE "id" = $1`, [productId]);
    if (original.rows.length === 0) return { success: false, error: "Product not found" };

    const prod = original.rows[0];
    const newId = generateId();
    const newName = `${prod.name} (Copy)`;
    const newSlug = await generateUniqueSlug(newName);
    const newSku = `${prod.sku}-COPY-${Math.floor(Math.random() * 1000)}`;

    let newProductCode = "";

    await transaction(async (client) => {
      newProductCode = await generateProductCode(client);

      // Clone Product
      await client.query(`
        INSERT INTO "Product" (
          "id", "name", "slug", "sku", "productCode", "shortDescription", "description", "categoryId", "brandId", "status",
          "basePrice", "salePrice", "compareAtPrice", "costPrice", "gstRate", "priceIncTax", "unit", "packSize",
          "featured", "bestSeller", "newArrival", "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'DRAFT', $10, $11, $12, $13, $14, $15, $16, $17, false, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        newId, newName, newSlug, newSku, newProductCode, prod.shortDescription, prod.description, prod.categoryId, prod.brandId,
        prod.basePrice, prod.salePrice, prod.compareAtPrice, prod.costPrice, prod.gstRate, prod.priceIncTax, prod.unit, prod.packSize
      ]);

      // Clone Inventory
      await client.query(`
        INSERT INTO "Inventory" ("id", "productId", "quantity", "status", "reserved", "updatedAt")
        VALUES ($1, $2, 50, 'IN_STOCK', 0, CURRENT_TIMESTAMP)
      `, [generateId(), newId]);

      // Clone Images
      const images = await client.query(`SELECT * FROM "ProductImage" WHERE "productId" = $1`, [productId]);
      for (const img of images.rows) {
        await client.query(`
          INSERT INTO "ProductImage" ("id", "productId", "url", "alt", "isPrimary", "order", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        `, [generateId(), newId, img.url, img.alt, img.isPrimary, img.order]);
      }
    });

    safeRevalidate("/admin/products");
    return { success: true, id: newId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to duplicate product";
    return { success: false, error: message };
  }
}

/**
 * ARCHIVE PRODUCT
 */
export async function archiveProduct(productId: string) {
  try {
    await query(`
      UPDATE "Product" SET "status" = 'ARCHIVED', "archivedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1
    `, [productId]);
    safeRevalidate("/admin/products");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to archive product";
    return { success: false, error: message };
  }
}

/**
 * DELETE PRODUCT
 */
export async function deleteProduct(productId: string) {
  try {
    await transaction(async (client) => {
      await client.query(`DELETE FROM "Product" WHERE "id" = $1`, [productId]);
      await client.query(`
        INSERT INTO "ProductAuditLog" ("id", "productId", "action", "changedBy", "changedAt")
        VALUES ($1, $2, 'DELETED', 'admin', CURRENT_TIMESTAMP)
      `, [generateId(), productId]);
    });
    safeRevalidate("/admin/products");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return { success: false, error: message };
  }
}

/**
 * GET SINGLE PRODUCT FOR EDITING
 */
export async function getProductForEdit(productId: string) {
  try {
    const prodRes = await query(`SELECT * FROM "Product" WHERE "id" = $1 LIMIT 1`, [productId]);
    if (prodRes.rows.length === 0) return null;

    const product = prodRes.rows[0];

    const [imagesRes, docsRes, specsRes, invRes] = await Promise.all([
      query(`SELECT * FROM "ProductImage" WHERE "productId" = $1 ORDER BY "order" ASC`, [productId]),
      query(`SELECT * FROM "ProductDocument" WHERE "productId" = $1 ORDER BY "sortOrder" ASC`, [productId]),
      query(`
        SELECT s."name", s."value", g."name" as "groupName" 
        FROM "ProductSpecification" s 
        JOIN "SpecificationGroup" g ON s."groupId" = g."id" 
        WHERE g."productId" = $1 
        ORDER BY g."order", s."order"
      `, [productId]),
      query(`SELECT "quantity" FROM "Inventory" WHERE "productId" = $1 LIMIT 1`, [productId]),
    ]);

    return {
      ...product,
      stockQuantity: invRes.rows[0]?.quantity || 0,
      images: imagesRes.rows.map(r => ({ id: r.id, url: r.url, altText: r.alt || '', caption: '', isPrimary: r.isPrimary, sortOrder: r.order })),
      documents: docsRes.rows.map((r, idx) => ({ id: r.id, title: r.title, documentType: r.documentType || 'datasheet', fileUrl: r.fileUrl, version: r.version || 'v1.0', fileSize: r.fileSize || '', sortOrder: r.sortOrder || idx })),
      specifications: specsRes.rows.map((r, idx) => ({ groupName: r.groupName, name: r.name, value: r.value, unit: "", sortOrder: idx })),
    };
  } catch (error) {
    console.error("Failed to fetch product for edit:", error);
    return null;
  }
}
