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
        WHERE p.status = 'ACTIVE' AND COALESCE(p.visible, true) = true
        UNION
        SELECT id as "productId", "categoryId" 
        FROM "Product" 
        WHERE (status = 'ACTIVE' OR COALESCE(visible, true) = true) AND "categoryId" IS NOT NULL
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
        COALESCE(p."brand", 'General Brand') as "brand",
        COALESCE(p."description", '') as "description",
        p."categoryId",
        p."primaryRibbon",
        p."price",
        p."basePrice",
        p."strikethroughPrice",
        p."compareAtPrice",
        p."showPricePerUnit",
        p."baseUnit",
        p."baseUnitMeasurement",
        p."totalUnits",
        p."totalUnitsMeasurement",
        p."createdAt",
        COALESCE(
          json_agg(
            json_build_object('url', img."url", 'alt', COALESCE(img."alt", p."name"))
            ORDER BY img."isPrimary" DESC, img."order" ASC
          ) FILTER (WHERE img."id" IS NOT NULL),
          '[]'::json
        ) as "images"
      FROM "Product" p
      LEFT JOIN "ProductImage" img ON p."id" = img."productId"
      WHERE (p."status" = 'ACTIVE' OR COALESCE(p."visible", true) = true)
    `;

    const params: any[] = [];
    if (categorySlug && categorySlug !== "all") {
      params.push(categorySlug);
      sql += ` AND (
        p."categoryId" = $${params.length} OR 
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

    sql += ` GROUP BY p."id" ORDER BY p."createdAt" DESC`;

    const res = await query(sql, params);

    return res.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      sku: row.sku,
      brand: row.brand,
      description: row.description,
      shortDescription: row.description?.slice(0, 120) || "",
      categoryId: row.categoryId || "General",
      subcategoryId: row.categoryId || "General",
      categoryIds: [row.categoryId || "General"],
      images: Array.isArray(row.images) && row.images.length > 0
        ? row.images
        : [{ url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80", alt: row.name }],
      basePrice: Number(row.price || row.basePrice || 0) / 100,
      compareAtPrice: (row.strikethroughPrice || row.compareAtPrice) ? Number(row.strikethroughPrice || row.compareAtPrice) / 100 : undefined,
      gstRate: 18.0,
      priceIncludesTax: false,
      stockStatus: 'in-stock' as const,
      minimumOrderQuantity: 1,
      unit: "piece" as const,
      unitLabel: "Each",
      packSize: 1,
      hasVariants: false,
      variants: [],
      specifications: [],
      features: [],
      applications: [],
      rating: 4.9,
      reviewCount: 18,
      badges: row.primaryRibbon ? [row.primaryRibbon] : ["In Stock"],
      ribbon: row.primaryRibbon,
      featured: false,
      bestSeller: false,
      newArrival: true,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString()
    }));
  } catch (error) {
    console.error("Failed to fetch active storefront products:", error);
    return [];
  }
}

/**
 * Fetch a single ACTIVE product by slug with all Wix Options, Variants, and Info Sections
 */
export async function getActiveProductBySlug(slug: string): Promise<any | null> {
  try {
    const prodRes = await query(`
      SELECT * FROM "Product" 
      WHERE (slug = $1 OR id = $1)
      LIMIT 1
    `, [slug]);

    if (prodRes.rows.length === 0) return null;
    const p = prodRes.rows[0];

    const [imagesRes, optionsRes, choicesRes, variantsRes, sectionsRes] = await Promise.all([
      query(`SELECT * FROM "ProductImage" WHERE "productId" = $1 ORDER BY "isPrimary" DESC, "order" ASC`, [p.id]),
      query(`SELECT * FROM "ProductOption" WHERE "productId" = $1 ORDER BY "sortOrder" ASC`, [p.id]),
      query(`
        SELECT c.* 
        FROM "ProductOptionChoice" c
        JOIN "ProductOption" o ON c."optionId" = o."id"
        WHERE o."productId" = $1
        ORDER BY c."sortOrder" ASC
      `, [p.id]),
      query(`SELECT * FROM "ProductVariant" WHERE "productId" = $1 ORDER BY "id" ASC`, [p.id]),
      query(`
        SELECT s.*, pasi."sortOrder"
        FROM "GlobalInfoSection" s
        JOIN "ProductAssignedInfoSection" pasi ON s."id" = pasi."sectionId"
        WHERE pasi."productId" = $1
        ORDER BY pasi."sortOrder" ASC
      `, [p.id])
    ]);

    const choicesByOpt = new Map<string, any[]>();
    choicesRes.rows.forEach(c => {
      const list = choicesByOpt.get(c.optionId) || [];
      list.push({ id: c.id, name: c.name, colorHex: c.colorHex || "" });
      choicesByOpt.set(c.optionId, list);
    });

    const options = optionsRes.rows.map(o => ({
      id: o.id,
      name: o.name,
      fieldType: o.fieldType || "TEXT_CHOICES",
      choices: choicesByOpt.get(o.id) || []
    }));

    const variants = variantsRes.rows.map(v => ({
      id: v.id,
      sku: v.sku,
      barcode: v.barcode,
      price: (v.price || 0) / 100,
      strikethroughPrice: v.strikethroughPrice ? v.strikethroughPrice / 100 : null,
      inventoryStatus: v.inventoryStatus || 'IN_STOCK',
      stockQuantity: v.stockQuantity || 100,
      preOrderEnabled: Boolean(v.preOrderEnabled),
      totalUnits: v.totalUnits,
      totalUnitsMeasurement: v.totalUnitsMeasurement || 'g',
      mediaUrl: v.mediaUrl,
      attributes: typeof v.attributes === "string" ? JSON.parse(v.attributes) : (v.attributes || {})
    }));

    const infoSections = sectionsRes.rows.map(s => ({
      id: s.id,
      title: s.title,
      internalName: s.internalName,
      content: s.content
    }));

    const rawPrice = (p.price || p.basePrice || 0) / 100;
    const rawStrikethrough = (p.strikethroughPrice || p.compareAtPrice) ? (p.strikethroughPrice || p.compareAtPrice) / 100 : null;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      brand: p.brand || "Industrial Standard",
      description: p.description || "",
      categoryId: p.categoryId,
      primaryRibbon: p.primaryRibbon,
      basePrice: rawPrice,
      price: rawPrice,
      compareAtPrice: rawStrikethrough,
      strikethroughPrice: rawStrikethrough,
      showPricePerUnit: Boolean(p.showPricePerUnit),
      baseUnit: Number(p.baseUnit ?? 100),
      baseUnitMeasurement: p.baseUnitMeasurement || "g",
      totalUnits: p.totalUnits ? Number(p.totalUnits) : null,
      totalUnitsMeasurement: p.totalUnitsMeasurement || "g",
      images: imagesRes.rows.map((img: any) => ({
        url: img.url,
        alt: img.alt || p.name,
        isPrimary: img.isPrimary
      })),
      options,
      hasVariants: variants.length > 0,
      variants,
      infoSections,
      rating: 4.9,
      reviewCount: 42
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
        badge: "Verified Series",
        subcategories: ["Industrial Grade", "Factory Stock", "OEM Components"],
        seoTitle: row.seoTitle || `Buy ${row.name} Online`,
        seoDesc: row.seoDesc || `Shop genuine ${row.name} components.`,
      };
    }
  } catch (error) {
    console.warn("Failed to fetch category from DB:", error);
  }

  return null;
}
