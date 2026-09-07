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

function parseJsonArray(val: unknown): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// 46 Standard Columns directly aligned with the 11 sections of "Add New Product"
const EXCEL_PRODUCT_HEADERS = [
  // 1) Product Name
  "Product Name",
  // 2) Feature Description & Pricing
  "Feature Description",
  "Selling Price (₹)",
  "Original Price (₹)",
  // 3) Images and Videos
  "Images URL",
  "Product Video URL",
  // 4) Custom Feature Cards (up to 6)
  "Feature 1 Label",
  "Feature 1 Value",
  "Feature 2 Label",
  "Feature 2 Value",
  "Feature 3 Label",
  "Feature 3 Value",
  "Feature 4 Label",
  "Feature 4 Value",
  "Feature 5 Label",
  "Feature 5 Value",
  "Feature 6 Label",
  "Feature 6 Value",
  // 5) Applications (Tags)
  "Applications",
  // 6) Brand Technical Support Links (up to 6)
  "Support Link 1 Title",
  "Support Link 1 URL",
  "Support Link 1 Icon",
  "Support Link 2 Title",
  "Support Link 2 URL",
  "Support Link 2 Icon",
  "Support Link 3 Title",
  "Support Link 3 URL",
  "Support Link 3 Icon",
  "Support Link 4 Title",
  "Support Link 4 URL",
  "Support Link 4 Icon",
  "Support Link 5 Title",
  "Support Link 5 URL",
  "Support Link 5 Icon",
  "Support Link 6 Title",
  "Support Link 6 URL",
  "Support Link 6 Icon",
  // 7) Custom Field for Buyer Note
  "Enable Buyer Note",
  // 8) Visibility
  "Visibility",
  // 9) Brand
  "Brand",
  // 10) Category
  "Category",
  // 11) Product URL & SEO
  "Product URL Slug",
  "SEO Meta Title",
  "SEO Meta Description",
  // Identifiers
  "SKU",
  "Product ID",
];

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
    const { scope, selectedIds = [], filteredIds = [] } = options;

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

    // 1. Fetch Products
    const productsRes = await query(
      `SELECT p.* FROM "Product" p ${whereClause} ORDER BY p."createdAt" DESC`,
      params
    );

    const products = productsRes.rows;
    if (products.length === 0) {
      return { success: false, error: "No products found to export." };
    }

    const productIds = products.map((p) => p.id);

    // 2. Fetch Images & Categories in parallel
    const [imagesRes, allCategoriesRes] = await Promise.all([
      query(`SELECT * FROM "ProductImage" WHERE "productId" = ANY($1) ORDER BY "order" ASC`, [productIds]),
      query(`SELECT "id", "name" FROM "Category"`),
    ]);

    // Build Lookups
    const categoryNameMap = new Map<string, string>(allCategoriesRes.rows.map((c) => [c.id, c.name]));

    const imagesByProd = new Map<string, any[]>();
    imagesRes.rows.forEach((img) => {
      const list = imagesByProd.get(img.productId) || [];
      list.push(img);
      imagesByProd.set(img.productId, list);
    });

    const headers = EXCEL_PRODUCT_HEADERS;
    const rawRows: any[][] = [headers];
    const rows: string[] = [headers.map(escapeCsvCell).join(",")];

    // 3. Construct 1 Clean Row Per Product (NO child variant rows)
    for (const p of products) {
      const prodImages = imagesByProd.get(p.id) || [];
      const imageUrlsStr = prodImages.map((img) => img.url).join(";");

      const sellingPrice =
        p.price != null
          ? (p.price / 100).toFixed(2)
          : p.basePrice != null
          ? (p.basePrice / 100).toFixed(2)
          : "0.00";

      const strikethroughPrice =
        p.strikethroughPrice != null
          ? (p.strikethroughPrice / 100).toFixed(2)
          : p.compareAtPrice != null
          ? (p.compareAtPrice / 100).toFixed(2)
          : "";

      const featureCards = parseJsonArray(p.featureHighlights);
      const appTags = parseJsonArray(p.applications);
      const supportLinks = parseJsonArray(p.technicalSupportLinks);

      const catName =
        categoryNameMap.get(p.primaryCategoryId || p.categoryId) || "";

      const rowData: any[] = [
        // 1) Product Name
        p.name || "",
        // 2) Feature Description & Pricing
        p.description || "",
        sellingPrice,
        strikethroughPrice,
        // 3) Images and Videos
        imageUrlsStr,
        p.videoUrl || "",
        // 4) Custom Feature Cards (up to 6 cards: Label & Value)
        featureCards[0]?.label || "",
        featureCards[0]?.value || "",
        featureCards[1]?.label || "",
        featureCards[1]?.value || "",
        featureCards[2]?.label || "",
        featureCards[2]?.value || "",
        featureCards[3]?.label || "",
        featureCards[3]?.value || "",
        featureCards[4]?.label || "",
        featureCards[4]?.value || "",
        featureCards[5]?.label || "",
        featureCards[5]?.value || "",
        // 5) Applications (Tags)
        appTags.join("; "),
        // 6) Brand Technical Support Links (up to 6 links: Title, URL, Icon)
        supportLinks[0]?.title || "",
        supportLinks[0]?.url || "",
        supportLinks[0]?.icon || "",
        supportLinks[1]?.title || "",
        supportLinks[1]?.url || "",
        supportLinks[1]?.icon || "",
        supportLinks[2]?.title || "",
        supportLinks[2]?.url || "",
        supportLinks[2]?.icon || "",
        supportLinks[3]?.title || "",
        supportLinks[3]?.url || "",
        supportLinks[3]?.icon || "",
        supportLinks[4]?.title || "",
        supportLinks[4]?.url || "",
        supportLinks[4]?.icon || "",
        supportLinks[5]?.title || "",
        supportLinks[5]?.url || "",
        supportLinks[5]?.icon || "",
        // 7) Custom Field for Buyer Note
        p.enableBuyerNote !== false ? "TRUE" : "FALSE",
        // 8) Visibility
        p.visible !== false ? "TRUE" : "FALSE",
        // 9) Brand
        p.brand || "",
        // 10) Category
        catName,
        // 11) Product URL & SEO
        p.slug || "",
        p.seoTitle || "",
        p.seoDesc || "",
        // Identifiers
        p.sku || "",
        p.id,
      ];

      rawRows.push(rowData);
      rows.push(rowData.map(escapeCsvCell).join(","));
    }

    const dateStr = new Date().toISOString().split("T")[0];
    const exportFormat = options.format || "xlsx";
    const filename = `products_export_${dateStr}.${exportFormat === "xlsx" ? "xlsx" : "csv"}`;

    if (exportFormat === "xlsx") {
      const ws = XLSX.utils.aoa_to_sheet(rawRows);

      // Intelligent column widths based on data type
      const colWidths = headers.map((header) => {
        if (header === "Product Name" || header === "Feature Description") return { wch: 36 };
        if (header.includes("URL")) return { wch: 32 };
        if (header === "Applications") return { wch: 36 };
        if (header.includes("SEO")) return { wch: 30 };
        if (header.includes("Price")) return { wch: 18 };
        if (header.includes("Title")) return { wch: 20 };
        if (header.includes("Label") || header.includes("Value")) return { wch: 22 };
        if (header === "Brand" || header === "Category") return { wch: 20 };
        return { wch: 18 };
      });
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
