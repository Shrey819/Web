"use server";

import { transaction, query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import * as XLSX from "xlsx";
import {
  cleanVal,
  generateSlug,
  autoAlignSpreadsheetOptions,
  calculateProductDetailSimilarity,
} from "@/lib/importHelpers";

const generateId = (prefix = "prd_") => prefix + crypto.randomBytes(8).toString("hex");

/**
 * 1. DOWNLOAD IMPORT SAMPLE TEMPLATE (EXCEL / CSV)
 * 46 columns matching the 11 sections of "Add New Product" with no variant rows.
 */
export async function downloadImportSampleTemplate(format: "csv" | "xlsx" = "csv"): Promise<{
  success: boolean;
  xlsxBase64?: string;
  csvContent?: string;
  filename: string;
  error?: string;
}> {
  try {
    const headers = [
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

    const sampleRows: string[][] = [
      headers,
      // Sample 1: HIWIN EL Self Lubricating Ballscrew
      [
        "HIWIN EL Self Lubricating Ballscrew",
        "<p>High-performance ballscrew with integrated lubrication system providing maintenance-free operation up to 10,000 km.</p>",
        "2500.00",
        "3000.00",
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800;https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "COST SAVING",
        "lubrication free",
        "EASY INSTALLATION",
        "Replaceable",
        "EXTENDED MAINTENANCE",
        "Up to 10000 KM",
        "",
        "",
        "",
        "",
        "",
        "",
        "Automation equipment; Industrial machine; Electronic machine; Medical equipment; Transportation; Construction",
        "Full Specs",
        "https://www.hiwinsupport.com/download_center.aspx?pid=BS",
        "specs",
        "Product Selection",
        "https://www.hiwinsupport.com/product_select/ballscrew.aspx",
        "selection",
        "Life Calculation",
        "https://www.hiwinsupport.com/life_Calculate/ballscrew.aspx",
        "calculation",
        "CAD Download",
        "https://www.hiwinsupport.com/cad_download/ballscrew.aspx",
        "cad",
        "",
        "",
        "",
        "",
        "",
        "",
        "TRUE",
        "TRUE",
        "HIWIN",
        "Ballscrews",
        "hiwin-el-ballscrew",
        "HIWIN EL Self Lubricating Ballscrew | HIWIN",
        "Genuine HIWIN EL self-lubricating ballscrew engineered for precision motion and zero maintenance.",
        "PRD-HW-EL2005",
        "prd_sample01",
      ],
      // Sample 2: THK HSR Linear Guideway Block
      [
        "THK HSR25A Linear Motion Guide Block",
        "<p>Heavy load type linear motion guide with 4-way equal load rating for high precision and stiffness.</p>",
        "4200.00",
        "4800.00",
        "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800",
        "",
        "HIGH RIGIDITY",
        "4-Way Equal Load",
        "SMOOTH MOTION",
        "Low Friction Loss",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "CNC Machining Center; Packaging Machinery; Semiconductor Fabrication",
        "Technical Catalog",
        "https://www.thk.com/catalog",
        "specs",
        "3D CAD Models",
        "https://www.thk.com/cad",
        "cad",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "TRUE",
        "TRUE",
        "THK",
        "Linear Guideways",
        "thk-hsr25a-linear-guide",
        "THK HSR25A Linear Motion Guide Block | THK",
        "Original THK HSR25A linear guide block with high rigidity and smooth motion for industrial automation.",
        "PRD-THK-HSR25A",
        "prd_sample02",
      ],
    ];

    const filename = `products_import_template.${format}`;

    function escapeCell(val: string) {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r") || str.includes(";")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    if (format === "csv") {
      const csvContent = sampleRows.map((r) => r.map(escapeCell).join(",")).join("\r\n");
      return { success: true, csvContent, filename };
    } else {
      const ws = XLSX.utils.aoa_to_sheet(sampleRows);
      ws["!cols"] = headers.map(() => ({ wch: 18, width: 18 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      const xlsxBase64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
      return { success: true, xlsxBase64, filename };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate sample template";
    return { success: false, error: message, filename: "products_import_template.csv" };
  }
}

/**
 * 2. PREVIEW & DIFF PRODUCTS IMPORT
 */
export interface RowStatusInfo {
  rowIdx: number;
  productNo: string;
  itemType: "Product" | "Variant";
  name: string;
  status: "NEW" | "UPDATE" | "ERROR";
  diffNote?: string;
  errors?: Record<string, string>;
}

export interface PreviewImportResult {
  success: boolean;
  headers?: string[];
  rows?: string[][];
  rowStatuses?: RowStatusInfo[];
  stats?: {
    totalRows: number;
    totalProducts: number;
    newCount: number;
    updateCount: number;
    newCategories: string[];
    newBrands: string[];
    errorCount: number;
  };
  error?: string;
}

function parseCleanPrice(val: string): number {
  if (!val) return 0;
  const clean = val.replace(/[₹$,\s]/g, "").trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

function parseBoolean(val: string, defaultVal = true): boolean {
  if (!val) return defaultVal;
  const clean = val.toLowerCase().trim();
  if (clean === "true" || clean === "active" || clean === "1" || clean === "yes" || clean === "on") return true;
  if (clean === "false" || clean === "draft" || clean === "0" || clean === "no" || clean === "off") return false;
  return defaultVal;
}

export async function previewProductsImportAction(params: {
  fileBase64?: string;
  filename?: string;
  rawGridHeaders?: string[];
  rawGridRows?: string[][];
  shouldAutoAlign?: boolean;
}): Promise<PreviewImportResult> {
  try {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (params.rawGridHeaders && params.rawGridRows) {
      headers = params.rawGridHeaders;
      rows = params.rawGridRows;
    } else if (params.fileBase64) {
      const buffer = Buffer.from(params.fileBase64, "base64");
      const wb = XLSX.read(buffer, { type: "buffer" });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) return { success: false, error: "The uploaded file has no sheets." };
      const ws = wb.Sheets[sheetName];
      const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      if (rawData.length < 2) {
        return { success: false, error: "The file is empty or missing data rows." };
      }

      headers = rawData[0].map((h) => cleanVal(h));
      rows = rawData.slice(1).map((r) => {
        const rowArr: string[] = [];
        for (let i = 0; i < headers.length; i++) {
          rowArr.push(r[i] != null ? cleanVal(r[i]) : "");
        }
        return rowArr;
      });
    } else {
      return { success: false, error: "No spreadsheet data provided." };
    }

    // Filter out completely empty rows
    rows = rows.filter((r) => r.some((c) => cleanVal(c) !== ""));

    if (rows.length === 0) {
      if (params.rawGridRows) {
        rows = [headers.map(() => "")];
      } else {
        return { success: false, error: "No product data rows found in file." };
      }
    }

    // Column header resolution
    const headerLower = headers.map((h) => cleanVal(h).toLowerCase());
    const findColIdx = (...aliases: string[]): number => {
      for (const alias of aliases) {
        const aLower = alias.toLowerCase();
        const idx = headerLower.findIndex((h) => h === aLower || h.includes(aLower));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const colIdx = {
      id: findColIdx("product id", "id"),
      sku: findColIdx("sku", "product no", "product_no", "code"),
      slug: findColIdx("product url slug", "product url", "slug", "handle"),
      name: findColIdx("product name", "name", "title"),
      description: findColIdx("feature description", "description", "desc"),
      price: findColIdx("selling price", "price", "baseprice"),
      strikethroughPrice: findColIdx("original price", "strikethrough price", "strikethrough", "compare price", "compareatprice"),
      imagesUrl: findColIdx("images url", "images", "image", "media"),
      videoUrl: findColIdx("product video url", "video url", "video"),
      applications: findColIdx("applications", "application tags", "tags"),
      enableBuyerNote: findColIdx("enable buyer note", "buyer note", "enablebuyernote"),
      visibility: findColIdx("visibility", "visibility of product", "visible", "status"),
      brand: findColIdx("brand"),
      category: findColIdx("category", "categories", "primary category"),
      seoTitle: findColIdx("seo meta title", "seo title", "meta title"),
      seoDesc: findColIdx("seo meta description", "seo desc", "meta description"),
    };

    // Feature Cards 1 to 6
    const featureCardCols: Array<{ labelIdx: number; valIdx: number }> = [];
    for (let i = 1; i <= 6; i++) {
      const labelIdx = findColIdx(`feature ${i} label`, `feature${i}label`, `card ${i} label`);
      const valIdx = findColIdx(`feature ${i} value`, `feature${i}value`, `card ${i} value`);
      featureCardCols.push({ labelIdx, valIdx });
    }

    // Load existing database records for diffing
    const [existingProductsRes, existingCategoriesRes, existingBrandsRes] = await Promise.all([
      query(`
        SELECT p."id", p."name", p."slug", p."sku", p."price", p."description", p."brand",
               p."categoryId", p."primaryCategoryId", p."featureHighlights", p."applications",
               c."name" as "categoryName"
        FROM "Product" p
        LEFT JOIN "Category" c ON c."id" = COALESCE(p."categoryId", p."primaryCategoryId")
      `),
      query(`SELECT "id", "name", "slug" FROM "Category"`),
      query(`SELECT "id", "name", "slug" FROM "Brand"`),
    ]);

    const existingProducts = existingProductsRes.rows as any[];
    const idMap = new Map<string, any>(existingProducts.map((p) => [p.id.toLowerCase().trim(), p]));
    const skuMap = new Map<string, any>(
      existingProducts.filter((p) => p.sku).map((p) => [p.sku.toLowerCase().trim(), p])
    );
    const slugMap = new Map<string, any>(
      existingProducts.filter((p) => p.slug).map((p) => [p.slug.toLowerCase().trim(), p])
    );
    const nameMap = new Map<string, any>(
      existingProducts.filter((p) => p.name).map((p) => [p.name.toLowerCase().trim(), p])
    );
    const slugOfNameMap = new Map<string, any>(
      existingProducts.filter((p) => p.name).map((p) => [generateSlug(p.name), p])
    );

    const existingCategories = new Set(
      existingCategoriesRes.rows.map((c: any) => (c.name || "").toLowerCase().trim())
    );
    const existingBrands = new Set(
      existingBrandsRes.rows.map((b: any) => (b.name || "").toLowerCase().trim())
    );

    const rowStatuses: RowStatusInfo[] = [];
    const discoveredNewCategories = new Set<string>();
    const discoveredNewBrands = new Set<string>();

    let newCount = 0;
    let updateCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const getVal = (idx: number) => (idx !== -1 && row[idx] != null ? cleanVal(row[idx]) : "");

      const idVal = getVal(colIdx.id);
      const skuVal = getVal(colIdx.sku);
      const slugVal = getVal(colIdx.slug);
      const nameVal = getVal(colIdx.name);
      const priceVal = getVal(colIdx.price);
      const strikethroughVal = getVal(colIdx.strikethroughPrice);
      const appsVal = getVal(colIdx.applications);
      const brandVal = getVal(colIdx.brand);
      const catVal = getVal(colIdx.category);
      const visVal = getVal(colIdx.visibility);
      const buyerNoteVal = getVal(colIdx.enableBuyerNote);

      const rowErrors: Record<string, string> = {};

      // 1. Check if product already exists (UPDATE) or is NEW
      let matchedProduct: any = null;
      let matchScore: number | null = null;

      if (idVal && idMap.has(idVal.toLowerCase())) {
        matchedProduct = idMap.get(idVal.toLowerCase());
      } else if (skuVal && skuMap.has(skuVal.toLowerCase())) {
        matchedProduct = skuMap.get(skuVal.toLowerCase());
      } else {
        // Resolve incoming product details for >= 90% similarity comparison
        const incomingFeatures: Array<{ label: string; value: string }> = [];
        for (let c = 0; c < 6; c++) {
          const { labelIdx, valIdx } = featureCardCols[c];
          const l = getVal(labelIdx);
          const v = getVal(valIdx);
          if (l || v) {
            incomingFeatures.push({ label: l, value: v });
          }
        }

        const incomingApps: string[] = appsVal
          ? appsVal.split(/[;,]/).map((t) => t.trim()).filter(Boolean).slice(0, 20)
          : [];

        const incomingPrice = colIdx.price !== -1 && priceVal ? parseCleanPrice(priceVal) : null;

        const incomingDetails = {
          name: nameVal,
          description: getVal(colIdx.description),
          price: incomingPrice,
          brand: brandVal,
          category: catVal,
          features: incomingFeatures,
          applications: incomingApps,
        };

        let bestScore = 0;
        let bestCandidate: any = null;

        for (const p of existingProducts) {
          const sim = calculateProductDetailSimilarity(
            incomingDetails,
            {
              name: p.name,
              description: p.description,
              price: p.price,
              brand: p.brand,
              categoryName: p.categoryName,
              featureHighlights: p.featureHighlights,
              applications: p.applications,
            },
            90
          );

          if (sim.score > bestScore) {
            bestScore = sim.score;
            bestCandidate = p;
          }
        }

        // Only mark as UPDATE if at least 90% details match
        if (bestCandidate && bestScore >= 90) {
          matchedProduct = bestCandidate;
          matchScore = bestScore;
        }
      }

      const isUpdate = Boolean(matchedProduct);

      // 2. Validate Required Fields
      if (!nameVal) {
        const targetCol = colIdx.name !== -1 ? colIdx.name : 0;
        rowErrors[`col_${targetCol}`] = "Product Name is required";
      }

      if (colIdx.price !== -1 && priceVal) {
        const pNum = parseCleanPrice(priceVal);
        if (isNaN(pNum) || pNum < 0) {
          rowErrors[`col_${colIdx.price}`] = `Invalid selling price "${priceVal}". Must be a positive number.`;
        }
      }

      if (colIdx.strikethroughPrice !== -1 && strikethroughVal) {
        const sNum = parseCleanPrice(strikethroughVal);
        if (isNaN(sNum) || sNum < 0) {
          rowErrors[`col_${colIdx.strikethroughPrice}`] = `Invalid original price "${strikethroughVal}". Must be a number.`;
        }
      }

      if (colIdx.visibility !== -1 && visVal) {
        const cleanV = visVal.toLowerCase();
        if (!["true", "false", "active", "draft", "1", "0", "yes", "no"].includes(cleanV)) {
          rowErrors[`col_${colIdx.visibility}`] = `Invalid visibility "${visVal}". Use TRUE/Active or FALSE/Draft.`;
        }
      }

      if (colIdx.enableBuyerNote !== -1 && buyerNoteVal) {
        const cleanB = buyerNoteVal.toLowerCase();
        if (!["true", "false", "on", "off", "1", "0", "yes", "no"].includes(cleanB)) {
          rowErrors[`col_${colIdx.enableBuyerNote}`] = `Invalid buyer note toggle "${buyerNoteVal}". Use TRUE or FALSE.`;
        }
      }

      // 3. Track newly discovered Categories and Brands
      if (catVal && !existingCategories.has(catVal.toLowerCase())) {
        discoveredNewCategories.add(catVal);
      }
      if (brandVal && !existingBrands.has(brandVal.toLowerCase())) {
        discoveredNewBrands.add(brandVal);
      }

      const hasErrors = Object.keys(rowErrors).length > 0;
      let status: "NEW" | "UPDATE" | "ERROR";
      let diffNote: string;

      if (hasErrors) {
        status = "ERROR";
        errorCount++;
        diffNote = Object.values(rowErrors).join("; ");
      } else if (isUpdate) {
        status = "UPDATE";
        updateCount++;
        const matchInfo =
          matchScore != null
            ? `${matchScore}% details match`
            : (matchedProduct.sku || matchedProduct.id);
        diffNote = `Updating existing product "${matchedProduct.name}" (${matchInfo})`;
      } else {
        status = "NEW";
        newCount++;
        diffNote = "New product to create";
      }

      rowStatuses.push({
        rowIdx: i,
        productNo: skuVal || idVal || `ROW-${i + 1}`,
        itemType: "Product",
        name: nameVal || "Untitled Product",
        status,
        diffNote,
        errors: rowErrors,
      });
    }

    return {
      success: true,
      headers,
      rows,
      rowStatuses,
      stats: {
        totalRows: rows.length,
        totalProducts: rows.length,
        newCount,
        updateCount,
        newCategories: Array.from(discoveredNewCategories),
        newBrands: Array.from(discoveredNewBrands),
        errorCount,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to analyze import preview";
    console.error("Preview import error:", error);
    return { success: false, error: message };
  }
}

/**
 * 3. IMPORT PRODUCTS BACKEND ENGINE (From Base64 or Direct Edited Rows)
 * Supports both creating new products and updating existing products without variants.
 */
interface ImportOptions {
  fileBase64?: string;
  filename?: string;
  rawGridHeaders?: string[];
  rawGridRows?: string[][];
}

export async function importProductsAction(options: ImportOptions): Promise<{
  success: boolean;
  createdCount?: number;
  updatedCount?: number;
  totalProcessed?: number;
  errors?: string[];
  error?: string;
}> {
  try {
    let rawHeaders: string[] = [];
    let rawRows: string[][] = [];

    if (options.rawGridHeaders && options.rawGridRows) {
      rawHeaders = options.rawGridHeaders;
      rawRows = options.rawGridRows;
    } else if (options.fileBase64) {
      const buffer = Buffer.from(options.fileBase64, "base64");
      const wb = XLSX.read(buffer, { type: "buffer" });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) {
        return { success: false, error: "The uploaded spreadsheet has no sheets." };
      }
      const ws = wb.Sheets[sheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      if (data.length < 2) {
        return { success: false, error: "The uploaded file is empty or missing data rows." };
      }

      rawHeaders = data[0].map((h) => cleanVal(h));
      rawRows = data.slice(1).map((r) => {
        const rowArr: string[] = [];
        for (let i = 0; i < rawHeaders.length; i++) {
          rowArr.push(r[i] != null ? cleanVal(r[i]) : "");
        }
        return rowArr;
      });
    } else {
      return { success: false, error: "No file content or grid data provided for import." };
    }

    rawRows = rawRows.filter((r) => r.some((c) => cleanVal(c) !== ""));

    if (rawRows.length === 0) {
      return { success: false, error: "No product data rows found to import." };
    }

    // Resolve column headers
    const headerLower = rawHeaders.map((h) => cleanVal(h).toLowerCase());
    const findColIdx = (...aliases: string[]): number => {
      for (const alias of aliases) {
        const aLower = alias.toLowerCase();
        const idx = headerLower.findIndex((h) => h === aLower || h.includes(aLower));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const colIdx = {
      id: findColIdx("product id", "id"),
      sku: findColIdx("sku", "product no", "product_no", "code"),
      slug: findColIdx("product url slug", "product url", "slug", "handle"),
      name: findColIdx("product name", "name", "title"),
      description: findColIdx("feature description", "description", "desc"),
      price: findColIdx("selling price", "price", "baseprice"),
      strikethroughPrice: findColIdx("original price", "strikethrough price", "strikethrough", "compare price", "compareatprice"),
      imagesUrl: findColIdx("images url", "images", "image", "media"),
      videoUrl: findColIdx("product video url", "video url", "video"),
      applications: findColIdx("applications", "application tags", "tags"),
      enableBuyerNote: findColIdx("enable buyer note", "buyer note", "enablebuyernote"),
      visibility: findColIdx("visibility", "visibility of product", "visible", "status"),
      brand: findColIdx("brand"),
      category: findColIdx("category", "categories", "primary category"),
      seoTitle: findColIdx("seo meta title", "seo title", "meta title"),
      seoDesc: findColIdx("seo meta description", "seo desc", "meta description"),
    };

    // Feature Cards 1 to 6
    const featureCardCols: Array<{ labelIdx: number; valIdx: number }> = [];
    for (let i = 1; i <= 6; i++) {
      const labelIdx = findColIdx(`feature ${i} label`, `feature${i}label`, `card ${i} label`);
      const valIdx = findColIdx(`feature ${i} value`, `feature${i}value`, `card ${i} value`);
      featureCardCols.push({ labelIdx, valIdx });
    }

    // Support Links 1 to 6
    const supportLinkCols: Array<{ titleIdx: number; urlIdx: number; iconIdx: number }> = [];
    for (let i = 1; i <= 6; i++) {
      const titleIdx = findColIdx(`support link ${i} title`, `link ${i} title`, `supportlink${i}title`);
      const urlIdx = findColIdx(`support link ${i} url`, `link ${i} url`, `supportlink${i}url`);
      const iconIdx = findColIdx(`support link ${i} icon`, `link ${i} icon`, `supportlink${i}icon`);
      supportLinkCols.push({ titleIdx, urlIdx, iconIdx });
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    // Process all products inside a database transaction
    await transaction(async (client) => {
      // Query existing products for detail similarity matching and deduplication
      const existingProductsRes = await client.query(`
        SELECT p."id", p."name", p."slug", p."sku", p."price", p."description", p."brand",
               p."categoryId", p."primaryCategoryId", p."featureHighlights", p."applications",
               c."name" as "categoryName"
        FROM "Product" p
        LEFT JOIN "Category" c ON c."id" = COALESCE(p."categoryId", p."primaryCategoryId")
      `);
      const dbProducts = existingProductsRes.rows as any[];

      for (let rIdx = 0; rIdx < rawRows.length; rIdx++) {
        const row = rawRows[rIdx];
        const getVal = (idx: number) => (idx !== -1 && row[idx] != null ? cleanVal(row[idx]) : "");

        const nameInput = getVal(colIdx.name);
        if (!nameInput && !getVal(colIdx.sku) && !getVal(colIdx.id)) {
          continue; // Skip blank row
        }

        const prodName = nameInput || "Untitled Product";
        const idInput = getVal(colIdx.id);
        const skuInput = getVal(colIdx.sku);
        const slugInput = getVal(colIdx.slug);
        const descInput = getVal(colIdx.description);
        const priceInput = getVal(colIdx.price);
        const strikethroughInput = getVal(colIdx.strikethroughPrice);
        const imagesInput = getVal(colIdx.imagesUrl);
        const videoInput = getVal(colIdx.videoUrl);
        const appsInput = getVal(colIdx.applications);
        const buyerNoteInput = getVal(colIdx.enableBuyerNote);
        const visInput = getVal(colIdx.visibility);
        const brandInput = getVal(colIdx.brand);
        const catInput = getVal(colIdx.category);
        const seoTitleInput = getVal(colIdx.seoTitle);
        const seoDescInput = getVal(colIdx.seoDesc);

        // Resolve Prices
        const priceNum = parseCleanPrice(priceInput);
        const priceInPaise = Math.round(priceNum * 100);

        const strikeNum = parseCleanPrice(strikethroughInput);
        const strikethroughInPaise = strikeNum > 0 ? Math.round(strikeNum * 100) : null;

        // Resolve Feature Highlight Cards (up to 6)
        const featureHighlights: Array<{ label: string; value: string }> = [];
        for (let c = 0; c < 6; c++) {
          const { labelIdx, valIdx } = featureCardCols[c];
          const l = getVal(labelIdx);
          const v = getVal(valIdx);
          if (l || v) {
            featureHighlights.push({ label: l, value: v });
          }
        }

        // Resolve Applications Tags (up to 20)
        const applications: string[] = appsInput
          ? appsInput.split(/[;,]/).map((t) => t.trim()).filter(Boolean).slice(0, 20)
          : [];

        // 1. Check if product exists in DB by ID, SKU, or Detail Similarity (>= 90%)
        let matchedProduct: any = null;
        if (idInput) {
          matchedProduct = dbProducts.find((p) => p.id.toLowerCase() === idInput.toLowerCase());
        }
        if (!matchedProduct && skuInput) {
          matchedProduct = dbProducts.find((p) => p.sku && p.sku.toLowerCase() === skuInput.toLowerCase());
        }

        // If no explicit ID or SKU match, compare detail similarity with candidate products
        if (!matchedProduct) {
          const incomingDetails = {
            name: prodName,
            description: descInput,
            price: priceNum,
            brand: brandInput,
            category: catInput,
            features: featureHighlights,
            applications,
          };

          let bestScore = 0;
          let bestCandidate: any = null;

          for (const p of dbProducts) {
            const sim = calculateProductDetailSimilarity(
              incomingDetails,
              {
                name: p.name,
                description: p.description,
                price: p.price,
                brand: p.brand,
                categoryName: p.categoryName,
                featureHighlights: p.featureHighlights,
                applications: p.applications,
              },
              90
            );

            if (sim.score > bestScore) {
              bestScore = sim.score;
              bestCandidate = p;
            }
          }

          if (bestCandidate && bestScore >= 90) {
            matchedProduct = bestCandidate;
          }
        }

        const isUpdate = Boolean(matchedProduct);
        const existing = matchedProduct;
        const productId = isUpdate ? existing.id : (idInput && idInput.startsWith("prd_") ? idInput : generateId("prd_"));

        // 2. Resolve Slug
        let cleanSlug = slugInput ? generateSlug(slugInput) : (isUpdate && existing.slug ? existing.slug : generateSlug(prodName));
        // Check slug collision with other products
        const slugCollision = await client.query(
          `SELECT "id" FROM "Product" WHERE "slug" = $1 AND "id" <> $2 LIMIT 1`,
          [cleanSlug, productId]
        );
        if (slugCollision.rows.length > 0) {
          cleanSlug = `${cleanSlug}-${Date.now().toString(36).slice(-4)}`;
        }

        // 3. Resolve SKU
        const cleanSku = skuInput || (isUpdate && existing.sku ? existing.sku : `PRD-${productId.slice(-6).toUpperCase()}`);

        // 4. Resolve Visibility & Buyer Note
        const isVisible = parseBoolean(visInput, true);
        const enableBuyerNote = parseBoolean(buyerNoteInput, true);

        // 5. Resolve Brand (Auto-create in Brand table)
        const brandName = brandInput || null;
        if (brandName) {
          const brandSlug = generateSlug(brandName);
          await client.query(
            `INSERT INTO "Brand" ("id", "name", "slug", "status", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name"`,
            [generateId("brand_"), brandName, brandSlug]
          );
        }

        // 6. Resolve Category (Auto-create in Category table)
        let categoryId: string | null = null;
        if (catInput) {
          const catSlug = generateSlug(catInput);
          const catRes = await client.query(
            `INSERT INTO "Category" ("id", "name", "slug", "status", "sortOrder", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, 'active', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name"
             RETURNING "id"`,
            [generateId("cat_"), catInput, catSlug]
          );
          categoryId = catRes.rows[0].id;
        }

        // 7. Resolve Technical Support Links (up to 6)
        const technicalSupportLinks: Array<{ title: string; url: string; icon: string }> = [];
        for (let l = 0; l < 6; l++) {
          const { titleIdx, urlIdx, iconIdx } = supportLinkCols[l];
          const title = getVal(titleIdx);
          const url = getVal(urlIdx);
          let icon = getVal(iconIdx).toLowerCase();
          if (!["specs", "selection", "calculation", "cad"].includes(icon)) {
            icon = "specs";
          }
          if (title || url) {
            technicalSupportLinks.push({ title, url, icon });
          }
        }

        // 8. Resolve SEO Title and Description
        const seoTitle = seoTitleInput || (prodName ? `${prodName} | ${brandName || "HIWIN"}` : null);
        const seoDesc = seoDescInput || (descInput ? descInput.replace(/<[^>]*>/g, "").slice(0, 160).trim() : null);

        // 9. Upsert Core Product Record
        if (isUpdate) {
          await client.query(
            `UPDATE "Product" SET
               "name" = $1, "slug" = $2, "sku" = $3, "description" = $4,
               "status" = $5, "visible" = $6, "brand" = $7,
               "categoryId" = COALESCE($8, "categoryId"),
               "primaryCategoryId" = COALESCE($8, "primaryCategoryId"),
               "basePrice" = $9, "price" = $9,
               "compareAtPrice" = $10, "strikethroughPrice" = $10,
               "featureHighlights" = $11, "applications" = $12, "technicalSupportLinks" = $13,
               "enableBuyerNote" = $14, "videoUrl" = $15,
               "seoTitle" = $16, "seoDesc" = $17,
               "updatedAt" = CURRENT_TIMESTAMP
             WHERE "id" = $18`,
            [
              prodName, cleanSlug, cleanSku, descInput || "",
              isVisible ? "ACTIVE" : "DRAFT", isVisible, brandName,
              categoryId,
              priceInPaise, strikethroughInPaise,
              JSON.stringify(featureHighlights),
              JSON.stringify(applications),
              JSON.stringify(technicalSupportLinks),
              enableBuyerNote,
              videoInput || null,
              seoTitle,
              seoDesc,
              productId,
            ]
          );
          updatedCount++;
          if (existing) {
            existing.name = prodName;
            existing.description = descInput || "";
            existing.brand = brandName;
            existing.price = priceInPaise;
            existing.featureHighlights = featureHighlights;
            existing.applications = applications;
            if (catInput) existing.categoryName = catInput;
          }
        } else {
          await client.query(
            `INSERT INTO "Product" (
               "id", "name", "slug", "sku", "description",
               "status", "visible", "showInPos", "brand",
               "categoryId", "primaryCategoryId",
               "basePrice", "price", "compareAtPrice", "strikethroughPrice",
               "featureHighlights", "applications", "technicalSupportLinks",
               "enableBuyerNote", "videoUrl", "seoTitle", "seoDesc",
               "createdAt", "updatedAt"
             )
             VALUES (
               $1, $2, $3, $4, $5,
               $6, $7, true, $8,
               $9, $9,
               $10, $10, $11, $11,
               $12, $13, $14,
               $15, $16, $17, $18,
               CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
             )`,
            [
              productId, prodName, cleanSlug, cleanSku, descInput || "",
              isVisible ? "ACTIVE" : "DRAFT", isVisible, brandName,
              categoryId,
              priceInPaise, strikethroughInPaise,
              JSON.stringify(featureHighlights),
              JSON.stringify(applications),
              JSON.stringify(technicalSupportLinks),
              enableBuyerNote,
              videoInput || null,
              seoTitle,
              seoDesc,
            ]
          );
          createdCount++;
          dbProducts.push({
            id: productId,
            name: prodName,
            slug: cleanSlug,
            sku: cleanSku,
            price: priceInPaise,
            description: descInput || "",
            brand: brandName,
            categoryId,
            primaryCategoryId: categoryId,
            categoryName: catInput || null,
            featureHighlights,
            applications,
          });
        }

        // 13. Sync Category Join
        if (categoryId) {
          await client.query(
            `INSERT INTO "ProductCategory" ("productId", "categoryId")
             VALUES ($1, $2)
             ON CONFLICT ("productId", "categoryId") DO NOTHING`,
            [productId, categoryId]
          );
        }

        // 14. Sync Images
        if (imagesInput) {
          const imageUrls = imagesInput.split(/[;,]/).map((u) => u.trim()).filter(Boolean);
          if (imageUrls.length > 0) {
            await client.query(`DELETE FROM "ProductImage" WHERE "productId" = $1`, [productId]);
            for (let imgIdx = 0; imgIdx < imageUrls.length; imgIdx++) {
              await client.query(
                `INSERT INTO "ProductImage" ("id", "productId", "url", "alt", "isPrimary", "order", "createdAt")
                 VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
                [generateId("med_"), productId, imageUrls[imgIdx], prodName, imgIdx === 0, imgIdx]
              );
            }
          }
        }

        // 15. Ensure default base variant in ProductVariant (for cart / order compatibility)
        await client.query(
          `INSERT INTO "ProductVariant" (
             "id", "productId", "sku", "price", "strikethroughPrice",
             "trackQuantity", "stockQuantity", "inventoryStatus",
             "attributes", "createdAt", "updatedAt"
           )
           VALUES ($1, $2, $3, $4, $5, true, 100, 'IN_STOCK', '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT ("sku") DO UPDATE SET
             "price" = EXCLUDED."price",
             "strikethroughPrice" = EXCLUDED."strikethroughPrice",
             "updatedAt" = CURRENT_TIMESTAMP`,
          [generateId("var_"), productId, cleanSku, priceInPaise, strikethroughInPaise]
        );
      }
    });

    const safeRevalidate = (p: string) => {
      try {
        revalidatePath(p);
      } catch {
        // Safe when running outside Next.js request context
      }
    };

    safeRevalidate("/admin/products");
    safeRevalidate("/products");
    safeRevalidate("/");

    return {
      success: true,
      createdCount,
      updatedCount,
      totalProcessed: createdCount + updatedCount,
      errors,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to import products";
    console.error("Product import error:", error);
    return { success: false, error: message };
  }
}
