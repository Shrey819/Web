/**
 * Auto-generate Product Import Excel from Shree Auto Tech
 * 
 * Sources:
 * - https://www.shreeautotech.com/products?category=hiwin-ballscrew
 * - https://www.shreeautotech.com/products?category=hiwin-linear-guideways
 * 
 * Output:
 * - Images saved to: D:\Website\Product_uplode\Image\
 * - Excel file saved to: D:\Website\Product_uplode\HIWIN_Products_Import.xlsx
 */

// Allow self-signed / leaf SSL certs for scraping
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const OUTPUT_DIR = path.resolve(__dirname);
const IMAGE_DIR = path.join(OUTPUT_DIR, 'Image');
const EXCEL_FILE = path.join(OUTPUT_DIR, 'HIWIN_Products_Import.xlsx');

// Ensure Image directory exists
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

// 46-column header definition matching system import format
const HEADERS = [
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

const CATEGORIES_TO_CRAWL = [
  {
    categoryName: "Ballscrew",
    url: "https://www.shreeautotech.com/products?category=hiwin-ballscrew"
  },
  {
    categoryName: "Linear Guideway",
    url: "https://www.shreeautotech.com/products?category=hiwin-linear-guideways"
  }
];

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '') // Strip HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchWithRetry(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[Retry ${attempt}/${retries}] Fetching ${url} failed: ${err.message}. Retrying...`);
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

async function downloadImage(imageUrl, destFilename) {
  try {
    const destPath = path.join(IMAGE_DIR, destFilename);
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
      return { success: true, filename: destFilename, path: destPath, size: fs.statSync(destPath).size, cached: true };
    }
    const res = await fetchWithRetry(imageUrl);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(buffer));
    return { success: true, filename: destFilename, path: destPath, size: buffer.byteLength, cached: false };
  } catch (err) {
    console.error(`Failed to download image ${imageUrl}:`, err.message);
    return { success: false, error: err.message };
  }
}

