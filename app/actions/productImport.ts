"use server";

import { transaction, query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import * as XLSX from "xlsx";
import { cleanVal, generateSlug, autoAlignSpreadsheetOptions } from "@/lib/importHelpers";

const generateId = (prefix = "prd_") => prefix + crypto.randomBytes(8).toString("hex");

/**
 * 1. DOWNLOAD IMPORT SAMPLE TEMPLATE (EXCEL / CSV)
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
      "product no",
      "Item Type",
      "Name",
      "Description",
      "Brand",
      "Categories",
      "Primary Category",
      "Ribbon",
      "Tags",
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
      "Price",
      "Strikethrough Price (₹)",
      "Price per unit Visible",
      "Price per unit price",
      "Price per unit unit",
      "Images url",
      "Additional info sections Visible",
      "section 1 Title",
      "section 1 Name",
      "section 2 Title",
      "section 2 Name",
      "section 3 Title",
      "section 3 Name",
      "section 4 Title",
      "section 4 Name",
      "section 5 Title",
      "section 5 Name",
      "Visibility of Product",
      "Product URL",
    ];

    const sampleRows: string[][] = [
      headers,
      // Sample 1: Schneider Electric RXM Relay (Product)
      [
        "p0001",
        "Product",
        "Schneider Electric RXM Relay",
        "<p>High quality industrial miniature relay with 4 changeover contacts and LED indicator.</p>",
        "Schneider Electric",
        "Automation;Relays;Switches",
        "Relays",
        "Best Seller",
        "industrial, relay, 24v, automation",
        "Voltage",
        "24V;110V;230V",
        "Color",
        "Red;Green;Yellow",
        "Texture",
        "Metal;Plastic",
        "",
        "",
        "",
        "",
        "",
        "",
        "450.00",
        "550.00",
        "false",
        "450.00;1",
        "piece",
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800;https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800",
        "true",
        "Shipping Info",
        "Shipping Info",
        "Return & Refund Policy",
        "Return & Refund Policy",
        "Demo",
        "Hello Options",
        "",
        "",
        "",
        "",
        "true",
        "http://localhost:3000/products/schneider-electric-rxm-relay",
      ],
      // Variant 1
      [
        "p0001_001",
        "Variant",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Voltage",
        "24V",
        "Color",
        "Red",
        "Texture",
        "Metal",
        "",
        "",
        "",
        "",
        "",
        "",
        "450.00",
        "550.00",
        "",
        "",
        "",
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800",
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
        "true",
        "",
      ],
      // Variant 2
      [
        "p0001_002",
        "Variant",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Voltage",
        "110V",
        "Color",
        "Green",
        "Texture",
        "Plastic",
        "",
        "",
        "",
        "",
        "",
        "",
        "480.00",
        "600.00",
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
        "",
        "",
        "",
        "true",
        "",
      ],
      // Variant 3
      [
        "p0001_003",
        "Variant",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Voltage",
        "230V",
        "Color",
        "Yellow",
        "Texture",
        "Plastic",
        "",
        "",
        "",
        "",
        "",
        "",
        "520.00",
        "650.00",
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
        "",
        "",
        "",
        "true",
        "",
      ],

      // Sample 2: Siemens S7-1200 PLC (Product without variants)
      [
        "p0002",
        "Product",
        "Siemens SIMATIC S7-1200 CPU 1214C",
        "<p>Compact CPU with 14 digital inputs, 10 digital outputs, and 2 analog inputs.</p>",
        "Siemens",
        "Drives & VFDs;Automation",
        "Drives & VFDs",
        "New Arrival",
        "plc, siemens, profinet",
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
        "28000.00",
        "32000.00",
        "false",
        "28000.00;1",
        "unit",
        "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800",
        "true",
        "Product Info",
        "Product Info",
        "Shrey Demo",
        "Standard info Section",
        "Shipping Info",
        "Shipping Info",
        "",
        "",
        "",
        "",
        "true",
        "http://localhost:3000/products/siemens-simatic-s7-1200-cpu-1214c",
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
      ws["!cols"] = headers.map(() => ({ wch: 16, width: 16 }));
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

    // Only filter out completely empty trailing rows when parsing an uploaded file
    if (params.fileBase64) {
      rows = rows.filter((r) => r.some((c) => cleanVal(c) !== ""));
    }

    if (rows.length === 0) {
      if (params.rawGridRows) {
        rows = [headers.map(() => "")];
      } else {
        return { success: false, error: "No product data rows found." };
      }
    }

    // Automatically align option columns and fill missing option names
    if (params.shouldAutoAlign !== false) {
      const aligned = autoAlignSpreadsheetOptions(headers, rows);
      rows = aligned.rows;
    }

    // Column header resolution
    const headerLower = headers.map((h) => h.toLowerCase());
    const findColIdx = (...aliases: string[]): number => {
      for (const alias of aliases) {
        const idx = headerLower.findIndex((h) => h === alias.toLowerCase() || h.includes(alias.toLowerCase()));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const colIdx = {
      productNo: findColIdx("product no", "product_no", "handle", "slug", "sku", "id"),
      itemType: findColIdx("item type", "item_type", "type", "fieldtype"),
      name: findColIdx("name", "title", "product name"),
      categories: findColIdx("categories", "categoryslugs"),
      primaryCategory: findColIdx("primary category", "primarycategoryslug"),
      brand: findColIdx("brand"),
      price: findColIdx("price"),
      strikethroughPrice: findColIdx("strikethrough price", "strikethrough", "compare price", "compareatprice"),
      pricePerUnitVisible: findColIdx("price per unit visible", "showpriceperunit"),
      pricePerUnitPrice: findColIdx("price per unit price", "baseunit"),
      pricePerUnitUnit: findColIdx("price per unit unit", "baseunitmeasurement"),
      additionalInfoVisible: findColIdx("additional info sections visible"),
      visibility: findColIdx("visibility of product", "visibility", "visible"),
    };

    const sectionColIndices: Array<{ titleIdx: number; nameIdx: number }> = [];
    for (let s = 1; s <= 5; s++) {
      const titleIdx = findColIdx(`section ${s} title`, `section${s}title`, `section ${s}`);
      const nameIdx = findColIdx(`section ${s} name`, `section${s}name`, `section ${s} content`);
      sectionColIndices.push({ titleIdx, nameIdx });
    }

    const optionColIndices: Array<{ nameIdx: number; valIdx: number }> = [];
    for (let o = 1; o <= 6; o++) {
      const nameIdx = findColIdx(`option ${o} name`, `productoptionname${o}`);
      const valIdx = findColIdx(`option ${o} value`, `productoptionchoices${o}`, `productoptionchoice${o}`);
      optionColIndices.push({ nameIdx, valIdx });
    }

    // Load existing database records for diffing & library validation
    const [existingProductsRes, existingCategoriesRes, existingBrandsRes, existingSectionsRes] = await Promise.all([
      query(`SELECT "id", "name", "slug", "sku", "price" FROM "Product"`),
      query(`SELECT "id", "name", "slug" FROM "Category"`),
      query(`SELECT "id", "name", "slug" FROM "Brand"`),
      query(`SELECT "id", "title", "internalName" FROM "GlobalInfoSection"`),
    ]);

    const existingProducts = existingProductsRes.rows as any[];
    const existingCategories = new Set(
      existingCategoriesRes.rows.map((c: any) => c.name.toLowerCase().trim())
    );
    const existingBrands = new Set(
      existingBrandsRes.rows.map((b: any) => b.name.toLowerCase().trim())
    );
    const existingSectionTitles = new Set(
      existingSectionsRes.rows.flatMap((s: any) => [
        (s.title || "").toLowerCase().trim(),
        (s.internalName || "").toLowerCase().trim()
      ]).filter(Boolean)
    );

    const VALID_UNITS = new Set(["kg", "g", "l", "ml", "m", "cm", "piece", "unit", "item", "pack", "box", "set"]);
    const isValidBoolean = (v: string) => {
      const clean = v.toLowerCase().trim();
      return clean === "true" || clean === "false" || clean === "";
    };

    const rowStatuses: RowStatusInfo[] = [];
    const discoveredNewCategories = new Set<string>();
    const discoveredNewBrands = new Set<string>();

    let newCount = 0;
    let updateCount = 0;
    let errorCount = 0;
    let totalProducts = 0;

    let currentParentStatus: "NEW" | "UPDATE" = "NEW";
    let currentParentOptions: Array<{ name: string; choices: string[] }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const getVal = (idx: number) => (idx !== -1 && row[idx] != null ? cleanVal(row[idx]) : "");

      const productNo = getVal(colIdx.productNo);
      const itemTypeRaw = getVal(colIdx.itemType).toLowerCase();
      const name = getVal(colIdx.name);
      const priceRaw = getVal(colIdx.price);
      const brandRaw = getVal(colIdx.brand);
      const categoriesRaw = getVal(colIdx.categories);

      const isVariant =
        itemTypeRaw === "variant" ||
        (productNo.includes("_") && !name) ||
        (!name && !itemTypeRaw && i > 0);

      const rowErrors: Record<string, string> = {};

      // 1. Boolean format checks
      if (colIdx.pricePerUnitVisible !== -1) {
        const v = getVal(colIdx.pricePerUnitVisible);
        if (v && !isValidBoolean(v)) {
          rowErrors[`col_${colIdx.pricePerUnitVisible}`] = `Invalid boolean "${v}". Must be "true" or "false"`;
        }
      }
      if (colIdx.additionalInfoVisible !== -1) {
        const v = getVal(colIdx.additionalInfoVisible);
        if (v && !isValidBoolean(v)) {
          rowErrors[`col_${colIdx.additionalInfoVisible}`] = `Invalid boolean "${v}". Must be "true" or "false"`;
        }
      }
      if (colIdx.visibility !== -1) {
        const v = getVal(colIdx.visibility);
        if (v && !isValidBoolean(v)) {
          rowErrors[`col_${colIdx.visibility}`] = `Invalid boolean "${v}". Must be "true" or "false"`;
        }
      }

      // 2. Unit measurement check
      if (colIdx.pricePerUnitUnit !== -1) {
        const u = getVal(colIdx.pricePerUnitUnit).toLowerCase().trim();
        if (u && !VALID_UNITS.has(u)) {
          rowErrors[`col_${colIdx.pricePerUnitUnit}`] = `Invalid unit "${u}". Must be one of: piece, unit, item, kg, g, l, ml, m, cm, pack, box, set`;
        }
      }

      // 3. Price per unit price formatting check
      if (colIdx.pricePerUnitPrice !== -1) {
        const pp = getVal(colIdx.pricePerUnitPrice);
        if (pp) {
          if (pp.includes(";")) {
            const parts = pp.split(";");
            const p1 = parts[0]?.trim();
            const p2 = parts[1]?.trim();
            if (!p1 || isNaN(parseFloat(p1)) || !p2 || isNaN(parseFloat(p2))) {
              rowErrors[`col_${colIdx.pricePerUnitPrice}`] = `Malformed price per unit "${pp}". Format must be "price;unit" (e.g. 450.00;1)`;
            }
          } else if (isNaN(parseFloat(pp))) {
            rowErrors[`col_${colIdx.pricePerUnitPrice}`] = `Price per unit must be a valid number or format "price;unit" (e.g. 450.00;1)`;
          }
        }
      }

      // 4. Additional Info Sections Library validation (Connect Title & Name)
      for (let s = 0; s < sectionColIndices.length; s++) {
        const { titleIdx, nameIdx } = sectionColIndices[s];
        const sTitle = titleIdx !== -1 ? getVal(titleIdx) : "";
        const sName = nameIdx !== -1 ? getVal(nameIdx) : "";

        if (sTitle || sName) {
          const matched = existingSectionsRes.rows.find((sec: any) => {
            const tLower = (sec.title || "").toLowerCase().trim();
            const nLower = (sec.internalName || "").toLowerCase().trim();
            const inputTLower = sTitle.toLowerCase().trim();
            const inputNLower = sName.toLowerCase().trim();

            if (inputTLower && inputNLower) {
              return (
                inputTLower === tLower ||
                inputNLower === nLower ||
                inputTLower === nLower ||
                inputNLower === tLower
              );
            }
            if (inputTLower) {
              return inputTLower === tLower || inputTLower === nLower;
            }
            if (inputNLower) {
              return inputNLower === nLower || inputNLower === tLower;
            }
            return false;
          });

          if (!matched) {
            const errLabel = sName ? `"${sName}"` : `"${sTitle}"`;
            if (nameIdx !== -1 && sName) {
              rowErrors[`col_${nameIdx}`] = `Section Name ${errLabel} does not exist in Additional Info Sections Library!`;
            }
            if (titleIdx !== -1 && sTitle) {
              rowErrors[`col_${titleIdx}`] = `Section Title "${sTitle}" does not exist in Additional Info Sections Library!`;
            }
          }
        }
      }

      if (!isVariant) {
        totalProducts++;
        currentParentOptions = [];
        for (let o = 0; o < 6; o++) {
          const { nameIdx, valIdx } = optionColIndices[o];
          const oName = getVal(nameIdx);
          const oVal = getVal(valIdx);
          if (oName && oVal) {
            const choices = oVal.split(/[;,]/).map((c) => c.trim()).filter(Boolean);
            if (choices.length > 0) {
              currentParentOptions.push({ name: oName, choices });
            }
          }
        }

        if (!name && !productNo) {
          if (colIdx.name !== -1) rowErrors[`col_${colIdx.name}`] = "Product Name or Product No is required";
          rowErrors["name"] = "Product Name or Product No is required";
        }

        if (priceRaw) {
          const pNum = parseFloat(priceRaw);
          if (isNaN(pNum) || pNum < 0) {
            if (colIdx.price !== -1) rowErrors[`col_${colIdx.price}`] = "Price must be a valid positive number";
            rowErrors["price"] = "Price must be a valid positive number";
          }
        }

        // Check if exists
        const cleanSlug = name ? generateSlug(name) : "";
        const matched = existingProducts.find(
          (p) =>
            (productNo && p.sku && p.sku.toLowerCase() === productNo.toLowerCase()) ||
            (cleanSlug && p.slug === cleanSlug)
        );

        const hasErrors = Object.keys(rowErrors).length > 0;
        let status: "NEW" | "UPDATE" | "ERROR" = "NEW";
        let diffNote = "New product will be added";

        if (hasErrors) {
          status = "ERROR";
          diffNote = Object.values(rowErrors).join(", ");
          errorCount++;
        } else if (matched) {
          status = "UPDATE";
          const oldPrice = ((matched.price || 0) / 100).toFixed(2);
          diffNote = `Updates existing product "${matched.name}" (Current price: ₹${oldPrice})`;
          updateCount++;
          currentParentStatus = "UPDATE";
        } else {
          status = "NEW";
          newCount++;
          currentParentStatus = "NEW";
        }

        // Track new categories
        if (categoriesRaw) {
          const cats = categoriesRaw.split(/[;,]/).map((c) => c.trim()).filter(Boolean);
          for (const c of cats) {
            if (!existingCategories.has(c.toLowerCase())) {
              discoveredNewCategories.add(c);
            }
          }
        }

        // Track new brand
        if (brandRaw && !existingBrands.has(brandRaw.toLowerCase())) {
          discoveredNewBrands.add(brandRaw);
        }

        rowStatuses.push({
          rowIdx: i,
          productNo: productNo || `p${String(totalProducts).padStart(4, "0")}`,
          itemType: "Product",
          name: name || "Untitled Product",
          status,
          diffNote,
          errors: rowErrors,
        });
      } else {
        // Variant row validation
        if (priceRaw) {
          const pNum = parseFloat(priceRaw);
          if (isNaN(pNum) || pNum < 0) {
            if (colIdx.price !== -1) rowErrors[`col_${colIdx.price}`] = "Variant Price must be a valid number";
            rowErrors["price"] = "Variant Price must be a valid number";
          }
        }

        const seenOptionNames = new Set<string>();
        for (let o = 0; o < 6; o++) {
          const { nameIdx, valIdx } = optionColIndices[o];
          const oName = getVal(nameIdx);
          const oVal = getVal(valIdx);

          if (oName) {
            const lowerName = oName.toLowerCase().trim();
            if (seenOptionNames.has(lowerName)) {
              if (nameIdx !== -1) rowErrors[`col_${nameIdx}`] = `Duplicate option name "${oName}" in row`;
            }
            seenOptionNames.add(lowerName);

            // Validate choice against parent options
            if (currentParentOptions.length > 0 && oVal) {
              const matchedParentOpt = currentParentOptions.find(
                (p) => p.name.toLowerCase().trim() === lowerName
              );

              if (!matchedParentOpt) {
                if (nameIdx !== -1) rowErrors[`col_${nameIdx}`] = `Option "${oName}" does not exist on parent product`;
              } else {
                const isValidChoice = matchedParentOpt.choices.some(
                  (c) => c.toLowerCase().trim() === oVal.toLowerCase().trim()
                );
                if (!isValidChoice) {
                  const correctParentOpt = currentParentOptions.find((p) =>
                    p.choices.some((c) => c.toLowerCase().trim() === oVal.toLowerCase().trim())
                  );
                  if (correctParentOpt) {
                    if (nameIdx !== -1) rowErrors[`col_${nameIdx}`] = `"${oVal}" belongs to "${correctParentOpt.name}", not "${oName}"!`;
                  } else {
                    if (valIdx !== -1) rowErrors[`col_${valIdx}`] = `"${oVal}" is not a valid choice for "${oName}" (Available: ${matchedParentOpt.choices.join(", ")})`;
                  }
                }
              }
            }
          }
        }

        const hasErrors = Object.keys(rowErrors).length > 0;
        const status = hasErrors ? "ERROR" : currentParentStatus;
        if (hasErrors) errorCount++;

        rowStatuses.push({
          rowIdx: i,
          productNo,
          itemType: "Variant",
          name: "",
          status,
          diffNote: hasErrors
            ? Object.values(rowErrors).join("; ")
            : `Variant linked to parent (${currentParentStatus === "UPDATE" ? "Updating" : "New"})`,
          errors: rowErrors,
        });
      }
    }

    return {
      success: true,
      headers,
      rows,
      rowStatuses,
      stats: {
        totalRows: rows.length,
        totalProducts,
        newCount,
        updateCount,
        newCategories: Array.from(discoveredNewCategories),
        newBrands: Array.from(discoveredNewBrands),
        errorCount,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to analyze import preview";
    return { success: false, error: message };
  }
}

/**
 * 3. IMPORT PRODUCTS BACKEND ENGINE (From Base64 or Direct Edited Rows)
 */
interface ImportOptions {
  fileBase64?: string;
  filename?: string;
  rawGridHeaders?: string[];
  rawGridRows?: string[][];
}

interface ParsedProductGroup {
  parentRow: Record<string, string>;
  variantRows: Record<string, string>[];
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
    let rawData: any[][] = [];

    if (options.rawGridHeaders && options.rawGridRows) {
      rawData = [options.rawGridHeaders, ...options.rawGridRows];
    } else if (options.fileBase64) {
      const buffer = Buffer.from(options.fileBase64, "base64");
      const wb = XLSX.read(buffer, { type: "buffer" });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) {
        return { success: false, error: "The uploaded spreadsheet has no sheets." };
      }
      const ws = wb.Sheets[sheetName];
      rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    } else {
      return { success: false, error: "No file content or grid data provided for import." };
    }

    if (rawData.length < 2) {
      return { success: false, error: "The uploaded file is empty or missing data rows." };
    }

    // 2. Parse Headers & Normalize Column Names
    const headerRow: string[] = rawData[0].map((h: any) => cleanVal(h).toLowerCase());

    const findColIdx = (...aliases: string[]): number => {
      for (const alias of aliases) {
        const idx = headerRow.findIndex((h) => h === alias.toLowerCase() || h.includes(alias.toLowerCase()));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    // Header index map
    const colIdx = {
      productNo: findColIdx("product no", "product_no", "handle", "slug", "sku", "id"),
      itemType: findColIdx("item type", "item_type", "type", "fieldtype"),
      name: findColIdx("name", "title", "product name"),
      description: findColIdx("description", "plaindescription", "desc"),
      brand: findColIdx("brand"),
      categories: findColIdx("categories", "categoryslugs"),
      primaryCategory: findColIdx("primary category", "primarycategoryslug"),
      ribbon: findColIdx("ribbon", "badge"),
      tags: findColIdx("tags"),
      price: findColIdx("price"),
      strikethroughPrice: findColIdx("strikethrough price", "strikethrough", "compare price", "compareatprice"),
      pricePerUnitVisible: findColIdx("price per unit visible", "showpriceperunit"),
      pricePerUnitPrice: findColIdx("price per unit price", "baseunit"),
      pricePerUnitUnit: findColIdx("price per unit unit", "baseunitmeasurement"),
      imagesUrl: findColIdx("images url", "images", "image", "media"),
      additionalInfoVisible: findColIdx("additional info sections visible"),
      visibility: findColIdx("visibility of product", "visibility", "visible"),
      productUrl: findColIdx("product url", "url"),
    };

    // Section columns indices (1 to 5)
    const sectionColIndices: Array<{ titleIdx: number; nameIdx: number }> = [];
    for (let i = 1; i <= 5; i++) {
      const titleIdx = findColIdx(`section ${i} title`, `section${i}title`, `section ${i}`);
      const nameIdx = findColIdx(`section ${i} name`, `section${i}name`, `section ${i} content`);
      sectionColIndices.push({ titleIdx, nameIdx });
    }

    // Option columns indices (1 to 6)
    const optionColIndices: Array<{ nameIdx: number; valIdx: number }> = [];
    for (let i = 1; i <= 6; i++) {
      const nameIdx = findColIdx(`option ${i} name`, `productoptionname${i}`);
      const valIdx = findColIdx(`option ${i} value`, `productoptionchoices${i}`, `productoptionchoice${i}`);
      optionColIndices.push({ nameIdx, valIdx });
    }

    // 3. Group rows into Parent Products and Child Variants
    const productGroups: ParsedProductGroup[] = [];
    let currentGroup: ParsedProductGroup | null = null;

    for (let rowIdx = 1; rowIdx < rawData.length; rowIdx++) {
      const row = rawData[rowIdx];
      if (!row || row.every((c: any) => !cleanVal(c))) continue;

      const getCol = (idx: number) => (idx !== -1 && row[idx] != null ? cleanVal(row[idx]) : "");

      const productNo = getCol(colIdx.productNo);
      const itemType = getCol(colIdx.itemType).toLowerCase();
      const name = getCol(colIdx.name);

      const isVariant =
        itemType === "variant" ||
        (productNo.includes("_") && !name) ||
        (!name && !itemType && currentGroup !== null);

      const rowMap: Record<string, string> = {
        productNo,
        itemType: isVariant ? "Variant" : "Product",
        name,
        description: getCol(colIdx.description),
        brand: getCol(colIdx.brand),
        categories: getCol(colIdx.categories),
        primaryCategory: getCol(colIdx.primaryCategory),
        ribbon: getCol(colIdx.ribbon),
        tags: getCol(colIdx.tags),
        price: getCol(colIdx.price),
        strikethroughPrice: getCol(colIdx.strikethroughPrice),
        pricePerUnitVisible: getCol(colIdx.pricePerUnitVisible),
        pricePerUnitPrice: getCol(colIdx.pricePerUnitPrice),
        pricePerUnitUnit: getCol(colIdx.pricePerUnitUnit),
        imagesUrl: getCol(colIdx.imagesUrl),
        additionalInfoVisible: getCol(colIdx.additionalInfoVisible),
        visibility: getCol(colIdx.visibility),
        productUrl: getCol(colIdx.productUrl),
      };

      // Add sections 1 to 5
      for (let i = 0; i < 5; i++) {
        const { titleIdx, nameIdx } = sectionColIndices[i];
        rowMap[`section${i + 1}Title`] = getCol(titleIdx);
        rowMap[`section${i + 1}Name`] = getCol(nameIdx);
      }

      // Add options 1 to 6
      for (let i = 0; i < 6; i++) {
        const { nameIdx, valIdx } = optionColIndices[i];
        rowMap[`option${i + 1}Name`] = getCol(nameIdx);
        rowMap[`option${i + 1}Value`] = getCol(valIdx);
      }

      if (isVariant && currentGroup) {
        currentGroup.variantRows.push(rowMap);
      } else {
        if (!name && !productNo) continue; // skip completely empty rows
        currentGroup = {
          parentRow: rowMap,
          variantRows: [],
        };
        productGroups.push(currentGroup);
      }
    }

    if (productGroups.length === 0) {
      return { success: false, error: "No valid product entries found in the file." };
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    // 4. Process each Product Group inside a Transaction
    await transaction(async (client) => {
      for (const group of productGroups) {
        const { parentRow, variantRows } = group;

        const prodNo = parentRow.productNo || ("PRD-" + Date.now().toString(36).toUpperCase());
        const prodName = parentRow.name || "Untitled Product";
        const cleanSlug = generateSlug(prodName);

        // Check if product already exists by SKU (productNo) or slug
        const existingRes = await client.query(
          `SELECT "id" FROM "Product" WHERE "sku" = $1 OR "slug" = $2 LIMIT 1`,
          [prodNo, cleanSlug]
        );

        const isUpdate = existingRes.rows.length > 0;
        const productId = isUpdate ? existingRes.rows[0].id : generateId("prd_");

        // Resolve Price
        const priceNum = parseFloat(parentRow.price) || 0;
        const priceInPaise = Math.round(priceNum * 100);

        const strikethroughNum = parseFloat(parentRow.strikethroughPrice);
        const strikethroughInPaise = !isNaN(strikethroughNum) && strikethroughNum > 0
          ? Math.round(strikethroughNum * 100)
          : null;

        // Resolve Visibility
        const isVisible = parentRow.visibility.toLowerCase() !== "false";

        // Resolve Categories
        const catNames = parentRow.categories
          ? parentRow.categories.split(/[;,]/).map((c) => c.trim()).filter(Boolean)
          : [];

        let primaryCatName = parentRow.primaryCategory || catNames[0] || "General";
        let primaryCatId: string | null = null;

        // Auto-create / resolve categories in DB
        const categoryIds: string[] = [];
        const uniqueCatNames = Array.from(new Set([primaryCatName, ...catNames]));

        for (const catName of uniqueCatNames) {
          const catSlug = generateSlug(catName);
          const catRes = await client.query(
            `INSERT INTO "Category" ("id", "name", "slug", "status", "sortOrder", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, 'active', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name"
             RETURNING "id"`,
            [generateId("cat_"), catName, catSlug]
          );
          const catId = catRes.rows[0].id;
          categoryIds.push(catId);
          if (catName.toLowerCase() === primaryCatName.toLowerCase()) {
            primaryCatId = catId;
          }
        }

        if (!primaryCatId && categoryIds.length > 0) {
          primaryCatId = categoryIds[0];
        }

        // Resolve Brand
        const brandName = parentRow.brand || null;
        if (brandName) {
          const brandSlug = generateSlug(brandName);
          await client.query(
            `INSERT INTO "Brand" ("id", "name", "slug", "status", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name"`,
            [generateId("brand_"), brandName, brandSlug]
          );
        }

        // Resolve Ribbon
        const ribbonName = parentRow.ribbon || null;
        if (ribbonName) {
          await client.query(
            `INSERT INTO "ProductRibbon" ("id", "name", "color", "createdAt")
             VALUES ($1, $2, '#3b82f6', CURRENT_TIMESTAMP)
             ON CONFLICT ("name") DO NOTHING`,
            [generateId("rib_"), ribbonName]
          );
        }

        // Resolve Price per unit
        const showPricePerUnit = parentRow.pricePerUnitVisible.toLowerCase() === "true";
        let baseUnitNum: number | null = null;
        let totalUnitsPriceNum: number | null = null;

        if (parentRow.pricePerUnitPrice) {
          const rawPricePerUnit = parentRow.pricePerUnitPrice.trim();
          if (rawPricePerUnit.includes(";")) {
            const parts = rawPricePerUnit.split(";");
            totalUnitsPriceNum = parseFloat(parts[0]?.trim()) || priceNum;
            baseUnitNum = parseFloat(parts[1]?.trim()) || 1;
          } else {
            totalUnitsPriceNum = parseFloat(rawPricePerUnit) || priceNum;
            baseUnitNum = 1;
          }
        } else if (showPricePerUnit) {
          totalUnitsPriceNum = priceNum;
          baseUnitNum = 1;
        }

        const baseUnitMeasurement = parentRow.pricePerUnitUnit?.toLowerCase() || (showPricePerUnit ? "piece" : null);

        // --- UPSERT CORE PRODUCT ---
        if (isUpdate) {
          await client.query(
            `UPDATE "Product" SET
               "name" = $1, "slug" = $2, "sku" = $3, "description" = $4, "status" = $5, "visible" = $6,
               "categoryId" = $7, "primaryCategoryId" = $8, "primaryRibbon" = $9, "brand" = $10,
               "basePrice" = $11, "price" = $12, "compareAtPrice" = $13, "strikethroughPrice" = $14,
               "showPricePerUnit" = $15, "baseUnit" = $16, "baseUnitMeasurement" = $17, "totalUnits" = $18,
               "updatedAt" = CURRENT_TIMESTAMP
             WHERE "id" = $19`,
            [
              prodName, cleanSlug, prodNo, parentRow.description || "", isVisible ? "ACTIVE" : "DRAFT", isVisible,
              primaryCatId, primaryCatId, ribbonName, brandName,
              priceInPaise, priceInPaise, strikethroughInPaise, strikethroughInPaise,
              showPricePerUnit, baseUnitNum, baseUnitMeasurement, totalUnitsPriceNum,
              productId,
            ]
          );
          updatedCount++;
        } else {
          await client.query(
            `INSERT INTO "Product" (
               "id", "name", "slug", "sku", "description", "status", "visible", "showInPos",
               "categoryId", "primaryCategoryId", "primaryRibbon", "brand",
               "basePrice", "price", "compareAtPrice", "strikethroughPrice",
               "showPricePerUnit", "baseUnit", "baseUnitMeasurement", "totalUnits",
               "createdAt", "updatedAt"
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [
              productId, prodName, cleanSlug, prodNo, parentRow.description || "", isVisible ? "ACTIVE" : "DRAFT", isVisible,
              primaryCatId, primaryCatId, ribbonName, brandName,
              priceInPaise, priceInPaise, strikethroughInPaise, strikethroughInPaise,
              showPricePerUnit, baseUnitNum, baseUnitMeasurement, totalUnitsPriceNum,
            ]
          );
          createdCount++;
        }

        // --- SYNC CATEGORIES ---
        await client.query(`DELETE FROM "ProductCategory" WHERE "productId" = $1`, [productId]);
        for (const catId of categoryIds) {
          await client.query(
            `INSERT INTO "ProductCategory" ("productId", "categoryId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [productId, catId]
          );
        }

        // --- SYNC TAGS ---
        const tagNames = parentRow.tags
          ? parentRow.tags.split(/[,;]/).map((t) => t.trim()).filter(Boolean)
          : [];
        await client.query(`DELETE FROM "ProductTagAssignment" WHERE "productId" = $1`, [productId]);
        for (const tagName of tagNames) {
          const tagRes = await client.query(
            `INSERT INTO "ProductTag" ("id", "name", "createdAt")
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT ("name") DO UPDATE SET "name" = EXCLUDED."name"
             RETURNING "id"`,
            [generateId("tag_"), tagName]
          );
          const tagId = tagRes.rows[0].id;
          await client.query(
            `INSERT INTO "ProductTagAssignment" ("productId", "tagId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [productId, tagId]
          );
        }

        // --- SYNC IMAGES ---
        const imageUrls = parentRow.imagesUrl
          ? parentRow.imagesUrl.split(/[;,]/).map((u) => u.trim()).filter(Boolean)
          : [];
        await client.query(`DELETE FROM "ProductImage" WHERE "productId" = $1`, [productId]);
        for (let imgIdx = 0; imgIdx < imageUrls.length; imgIdx++) {
          const imgUrl = imageUrls[imgIdx];
          await client.query(
            `INSERT INTO "ProductImage" ("id", "productId", "url", "alt", "isPrimary", "order", "createdAt")
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
            [generateId("med_"), productId, imgUrl, prodName, imgIdx === 0, imgIdx]
          );
        }

        // --- SYNC OPTIONS & CHOICES ---
        const optionsList: Array<{ name: string; choices: string[] }> = [];
        for (let i = 1; i <= 6; i++) {
          const optName = parentRow[`option${i}Name`];
          const optVal = parentRow[`option${i}Value`];
          if (optName && optVal) {
            const choices = optVal.split(/[;,]/).map((c) => c.trim()).filter(Boolean);
            if (choices.length > 0) {
              optionsList.push({ name: optName, choices });
            }
          }
        }

        await client.query(`DELETE FROM "ProductOption" WHERE "productId" = $1`, [productId]);
        for (let optIdx = 0; optIdx < optionsList.length; optIdx++) {
          const opt = optionsList[optIdx];
          const optId = generateId("opt_");
          const isSwatch = opt.name.toLowerCase() === "color" || opt.name.toLowerCase() === "colour";
          const fieldType = isSwatch ? "SWATCH_CHOICES" : "TEXT_CHOICES";

          await client.query(
            `INSERT INTO "ProductOption" ("id", "productId", "name", "fieldType", "sortOrder", "createdAt")
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
            [optId, productId, opt.name, fieldType, optIdx]
          );
          for (let chIdx = 0; chIdx < opt.choices.length; chIdx++) {
            const chName = opt.choices[chIdx];
            await client.query(
              `INSERT INTO "ProductOptionChoice" ("id", "optionId", "name", "sortOrder")
               VALUES ($1, $2, $3, $4)`,
              [generateId("ch_"), optId, chName, chIdx]
            );
          }
        }

        // --- SYNC VARIANTS (WITH AUTO-GENERATION FOR UNMAPPED COMBINATIONS) ---
        await client.query(`DELETE FROM "ProductVariant" WHERE "productId" = $1`, [productId]);

        if (optionsList.length > 0) {
          // 1. Cartesian product of all option choices
          const cartesian = (arrays: string[][]): string[][] => {
            return arrays.reduce<string[][]>(
              (acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
              [[]]
            );
          };

          const optionNames = optionsList.map((o) => o.name);
          const optionChoiceArrays = optionsList.map((o) => o.choices);
          const allCombinations = cartesian(optionChoiceArrays);

          // 2. Map existing CSV variant rows by normalized attributes key
          const getComboKey = (attrs: Record<string, string>) =>
            optionNames.map((name) => (attrs[name] || "").toLowerCase().trim()).join("|");

          const csvVariantsMap = new Map<string, typeof variantRows[0]>();
          for (const vRow of variantRows) {
            const vAttributes: Record<string, string> = {};
            for (let i = 1; i <= 6; i++) {
              const optName = vRow[`option${i}Name`] || (optionsList[i - 1]?.name);
              const optVal = vRow[`option${i}Value`];
              if (optName && optVal) {
                vAttributes[optName] = optVal;
              }
            }
            csvVariantsMap.set(getComboKey(vAttributes), vRow);
          }

          const findMatchingCsvRow = (currentAttrs: Record<string, string>) => {
            const exactKey = getComboKey(currentAttrs);
            if (csvVariantsMap.has(exactKey)) return csvVariantsMap.get(exactKey);

            // Partial matching for variants where some options are omitted
            for (const vRow of variantRows) {
              const vAttrs: Record<string, string> = {};
              for (let i = 1; i <= 6; i++) {
                const optName = vRow[`option${i}Name`] || (optionsList[i - 1]?.name);
                const optVal = vRow[`option${i}Value`];
                if (optName && optVal) {
                  vAttrs[optName] = optVal;
                }
              }
              if (Object.keys(vAttrs).length > 0) {
                const isMatch = Object.entries(vAttrs).every(
                  ([k, v]) => !v || (currentAttrs[k] || "").toLowerCase().trim() === v.toLowerCase().trim()
                );
                if (isMatch) return vRow;
              }
            }
            return undefined;
          };

          // 3. Insert each combination (using custom CSV override if matched, or parent product defaults)
          for (let cIdx = 0; cIdx < allCombinations.length; cIdx++) {
            const combo = allCombinations[cIdx];
            const currentAttrs: Record<string, string> = {};
            optionNames.forEach((name, i) => {
              currentAttrs[name] = combo[i];
            });

            const matchedCsvRow = findMatchingCsvRow(currentAttrs);

            let vSku: string;
            let vPricePaise: number;
            let vStrikePaise: number | null;
            let vImg: string | null = null;

            if (matchedCsvRow) {
              vSku = matchedCsvRow.productNo || `${prodNo}_${String(cIdx + 1).padStart(3, "0")}`;
              const vPriceNum = parseFloat(matchedCsvRow.price);
              vPricePaise = !isNaN(vPriceNum) && vPriceNum > 0 ? Math.round(vPriceNum * 100) : priceInPaise;
              const vStrikeNum = parseFloat(matchedCsvRow.strikethroughPrice);
              vStrikePaise = !isNaN(vStrikeNum) && vStrikeNum > 0 ? Math.round(vStrikeNum * 100) : strikethroughInPaise;
              vImg = matchedCsvRow.imagesUrl || null;
            } else {
              // Auto-generate rest variant using parent product's default values
              vSku = `${prodNo}_${String(cIdx + 1).padStart(3, "0")}`;
              vPricePaise = priceInPaise;
              vStrikePaise = strikethroughInPaise;
              vImg = null;
            }

            await client.query(
              `INSERT INTO "ProductVariant" (
                 "id", "productId", "sku", "price", "strikethroughPrice", "trackQuantity", "stockQuantity",
                 "inventoryStatus", "mediaUrl", "attributes", "createdAt", "updatedAt"
               )
               VALUES ($1, $2, $3, $4, $5, true, 100, 'IN_STOCK', $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
              [
                generateId("var_"), productId, vSku, vPricePaise, vStrikePaise,
                vImg, JSON.stringify(currentAttrs),
              ]
            );
          }
        }

        // --- SYNC INFO SECTIONS ---
        await client.query(`DELETE FROM "ProductAssignedInfoSection" WHERE "productId" = $1`, [productId]);

        const hasInfoSectionsVisible = parentRow.additionalInfoVisible.toLowerCase() !== "false";

        for (let sIdx = 1; sIdx <= 5; sIdx++) {
          const sTitle = parentRow[`section${sIdx}Title`];
          const sName = parentRow[`section${sIdx}Name`];

          if (sTitle || sName) {
            // Check if GlobalInfoSection with same title or internalName exists
            const existingSec = await client.query(
              `SELECT "id", "title", "internalName" FROM "GlobalInfoSection"
               WHERE (LOWER("title") = LOWER($1) AND $1 <> '')
                  OR (LOWER("internalName") = LOWER($1) AND $1 <> '')
                  OR (LOWER("title") = LOWER($2) AND $2 <> '')
                  OR (LOWER("internalName") = LOWER($2) AND $2 <> '')
               LIMIT 1`,
              [sTitle || "", sName || ""]
            );

            let secId: string;
            if (existingSec.rows.length > 0) {
              secId = existingSec.rows[0].id;
            } else {
              secId = generateId("sec_");
              const publicTitle = sTitle || sName || `Section ${sIdx}`;
              const internalName = sName || sTitle || `Section ${sIdx}`;
              await client.query(
                `INSERT INTO "GlobalInfoSection" ("id", "internalName", "title", "content", "sortOrder", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [secId, internalName, publicTitle, publicTitle, sIdx - 1]
              );
            }

            if (hasInfoSectionsVisible) {
              await client.query(
                `INSERT INTO "ProductAssignedInfoSection" ("productId", "sectionId", "sortOrder")
                 VALUES ($1, $2, $3)
                 ON CONFLICT ("productId", "sectionId") DO UPDATE SET "sortOrder" = $3`,
                [productId, secId, sIdx - 1]
              );
            }
          }
        }
      }
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");

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
