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
        COUNT(DISTINCT pc."productId")::int as "itemCount"
      FROM "Category" c
      LEFT JOIN (
        SELECT pc."productId", pc."categoryId" 
        FROM "ProductCategory" pc 
        JOIN "Product" p ON pc."productId" = p.id 
        WHERE p.status = 'ACTIVE'
        UNION
        SELECT id as "productId", "categoryId" 
        FROM "Product" 
        WHERE status = 'ACTIVE' AND "categoryId" IS NOT NULL
      ) pc ON c.id = pc."categoryId" OR c.slug = pc."categoryId"
      WHERE COALESCE(c.status, 'active') != 'hidden'
      GROUP BY c.id, c.name, c.slug, c.status
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
          (
            SELECT json_agg(DISTINCT cat_ref)
            FROM (
              SELECT pc."categoryId" as cat_ref FROM "ProductCategory" pc WHERE pc."productId" = p."id"
              UNION
              SELECT cat."slug" as cat_ref FROM "ProductCategory" pc JOIN "Category" cat ON pc."categoryId" = cat."id" WHERE pc."productId" = p."id"
              UNION
              SELECT p."categoryId" as cat_ref WHERE p."categoryId" IS NOT NULL
              UNION
              SELECT cat."slug" as cat_ref FROM "Category" cat WHERE cat."id" = p."categoryId"
            ) sub
          ),
          '[]'::json
        ) as "categoryIds",
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
        AND EXISTS (
          SELECT 1 FROM "Category" c_vis 
          WHERE (
            c_vis."id" = p."categoryId" 
            OR c_vis."slug" = p."categoryId" 
            OR c_vis."id" IN (SELECT pc_sub."categoryId" FROM "ProductCategory" pc_sub WHERE pc_sub."productId" = p."id") 
            OR c_vis."slug" IN (SELECT pc_sub."categoryId" FROM "ProductCategory" pc_sub WHERE pc_sub."productId" = p."id")
          )
          AND COALESCE(c_vis."status", 'active') != 'hidden'
        )
    `;

    const params: any[] = [];
    if (categorySlug && categorySlug !== "all") {
      params.push(categorySlug);
      sql += ` AND (
        c."id" = $${params.length} OR 
        c."slug" = $${params.length} OR 
        p."id" IN (
          SELECT pc."productId" 
          FROM "ProductCategory" pc 
          LEFT JOIN "Category" cat ON (pc."categoryId" = cat."id" OR pc."categoryId" = cat."slug")
          WHERE cat."id" = $${params.length} OR cat."slug" = $${params.length} OR pc."categoryId" = $${params.length}
        )
      )`;
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
      categoryId: row.categoryId || (Array.isArray(row.categoryIds) ? row.categoryIds[0] : "General"),
      categoryIds: Array.isArray(row.categoryIds) ? row.categoryIds.filter(Boolean) : (row.categoryId ? [row.categoryId] : []),
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

export interface DynamicCategoryDetails {
  id: string;
  name: string;
  slug: string;
  description: string;
  badge: string;
  subcategories: string[];
  seoTitle?: string;
  seoDesc?: string;
}

/**
 * Fetch Category details dynamically from Database with static fallback
 */
export async function getStorefrontCategoryBySlug(slug: string): Promise<DynamicCategoryDetails | null> {
  try {
    const res = await query(`
      SELECT id, name, slug, description, "seoTitle", "seoDesc"
      FROM "Category"
      WHERE (slug = $1 OR id = $1) AND COALESCE(status, 'active') != 'hidden'
      LIMIT 1
    `, [slug]);

    if (res.rows.length > 0) {
      const row = res.rows[0];
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description || `Explore our high-performance line of ${row.name} industrial hardware components.`,
        badge: "Verified Hardware Series",
        subcategories: ["Industrial Grade", "Factory Stock", "OEM Components"],
        seoTitle: row.seoTitle || `Buy ${row.name} Online - Industrial Automation | OM AUTOMATION`,
        seoDesc: row.seoDesc || `Shop genuine ${row.name} automation components with manufacturer warranty, fast dispatch, and technical support.`,
      };
    }
  } catch (error) {
    console.warn("Failed to fetch category from DB:", error);
  }

  // Fallback to static CATEGORIES
  const { CATEGORIES } = await import("@/data/categories");
  const staticCat = CATEGORIES.find((c) => c.slug === slug || c.id === slug);
  if (staticCat) {
    return {
      id: staticCat.id,
      name: staticCat.name,
      slug: staticCat.slug,
      description: staticCat.description,
      badge: staticCat.badge || "Verified Hardware Series",
      subcategories: staticCat.subcategories || [],
      seoTitle: `Buy ${staticCat.name} Online | OM AUTOMATION`,
      seoDesc: staticCat.description,
    };
  }

  return null;
}
