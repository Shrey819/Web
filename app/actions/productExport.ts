"use server";

import { query } from "@/lib/db";
import * as XLSX from "xlsx";

interface ExportOptions {
  scope: "all" | "filtered" | "selected";
  format?: "xlsx" | "csv";
  selectedIds?: string[];
  filteredIds?: string[];
  search?: string;
  category?: string;
  status?: string;
  baseUrl?: string;
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r") || str.includes(";")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportProductsToCSV(options: ExportOptions): Promise<{
  success: boolean;
  format?: "xlsx" | "csv";
  csvContent?: string;
  xlsxBase64?: string;
  filename?: string;
  totalProducts?: number;
  error?: string;
}> {
  try {
    const { scope, selectedIds = [], filteredIds = [], search = "", category = "", status = "", baseUrl = "" } = options;

    let whereClause = `WHERE 1=1`;
    const params: any[] = [];

    if (scope === "selected" && selectedIds.length > 0) {
      params.push(selectedIds);
      whereClause += ` AND p."id" = ANY($${params.length})`;
    } else if (scope === "filtered") {
      if (filteredIds.length > 0) {
        params.push(filteredIds);
        whereClause += ` AND p."id" = ANY($${params.length})`;
      } else {
        return { success: false, error: "No matching filtered products to export." };
      }
    } else if (scope === "all") {
      // Export all products
    }

    // 1. Fetch Target Products
    const productsRes = await query(
      `SELECT p.* FROM "Product" p ${whereClause} ORDER BY p."createdAt" DESC`,
      params
    );

    const products = productsRes.rows;
    if (products.length === 0) {
      return { success: false, error: "No products found to export." };
    }

    const productIds = products.map((p) => p.id);

    // 2. Fetch all relational data in parallel
    const [
      variantsRes,
      imagesRes,
      optionsRes,
      choicesRes,
      categoriesRes,
      tagsRes,
      sectionsRes,
      allCategoriesRes,
      allTagsRes,
      allSectionsRes,
    ] = await Promise.all([
      query(`SELECT * FROM "ProductVariant" WHERE "productId" = ANY($1) ORDER BY "id" ASC`, [productIds]),
      query(`SELECT * FROM "ProductImage" WHERE "productId" = ANY($1) ORDER BY "order" ASC`, [productIds]),
      query(`SELECT * FROM "ProductOption" WHERE "productId" = ANY($1) ORDER BY "sortOrder" ASC`, [productIds]),
      query(`
        SELECT c.*, o."productId" 
        FROM "ProductOptionChoice" c
        JOIN "ProductOption" o ON c."optionId" = o."id"
        WHERE o."productId" = ANY($1)
        ORDER BY c."sortOrder" ASC
      `, [productIds]),
      query(`SELECT "productId", "categoryId" FROM "ProductCategory" WHERE "productId" = ANY($1)`, [productIds]),
      query(`SELECT "productId", "tagId" FROM "ProductTagAssignment" WHERE "productId" = ANY($1)`, [productIds]),
      query(`SELECT "productId", "sectionId" FROM "ProductAssignedInfoSection" WHERE "productId" = ANY($1) ORDER BY "sortOrder" ASC`, [productIds]),
      query(`SELECT "id", "name" FROM "Category"`),
      query(`SELECT "id", "name" FROM "ProductTag"`),
      query(`SELECT "id", "title", "internalName", "content" FROM "GlobalInfoSection"`),
    ]);

    // Build Lookups
    const categoryNameMap = new Map<string, string>(allCategoriesRes.rows.map((c) => [c.id, c.name]));
    const tagNameMap = new Map<string, string>(allTagsRes.rows.map((t) => [t.id, t.name]));
    const sectionMap = new Map<string, { title: string; internalName: string; content: string }>(
      allSectionsRes.rows.map((s) => [s.id, { title: s.title, internalName: s.internalName, content: s.content }])
    );

    // Group relational items by productId
    const variantsByProd = new Map<string, any[]>();
    variantsRes.rows.forEach((v) => {
      const list = variantsByProd.get(v.productId) || [];
      list.push(v);
      variantsByProd.set(v.productId, list);
    });

    const imagesByProd = new Map<string, any[]>();
    imagesRes.rows.forEach((img) => {
      const list = imagesByProd.get(img.productId) || [];
      list.push(img);
      imagesByProd.set(img.productId, list);
    });

    const choicesByOption = new Map<string, any[]>();
    choicesRes.rows.forEach((c) => {
      const list = choicesByOption.get(c.optionId) || [];
      list.push(c);
      choicesByOption.set(c.optionId, list);
    });

    const optionsByProd = new Map<string, any[]>();
    optionsRes.rows.forEach((o) => {
      const list = optionsByProd.get(o.productId) || [];
      list.push({
        ...o,
        choices: choicesByOption.get(o.id) || [],
      });
      optionsByProd.set(o.productId, list);
    });

    const categoriesByProd = new Map<string, string[]>();
    categoriesRes.rows.forEach((r) => {
      const list = categoriesByProd.get(r.productId) || [];
      const catName = categoryNameMap.get(r.categoryId);
      if (catName && !list.includes(catName)) list.push(catName);
      categoriesByProd.set(r.productId, list);
    });

    const tagsByProd = new Map<string, string[]>();
    tagsRes.rows.forEach((r) => {
      const list = tagsByProd.get(r.productId) || [];
      const tName = tagNameMap.get(r.tagId);
      if (tName && !list.includes(tName)) list.push(tName);
      tagsByProd.set(r.productId, list);
    });

    const sectionsByProd = new Map<string, any[]>();
    sectionsRes.rows.forEach((r) => {
      const list = sectionsByProd.get(r.productId) || [];
      const sec = sectionMap.get(r.sectionId);
      if (sec) list.push(sec);
      sectionsByProd.set(r.productId, list);
    });

    // 3. Determine max sections to dynamically build Section columns (minimum 5)
    let maxSectionsCount = 5;
    products.forEach((p) => {
      const secList = sectionsByProd.get(p.id) || [];
      if (secList.length > maxSectionsCount) maxSectionsCount = secList.length;
    });

    // 4. Construct CSV Headers in exact requested order
    const headers = [
      "Handle / Slug",
      "Item Type",
      "ID",
      "Images url",
      "Name",
      "Description",
      "Categories",
      "Primary Category",
      "Price",
      "Strikethrough Price (₹)",
      "Visibility of Product",
      "Option 1 Name",
      "Option 1 Value",
      "Option 2 Name",
      "Option 2 Value",
      "Option 3 Name",
      "Option 3 Value",
      "Option 4 Name",
      "Option 4 Value",
      "Option 5 Name",
      "Option 5 Value",
      "Option 6 Name",
      "Option 6 Value",
      "Brand",
      "Ribbon",
      "Tags",
      "Price per unit Visible",
      "Price per unit price",
      "Price per unit unit",
      "Additional info sections Visible",
    ];

    for (let i = 1; i <= maxSectionsCount; i++) {
      headers.push(`section ${i} Title`);
      headers.push(`section ${i} Name`);
    }

    headers.push("Product URL");
    headers.push("SKU");

    const rawRows: string[][] = [headers];
    const rows: string[] = [];
    rows.push(headers.map(escapeCsvCell).join(","));

    // 5. Build 2-Tier Rows (Parent Product Row + Child Variant Rows)
    for (const p of products) {
      const prodVariants = variantsByProd.get(p.id) || [];
      const prodImages = imagesByProd.get(p.id) || [];
      const prodOptions = optionsByProd.get(p.id) || [];
      const prodCategories = categoriesByProd.get(p.id) || [];
      const prodTags = tagsByProd.get(p.id) || [];
      const prodSections = sectionsByProd.get(p.id) || [];

      const primaryCatName =
        categoryNameMap.get(p.primaryCategoryId || p.categoryId) ||
        prodCategories[0] ||
        "";

      const imageUrlsStr = prodImages.map((img) => img.url).join(";");
      const cleanBasePrice = ((p.price || 0) / 100).toFixed(2);
      const cleanStrikethrough = p.strikethroughPrice ? ((p.strikethroughPrice) / 100).toFixed(2) : "";

      const pricePerUnitPriceStr = p.baseUnit
        ? `${cleanBasePrice};${p.baseUnit}`
        : "";

      const liveProductUrl = baseUrl ? `${baseUrl}/products/${p.slug}` : `/products/${p.slug}`;

      // --- ROW 1: PARENT PRODUCT ROW ---
      const parentRow: any[] = [
        p.slug || "",
        "Product",
        p.id,
        imageUrlsStr,
        p.name || "",
        p.description || "",
        prodCategories.join(";"),
        primaryCatName,
        cleanBasePrice,
        cleanStrikethrough,
        p.visible ?? true,
      ];

      // Options 1 to 6 on Parent Row
      for (let i = 0; i < 6; i++) {
        const opt = prodOptions[i];
        if (opt) {
          parentRow.push(opt.name);
          const allChoicesStr = (opt.choices || []).map((c: any) => c.name).join(";");
          parentRow.push(allChoicesStr);
        } else {
          parentRow.push("");
          parentRow.push("");
        }
      }

      parentRow.push(p.brand || "");
      parentRow.push(p.primaryRibbon || "");
      parentRow.push(prodTags.join(", "));
      parentRow.push(Boolean(p.showPricePerUnit));
      parentRow.push(pricePerUnitPriceStr);
      parentRow.push(p.baseUnitMeasurement || "");
      parentRow.push(prodSections.length > 0);

      // Dynamic Section Columns on Parent Row
      for (let i = 0; i < maxSectionsCount; i++) {
        const sec = prodSections[i];
        if (sec) {
          parentRow.push(sec.title || "");
          parentRow.push(sec.internalName || sec.content || "");
        } else {
          parentRow.push("");
          parentRow.push("");
        }
      }

      parentRow.push(liveProductUrl);
      parentRow.push(p.sku || "");

      rawRows.push(parentRow);
      rows.push(parentRow.map(escapeCsvCell).join(","));

      // --- CHILD ROWS: VARIANT ROWS (If product has variants) ---
      for (const v of prodVariants) {
        const vAttrs = typeof v.attributes === "string" ? JSON.parse(v.attributes) : (v.attributes || {});
        const vPrice = v.price != null ? (v.price / 100).toFixed(2) : cleanBasePrice;
        const vStrikethrough = v.strikethroughPrice ? (v.strikethroughPrice / 100).toFixed(2) : "";

        const variantRow: any[] = [
          p.slug || "",
          "Variant",
          v.id,
          v.imageUrl || "", // Images url (Variant specific image)
          "", // Name blank on variant row
          "", // Description blank
          "", // Categories blank
          "", // Primary Category blank
          vPrice,
          vStrikethrough,
          v.visible ?? true,
        ];

        // Options 1 to 6 on Variant Row
        for (let i = 0; i < 6; i++) {
          const opt = prodOptions[i];
          if (opt) {
            variantRow.push(opt.name);
            const specificChoice = vAttrs[opt.name] || "";
            variantRow.push(specificChoice);
          } else {
            variantRow.push("");
            variantRow.push("");
          }
        }

        variantRow.push(""); // Brand blank
        variantRow.push(""); // Ribbon blank
        variantRow.push(""); // Tags blank
        variantRow.push(""); // Price per unit visible blank
        variantRow.push(""); // Price per unit price blank
        variantRow.push(""); // Price per unit unit blank
        variantRow.push(""); // Additional info sections visible blank

        // Dynamic Section Columns on Variant Row (blank)
        for (let i = 0; i < maxSectionsCount; i++) {
          variantRow.push("");
          variantRow.push("");
        }

        variantRow.push(""); // Product URL blank
        variantRow.push(v.sku || ""); // SKU

        rawRows.push(variantRow);
        rows.push(variantRow.map(escapeCsvCell).join(","));
      }
    }

    const dateStr = new Date().toISOString().split("T")[0];
    const exportFormat = options.format || "xlsx";
    const filename = `products_export_${dateStr}.${exportFormat === "xlsx" ? "xlsx" : "csv"}`;

    if (exportFormat === "xlsx") {
      const ws = XLSX.utils.aoa_to_sheet(rawRows);

      // Set exact MAX width of 16 characters for all columns
      const colWidths = headers.map(() => ({ wch: 16, width: 16 }));
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Products");
      const xlsxBase64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });

      return {
        success: true,
        format: "xlsx",
        xlsxBase64,
        filename,
        totalProducts: products.length,
      };
    } else {
      const csvContent = rows.join("\r\n");
      return {
        success: true,
        format: "csv",
        csvContent,
        filename,
        totalProducts: products.length,
      };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to export products";
    console.error("Export products error:", error);
    return { success: false, error: message };
  }
}