async function scrapeCategoryProducts(categoryConfig) {
  console.log(`\n======================================================`);
  console.log(`Crawling Category: "${categoryConfig.categoryName}"`);
  console.log(`URL: ${categoryConfig.url}`);
  console.log(`======================================================`);

  const res = await fetchWithRetry(categoryConfig.url);
  const html = await res.text();

  // Find all product links
  const matches = [...html.matchAll(/href=["'](https:\/\/www\.shreeautotech\.com\/products\/[^"'?#]+|\/products\/[^"'?#]+)["']/gi)];
  const productUrls = Array.from(new Set(matches.map(m => {
    let l = m[1];
    if (l.startsWith('/')) l = 'https://www.shreeautotech.com' + l;
    return l;
  }))).filter(l => !l.includes('category='));

  console.log(`Found ${productUrls.length} products to crawl in ${categoryConfig.categoryName}.`);

  const categoryProducts = [];

  for (let i = 0; i < productUrls.length; i++) {
    const prodUrl = productUrls[i];
    console.log(`\n[${i + 1}/${productUrls.length}] Scraping: ${prodUrl}`);

    const pRes = await fetchWithRetry(prodUrl);
    const pHtml = await pRes.text();

    // 1. Product Name
    const titleMatch = pHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const name = titleMatch ? cleanText(titleMatch[1]) : '';

    // 2. Feature Description (cleaned, no <p> tags)
    const descMatch = pHtml.match(/<p class="feature-description">([\s\S]*?)<\/p>/i);
    const description = descMatch ? cleanText(descMatch[1]) : '';

    // 3. Product Image URL & Download
    const imgMatch = pHtml.match(/<img[^>]+class="[^"]*product-image[^"]*"[^>]+src="([^"]+)"/i) 
                  || pHtml.match(/<img[^>]+src="([^"]+)"[^>]+class="[^"]*product-image[^"]*"/i);
    let imageUrl = imgMatch ? imgMatch[1].trim() : '';
    if (imageUrl.startsWith('/')) imageUrl = 'https://www.shreeautotech.com' + imageUrl;

    let savedFilename = '';
    if (imageUrl) {
      const urlParts = imageUrl.split('/');
      savedFilename = urlParts[urlParts.length - 1].split('?')[0] || `product_${Date.now()}.jpg`;
      console.log(`  Downloading image: ${savedFilename}...`);
      const dlRes = await downloadImage(imageUrl, savedFilename);
      if (dlRes.success) {
        if (dlRes.cached) {
          console.log(`  Existing image verified: Image/${savedFilename} (${(dlRes.size / 1024).toFixed(1)} KB)`);
        } else {
          console.log(`  Saved image to: Image/${savedFilename} (${(dlRes.size / 1024).toFixed(1)} KB)`);
        }
      }
    }

    // 4. Custom Feature Cards (up to 6)
    const pairRegex = /<div class="feature-label">([\s\S]*?)<\/div>\s*<div class="feature-value">([\s\S]*?)<\/div>/gi;
    const featurePairs = [...pHtml.matchAll(pairRegex)].map(m => ({
      label: cleanText(m[1]),
      value: cleanText(m[2])
    }));

    // 5. Applications (Tags)
    const appRegex = /<span class="app-tag">([\s\S]*?)<\/span>/gi;
    const applications = [...pHtml.matchAll(appRegex)].map(m => cleanText(m[1])).filter(Boolean);

    // 6. Support Links (up to 6)
    const btnRegex = /<a[^>]+class="support-btn"[^>]*>([\s\S]*?)<\/a>/gi;
    const supportLinks = [...pHtml.matchAll(btnRegex)].map(b => {
      const href = b[0].match(/href="([^"]+)"/i);
      const icon = b[1].match(/<i class="([^"]+)"><\/i>/i);
      const text = b[1].match(/<span>([\s\S]*?)<\/span>/i);

      let iconType = 'specs';
      const rawIcon = icon ? icon[1].toLowerCase() : '';
      const rawText = text ? text[1].toLowerCase() : '';
      if (rawText.includes('spec') || rawIcon.includes('file')) iconType = 'specs';
      else if (rawText.includes('select') || rawIcon.includes('tools')) iconType = 'selection';
      else if (rawText.includes('calculat') || rawIcon.includes('calculator')) iconType = 'calculation';
      else if (rawText.includes('cad') || rawIcon.includes('download')) iconType = 'cad';

      return {
        title: text ? cleanText(text[1]) : '',
        url: href ? href[1].trim() : '',
        icon: iconType
      };
    }).filter(b => b.url && !b.url.startsWith('mailto:'));

    console.log(`  Extracted: "${name}" | Features: ${featurePairs.length} | Apps: ${applications.length} | Support Links: ${supportLinks.length}`);

    categoryProducts.push({
      name,
      description,
      imageUrl,
      savedFilename,
      featurePairs,
      applications,
      supportLinks,
      category: categoryConfig.categoryName
    });
  }

  return categoryProducts;
}

