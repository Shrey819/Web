import { query } from "@/lib/db";
import { Product } from "@/types";

export interface StorefrontCategory {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
}

/**
 * Fetch categories with product counts for storefront sidebar
 */
export async function getStorefrontCategories(): Promise<StorefrontCategory[]> {
  try {
    const res = await query(`
      SELECT 
        c.id,
        c.name,
        c.slug,
        COUNT(p.id)::int as "itemCount"
      FROM "Category" c
      LEFT JOIN "Product" p ON (c.id = p."categoryId" OR c.slug = p."categoryId") AND p.status = 'ACTIVE'
      GROUP BY c.id, c.name, c.slug
      ORDER BY c.name ASC
    `);

    return res.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug || row.id,
      itemCount: Number(row.itemCount || 0)
    }));
  } catch (error) {
    console.error("Failed to fetch storefront categories:", error);
    return [];
  }
}

/**
 * Fetch all ACTIVE products for normal storefront users from PostgreSQL
 */
export async function getActiveProducts(categorySlug?: string, search?: string): Promise<Product[]> {
  try {
    let sql = `
      SELECT 
        p."id",
        p."name",
        p."slug",
        p."sku",
        COALESCE(b."name", 'Industrial Brand') as "brand",
        COALESCE(p."description", '') as "description",
        COALESCE(p."shortDescription", '') as "shortDescription",
        p."categoryId",
        COALESCE(c."name", 'General Catalog') as "categoryName",
        p."basePrice",
        p."compareAtPrice",
        COALESCE(i."status", 'IN_STOCK') as "stockStatus",
        COALESCE(p."unit"::text, 'PIECE') as "unitLabel",
        COALESCE(p."featured", false) as "featured",
        COALESCE(p."bestSeller", false) as "bestSeller",
        COALESCE(p."newArrival", false) as "newArrival",
        p."createdAt",
        COALESCE(
          json_agg(
            json_build_object('url', img."url", 'alt', COALESCE(img."alt", p."name"))
            ORDER BY img."isPrimary" DESC, img."order" ASC
          ) FILTER (WHERE img."id" IS NOT NULL),
          '[]'::json
        ) as "images"
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c."id"
      LEFT JOIN "Brand" b ON p."brandId" = b."id"
      LEFT JOIN "Inventory" i ON p."id" = i."productId"
      LEFT JOIN "ProductImage" img ON p."id" = img."productId"
      WHERE p."status" = 'ACTIVE'
    `;

    const params: any[] = [];
    if (categorySlug && categorySlug !== "all") {
      params.push(categorySlug);
      sql += ` AND (c."id" = $${params.length} OR c."slug" = $${params.length})`;
    }

    if (search && search.trim() !== "") {
      params.push(`%${search.trim()}%`);
      sql += ` AND (p."name" ILIKE $${params.length} OR p."sku" ILIKE $${params.length} OR p."description" ILIKE $${params.length})`;
    }

    sql += ` GROUP BY p."id", c."id", b."id", i."id" ORDER BY p."createdAt" DESC`;

    const res = await query(sql, params);

    return res.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      sku: row.sku,
      brand: row.brand,
      description: row.description,
      shortDescription: row.shortDescription,
      categoryId: row.categoryId,
      subcategoryId: row.categoryId,
      images: Array.isArray(row.images) && row.images.length > 0
        ? row.images
        : [{ url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80", alt: row.name }],
      basePrice: Number(row.basePrice || 0),
      compareAtPrice: row.compareAtPrice ? Number(row.compareAtPrice) : undefined,
      gstRate: 18.0,
      priceIncludesTax: false,
      stockStatus: row.stockStatus === 'IN_STOCK' ? 'in-stock' : 'out-of-stock',
      minimumOrderQuantity: 1,
      unit: "piece",
      packSize: 1,
      unitLabel: row.unitLabel || "Each",
      hasVariants: false,
      variants: [],
      specifications: [
        { groupName: "General", attributes: [{ label: "Status", value: "Verified Active" }] }
      ],
      features: [
        "100% Genuine Industrial Hardware",
        "Official Manufacturer Warranty"
      ],
      applications: ["Industrial Automation", "Factory Control"],
      rating: 4.8,
      reviewCount: 24,
      badges: ["In Stock", "Verified"],
      featured: Boolean(row.featured),
      bestSeller: Boolean(row.bestSeller),
      newArrival: Boolean(row.newArrival),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString()
    }));
  } catch (error) {
    console.error("Failed to fetch active storefront products:", error);
    return [];
  }
}

/**
 * Fetch a single ACTIVE product by slug for PDP page
 */
export async function getActiveProductBySlug(slug: string): Promise<Product | null> {
  try {
    const sql = `
      SELECT 
        p."id",
        p."name",
        p."slug",
        p."sku",
        COALESCE(b."name", 'Industrial Brand') as "brand",
        COALESCE(p."description", '') as "description",
        COALESCE(p."shortDescription", '') as "shortDescription",
        p."categoryId",
        COALESCE(c."name", 'General Catalog') as "categoryName",
        p."basePrice",
        p."compareAtPrice",
        COALESCE(i."status", 'IN_STOCK') as "stockStatus",
        COALESCE(p."unit"::text, 'PIECE') as "unitLabel",
        COALESCE(p."featured", false) as "featured",
        COALESCE(p."bestSeller", false) as "bestSeller",
        COALESCE(p."newArrival", false) as "newArrival",
        p."createdAt",
        COALESCE(
          json_agg(
            json_build_object('url', img."url", 'alt', COALESCE(img."alt", p."name"))
            ORDER BY img."isPrimary" DESC, img."order" ASC
          ) FILTER (WHERE img."id" IS NOT NULL),
          '[]'::json
        ) as "images"
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c."id"
      LEFT JOIN "Brand" b ON p."brandId" = b."id"
      LEFT JOIN "Inventory" i ON p."id" = i."productId"
      LEFT JOIN "ProductImage" img ON p."id" = img."productId"
      WHERE (p."slug" = $1 OR p."id" = $1) AND p."status" = 'ACTIVE'
      GROUP BY p."id", c."id", b."id", i."id"
      LIMIT 1
    `;

    const res = await query(sql, [slug]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      sku: row.sku,
      brand: row.brand,
      description: row.description,
      shortDescription: row.shortDescription,
      categoryId: row.categoryId,
      subcategoryId: row.categoryId,
      images: Array.isArray(row.images) && row.images.length > 0
        ? row.images
        : [{ url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80", alt: row.name }],
      basePrice: Number(row.basePrice || 0),
      compareAtPrice: row.compareAtPrice ? Number(row.compareAtPrice) : undefined,
      gstRate: 18.0,
      priceIncludesTax: false,
      stockStatus: row.stockStatus === 'IN_STOCK' ? 'in-stock' : 'out-of-stock',
      minimumOrderQuantity: 1,
      unit: "piece",
      packSize: 1,
      unitLabel: row.unitLabel || "Each",
      hasVariants: false,
      variants: [],
      specifications: [
        { groupName: "General", attributes: [{ label: "Status", value: "Verified Active" }] }
      ],
      features: [
        "100% Genuine Industrial Hardware",
        "Official Manufacturer Warranty"
      ],
      applications: ["Industrial Automation", "Factory Control"],
      rating: 4.9,
      reviewCount: 42,
      badges: ["In Stock", "Verified"],
      featured: Boolean(row.featured),
      bestSeller: Boolean(row.bestSeller),
      newArrival: Boolean(row.newArrival),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString()
    };
  } catch (error) {
    console.error("Failed to fetch product by slug:", error);
    return null;
  }
}
