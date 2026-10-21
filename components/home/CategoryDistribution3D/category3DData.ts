import { Product } from "@/types";
import { StorefrontCategory } from "@/lib/storefront";

export interface ResolvedCategory3D {
  id: string;
  name: string;
  slug: string;
  description: string;
  itemCount: number;
  badge: string;
  accentColor: string;
  image: string;
  products: Product[];
}

export const FALLBACK_CATEGORY_IMAGES: Record<string, string> = {
  ballscrew: "/cinematic-products/linear-guide-rail.png",
  ballscrews: "/cinematic-products/linear-guide-rail.png",
  "linear-guideway": "/cinematic-products/linear-guide-rail.png",
  "linear-guideways": "/cinematic-products/linear-guide-rail.png",
  actuators: "/cinematic-products/spindle-servo-actuator.png",
  sensors: "/cinematic-products/round-gauge.webp",
  plcs: "/cinematic-products/spindle-servo-actuator.png",
  drives: "/cinematic-products/spindle-servo-actuator.png",
  default: "/cinematic-products/carbide-cutter-endmill.png",
};

export const DEFAULT_CATEGORY_METADATA: Record<
  string,
  { badge: string; description: string; accentColor: string; defaultImage: string }
> = {
  ballscrew: {
    badge: "Zero Backlash C5/C7",
    description: "High-thrust ground & rolled ballscrews engineered for dynamic CNC axes.",
    accentColor: "from-sky-500/20 to-blue-600/5",
    defaultImage: "/cinematic-products/linear-guide-rail.png",
  },
  ballscrews: {
    badge: "Zero Backlash C5/C7",
    description: "High-thrust ground & rolled ballscrews engineered for dynamic CNC axes.",
    accentColor: "from-sky-500/20 to-blue-600/5",
    defaultImage: "/cinematic-products/linear-guide-rail.png",
  },
  "linear-guideway": {
    badge: "Class P Precision",
    description: "Heavy-duty guideways, runner carriages, and dust-resistant scrapers.",
    accentColor: "from-blue-500/20 to-indigo-600/5",
    defaultImage: "/cinematic-products/linear-guide-rail.png",
  },
  "linear-guideways": {
    badge: "Class P Precision",
    description: "Heavy-duty guideways, runner carriages, and dust-resistant scrapers.",
    accentColor: "from-blue-500/20 to-indigo-600/5",
    defaultImage: "/cinematic-products/linear-guide-rail.png",
  },
  actuators: {
    badge: "High-Repeatability",
    description: "Motorized linear cylinders and multi-axis Cartesian automation stages.",
    accentColor: "from-amber-500/20 to-orange-600/5",
    defaultImage: "/cinematic-products/spindle-servo-actuator.png",
  },
  sensors: {
    badge: "Sub-Millisecond Response",
    description: "Inductive proximity, laser distance, and optical displacement sensors.",
    accentColor: "from-emerald-500/20 to-teal-600/5",
    defaultImage: "/cinematic-products/round-gauge.webp",
  },
  plcs: {
    badge: "Real-Time Fieldbus",
    description: "Micro-PLCs, high-speed motion CPUs, and modular remote I/O nodes.",
    accentColor: "from-violet-500/20 to-purple-600/5",
    defaultImage: "/cinematic-products/spindle-servo-actuator.png",
  },
  drives: {
    badge: "High-Torque Density",
    description: "Vector VFD inverters, AC brushless servo motors, and planetary reducers.",
    accentColor: "from-cyan-500/20 to-sky-600/5",
    defaultImage: "/cinematic-products/spindle-servo-actuator.png",
  },
};

/**
 * Resolves raw database categories and active products into normalized 3D category records.
 * Synchronized with the Header MegaMenu Shop popup.
 */