function buildExcelRows(products) {
  const dataRows = [];

  for (const p of products) {
    // 1) Product Name
    const name = p.name;
    // 2) Feature Description & Pricing
    const description = p.description;
    const sellingPrice = "2500";
    const originalPrice = "3000";
    // 3) Images & Video (Map downloaded image filename rather than external URL)
    const imagesUrl = p.savedFilename || (p.imageUrl ? p.imageUrl.split('/').pop().split('?')[0] : "");
    const videoUrl = "";

    // 4) Feature Cards 1 to 6
    const f1Label = p.featurePairs[0]?.label || "";
    const f1Value = p.featurePairs[0]?.value || "";
    const f2Label = p.featurePairs[1]?.label || "";
    const f2Value = p.featurePairs[1]?.value || "";
    const f3Label = p.featurePairs[2]?.label || "";
    const f3Value = p.featurePairs[2]?.value || "";
    const f4Label = p.featurePairs[3]?.label || "";
    const f4Value = p.featurePairs[3]?.value || "";
    const f5Label = p.featurePairs[4]?.label || "";
    const f5Value = p.featurePairs[4]?.value || "";
    const f6Label = p.featurePairs[5]?.label || "";
    const f6Value = p.featurePairs[5]?.value || "";

    // 5) Applications (joined by semicolon or comma)
    const applications = p.applications.join("; ");

    // 6) Brand Technical Support Links 1 to 6
    const s1Title = p.supportLinks[0]?.title || "";
    const s1Url = p.supportLinks[0]?.url || "";
    const s1Icon = p.supportLinks[0]?.icon || "";

    const s2Title = p.supportLinks[1]?.title || "";
    const s2Url = p.supportLinks[1]?.url || "";
    const s2Icon = p.supportLinks[1]?.icon || "";

    const s3Title = p.supportLinks[2]?.title || "";
    const s3Url = p.supportLinks[2]?.url || "";
    const s3Icon = p.supportLinks[2]?.icon || "";

    const s4Title = p.supportLinks[3]?.title || "";
    const s4Url = p.supportLinks[3]?.url || "";
    const s4Icon = p.supportLinks[3]?.icon || "";

    const s5Title = p.supportLinks[4]?.title || "";
    const s5Url = p.supportLinks[4]?.url || "";
    const s5Icon = p.supportLinks[4]?.icon || "";

    const s6Title = p.supportLinks[5]?.title || "";
    const s6Url = p.supportLinks[5]?.url || "";
    const s6Icon = p.supportLinks[5]?.icon || "";

    // 7) Custom Field for Buyer Note
    const enableBuyerNote = "TRUE";

    // 8) Visibility
    const visibility = "TRUE";

    // 9) Brand
    const brand = "HIWIN";

    // 10) Category
    const category = p.category;

    // 11) Product URL Slug, SEO Meta Title, SEO Meta Description, SKU, Product ID (NULL/Empty)
    const productUrlSlug = "";
    const seoMetaTitle = "";
    const seoMetaDescription = "";
    const sku = "";
    const productId = "";

    dataRows.push([
      name,
      description,
      sellingPrice,
      originalPrice,
      imagesUrl,
      videoUrl,
      f1Label,
      f1Value,
      f2Label,
      f2Value,
      f3Label,
      f3Value,
      f4Label,
      f4Value,
      f5Label,
      f5Value,
      f6Label,
      f6Value,
      applications,
      s1Title,
      s1Url,
      s1Icon,
      s2Title,
      s2Url,
      s2Icon,
      s3Title,
      s3Url,
      s3Icon,
      s4Title,
      s4Url,
      s4Icon,
      s5Title,
      s5Url,
      s5Icon,
      s6Title,
      s6Url,
      s6Icon,
      enableBuyerNote,
      visibility,
      brand,
      category,
      productUrlSlug,
      seoMetaTitle,
      seoMetaDescription,
      sku,
      productId,
    ]);
  }

  return dataRows;
}

async function main() {
  console.log("Starting Auto-Scrape & Excel Generator...");
  console.log(`Target Directory: ${OUTPUT_DIR}`);
  console.log(`Image Directory:  ${IMAGE_DIR}`);
  console.log(`Excel Output:     ${EXCEL_FILE}\n`);

  const allProducts = [];

  for (const cat of CATEGORIES_TO_CRAWL) {
    const products = await scrapeCategoryProducts(cat);
    allProducts.push(...products);
  }

  console.log(`\n------------------------------------------------------`);
  console.log(`Scraping complete. Total products collected: ${allProducts.length}`);
  console.log(`Building Excel worksheet...`);

  const rows = buildExcelRows(allProducts);
  const worksheetData = [HEADERS, ...rows];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths for readability
  const colWidths = HEADERS.map((header) => {
    if (header.includes("Description")) return { wch: 40 };
    if (header.includes("Name") || header.includes("URL")) return { wch: 30 };
    if (header.includes("Applications")) return { wch: 35 };
    if (header.includes("Label") || header.includes("Title")) return { wch: 24 };
    return { wch: Math.max(header.length + 4, 15) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Products");

  XLSX.writeFile(wb, EXCEL_FILE);
  console.log(`\n🎉 SUCCESS! Excel file saved successfully:`);
  console.log(`📁 ${EXCEL_FILE}`);

  // Also output a CSV copy for convenience
  const csvFile = path.join(OUTPUT_DIR, 'HIWIN_Products_Import.csv');
  const csvContent = XLSX.utils.sheet_to_csv(ws);
  fs.writeFileSync(csvFile, csvContent, 'utf-8');
  console.log(`📁 CSV backup saved to: ${csvFile}`);
}

main().catch((err) => {
  console.error("Fatal Error running scraper:", err);
  process.exit(1);
});
