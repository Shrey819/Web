import fs from 'fs';
import path from 'path';

// --- Deterministic RNG ---
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(1234567);

function randomInt(min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function randomBoolean(chance = 0.5) {
  return rng() < chance;
}

// --- Data Blueprints ---
const BRANDS = ["Sandvik", "Kennametal", "Iscar", "Mitsubishi", "OSG", "Guhring", "Siemens", "Omron", "Schneider", "ABB", "Allen-Bradley", "Keyence", "SICK"];

const CATEGORIES = [
  {
    id: "carbide-inserts", name: "Carbide Inserts",
    subcategories: [
      { id: "turning-inserts", name: "Turning Inserts" },
      { id: "milling-inserts", name: "Milling Inserts" },
      { id: "threading-inserts", name: "Threading Inserts" },
      { id: "grooving-inserts", name: "Grooving Inserts" }
    ]
  },
  {
    id: "machine-tools", name: "Machine Tools & Accessories",
    subcategories: [
      { id: "er-collets", name: "ER Collets" },
      { id: "tool-holders", name: "Tool Holders" },
      { id: "drill-chucks", name: "Drill Chucks" }
    ]
  },
  {
    id: "carbide-cutters", name: "Carbide Cutters",
    subcategories: [
      { id: "ball-nose", name: "Ball Nose End Mills" },
      { id: "flat-end", name: "Flat End Mills" },
      { id: "roughing", name: "Roughing End Mills" }
    ]
  },
  {
    id: "drills", name: "Drills",
    subcategories: [
      { id: "u-drills", name: "U Drills" },
      { id: "carbide-drills", name: "Carbide Drills" }
    ]
  },
  {
    id: "automation", name: "Automation & Control",
    subcategories: [
      { id: "sensors", name: "Sensors" },
      { id: "plcs", name: "PLCs & Controllers" },
      { id: "drives", name: "Drives & Motors" }
    ]
  }
];

const ADJECTIVES = ["High-Performance", "Precision", "Heavy-Duty", "Premium", "Ultra-Hard", "Industrial", "Advanced", "Rugged"];
const GENERATED_SKUS = new Set<string>();

// --- Generation Logic ---
function generateProduct(index: number) {
  const category = randomItem(CATEGORIES);
  const subcategory = randomItem(category.subcategories);
  const brand = randomItem(BRANDS);
  
  // Guarantee unique SKU
  let sku = "";
  do {
    sku = `${brand.substring(0, 3).toUpperCase()}-${randomInt(10000, 99999)}-${randomItem(["A", "B", "C", "X", "Z"])}`;
  } while (GENERATED_SKUS.has(sku));
  GENERATED_SKUS.add(sku);

  const adjective = randomItem(ADJECTIVES);
  const name = `${brand} ${adjective} ${subcategory.name} - ${sku}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  const basePrice = randomInt(500, 50000);
  const hasDiscount = randomBoolean(0.3);
  const compareAtPrice = hasDiscount ? Math.floor(basePrice * (1 + (randomInt(10, 40) / 100))) : undefined;

  const hasVariants = randomBoolean(0.4);
  const variants: Array<Record<string, unknown>> = [];
  
  if (hasVariants) {
    const packSizes = [1, 10, 50];
    packSizes.forEach(size => {
      variants.push({
        id: `${sku}-V${size}`,
        sku: `${sku}-${size}PK`,
        name: `Pack of ${size}`,
        attributes: { "Pack Size": size.toString() },
        price: basePrice * size * (size > 1 ? 0.9 : 1), // 10% volume discount
        compareAtPrice: hasDiscount ? compareAtPrice! * size : undefined,
        stockQuantity: randomInt(0, 500)
      });
    });
  }

  return {
    id: `prod-${index}-${Date.now().toString(36)}`, // stable per run
    slug,
    sku,
    name,
    shortName: `${brand} ${subcategory.name}`,
    brand,
    manufacturer: brand,
    categoryId: category.id,
    subcategoryId: subcategory.id,
    productFamily: `${brand} Pro Series`,
    
    description: `The ${name} represents the pinnacle of industrial engineering in the ${category.name} category. Designed by ${brand} for exceptional durability and precision under the most demanding manufacturing conditions. Features state-of-the-art materials and strict quality control tolerances.`,
    shortDescription: `${adjective} ${subcategory.name} engineered for superior performance and extended tool life in industrial applications.`,
    
    images: [
      { url: `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#f1f5f9"/><text x="50%" y="50%" font-family="monospace" font-size="20" fill="#64748b" text-anchor="middle" dominant-baseline="middle">${sku}</text></svg>`).toString('base64')}`, alt: name, isPrimary: true }
    ],

    basePrice,
    compareAtPrice,
    gstRate: 18,
    priceIncludesTax: false,

    stockStatus: randomBoolean(0.8) ? "in-stock" : "low-stock",
    stockQuantity: randomInt(10, 1000),
    minimumOrderQuantity: 1,
    maximumOrderQuantity: 1000,

    unit: "piece",
    packSize: 1,
    unitLabel: "/ piece",

    hasVariants,
    variants,

    specifications: [
      {
        groupName: "General Specs",
        attributes: [
          { label: "Material", value: "Tungsten Carbide / High-Grade Steel" },
          { label: "Coating", value: randomItem(["TiAlN", "TiN", "Uncoated", "DLC"]) },
          { label: "Tolerance", value: "±0.005mm" }
        ]
      }
    ],
    applications: [
      "CNC Machining",
      "Heavy Manufacturing",
      "Aerospace Components"
    ],
    features: [
      "High thermal resistance",
      "Optimized chip evacuation",
      "Extended lifespan under high feed rates"
    ],

    rating: Number((rng() * 2 + 3).toFixed(1)), // 3.0 to 5.0
    reviewCount: randomInt(0, 150),

    badges: hasDiscount ? ["Sale"] : (randomBoolean(0.1) ? ["New Arrival"] : []),
    
    shippingWeight: randomInt(100, 5000), // grams

    featured: randomBoolean(0.05),
    bestSeller: randomBoolean(0.1),
    newArrival: randomBoolean(0.1),
    createdAt: new Date().toISOString()
  };
}

function run() {
  console.log("Generating products...");
  const TOTAL_PRODUCTS = 1500;
  const CURATED_COUNT = 60;
  
  const allProducts = [];
  
  for (let i = 1; i <= TOTAL_PRODUCTS; i++) {
    allProducts.push(generateProduct(i));
  }

  // Pick first 60 for curated (they are seeded, so always the same 60)
  const curatedProducts = allProducts.slice(0, CURATED_COUNT);

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(path.join(dataDir, 'catalog-full.json'), JSON.stringify(allProducts, null, 2));
  fs.writeFileSync(path.join(dataDir, 'catalog-curated.json'), JSON.stringify(curatedProducts, null, 2));

  console.log(`Successfully generated ${TOTAL_PRODUCTS} products.`);
  console.log(`Saved to data/catalog-full.json and data/catalog-curated.json`);
}

run();