export function resolve3DCategories(
  dbCategories: StorefrontCategory[],
  dbProducts: Product[]
): ResolvedCategory3D[] {
  const sourceCategories =
    dbCategories && dbCategories.length > 0
      ? dbCategories
      : [
          { id: "linear-guideway", name: "Linear Guideway", slug: "linear-guideway", itemCount: 27 },
          { id: "ballscrew", name: "Ballscrew", slug: "ballscrew", itemCount: 19 },
          { id: "actuators", name: "Actuators", slug: "actuators", itemCount: 2 },
        ];

  // Index active products by category ID, slug, and subcategory
  const productsByCatKey = new Map<string, Product[]>();
  dbProducts.forEach((p) => {
    const keys = new Set<string>();
    if (p.categoryId) keys.add(p.categoryId.toLowerCase());
    if (p.subcategoryId) keys.add(p.subcategoryId.toLowerCase());
    if (Array.isArray(p.categoryIds)) {
      p.categoryIds.forEach((k) => k && keys.add(k.toLowerCase()));
    }

    keys.forEach((k) => {
      if (!productsByCatKey.has(k)) productsByCatKey.set(k, []);
      productsByCatKey.get(k)!.push(p);
    });
  });

  // Track canonical slugs to eliminate duplicate singular/plural categories (e.g. ballscrew vs ballscrews)
  const seenCanonical = new Set<string>();
  const resolved: ResolvedCategory3D[] = [];

  // Sort categories by itemCount descending so high-product categories come first
  const sortedCategories = [...sourceCategories].sort((a, b) => {
    return Number(b.itemCount || 0) - Number(a.itemCount || 0);
  });

  for (const cat of sortedCategories) {
    const rawSlug = (cat.slug || cat.id || "").toLowerCase();
    const canonicalKey = rawSlug.replace(/s$/, "");

    if (seenCanonical.has(canonicalKey)) {
      continue; // Skip duplicate plural category if singular already exists
    }

    // Match products across ID, slug, and normalized canonical key
    const matched = [
      ...(productsByCatKey.get(cat.id.toLowerCase()) || []),
      ...(productsByCatKey.get(cat.slug.toLowerCase()) || []),
      ...(productsByCatKey.get(canonicalKey) || []),
      ...(productsByCatKey.get(canonicalKey + "s") || []),
    ];

    // Deduplicate matched products by ID
    const uniqueProducts = Array.from(
      new Map(matched.map((p) => [p.id, p])).values()
    );

    // If category has products, or is a valid database category, include it
    if (uniqueProducts.length > 0 || Number(cat.itemCount || 0) > 0) {
      seenCanonical.add(canonicalKey);

      const slugKey = (cat.slug || cat.id || "").toLowerCase();
      const meta =
        DEFAULT_CATEGORY_METADATA[slugKey] ||
        DEFAULT_CATEGORY_METADATA[canonicalKey] || {
          badge: "Industrial Grade",
          description: "High-tolerance precision components engineered for reliable plant uptime.",
          accentColor: "from-sky-500/20 to-blue-600/5",
          defaultImage: FALLBACK_CATEGORY_IMAGES[slugKey] || FALLBACK_CATEGORY_IMAGES.default,
        };

      // Determine category hero image:
      // First product image with valid url if available, else meta default image
      const firstProductImg = uniqueProducts[0]?.images?.[0]?.url;
      const categoryImage = firstProductImg || meta.defaultImage;

      resolved.push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug || cat.id,
        description: meta.description,
        itemCount: uniqueProducts.length || Number(cat.itemCount || 0),
        badge: meta.badge,
        accentColor: meta.accentColor,
        image: categoryImage,
        products: uniqueProducts,
      });
    }
  }

  return resolved.length > 0
    ? resolved
    : [
        {
          id: "linear-guideway",
          name: "Linear Guideway",
          slug: "linear-guideway",
          description: "Heavy-duty guideways, runner carriages, and dust-resistant scrapers.",
          itemCount: dbProducts.length,
          badge: "Class P Precision",
          accentColor: "from-blue-500/20 to-indigo-600/5",
          image: dbProducts[0]?.images?.[0]?.url || FALLBACK_CATEGORY_IMAGES["linear-guideway"],
          products: dbProducts.slice(0, 8),
        },
      ];
}
