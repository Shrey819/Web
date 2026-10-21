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
 */
export function resolve3DCategories(
  dbCategories: StorefrontCategory[],
  dbProducts: Product[]
): ResolvedCategory3D[] {
  // If db has categories, use them; otherwise use standard defaults
  const categoriesToUse =
    dbCategories && dbCategories.length > 0
      ? dbCategories
      : [
          { id: "ballscrew", name: "Ballscrews & Ball Nuts", slug: "ballscrew", itemCount: 16 },
          { id: "linear-guideway", name: "Linear Guideways & Rails", slug: "linear-guideway", itemCount: 25 },
          { id: "actuators", name: "Industrial Actuators", slug: "actuators", itemCount: 12 },
        ];

  return categoriesToUse.map((cat, idx) => {
    const slugKey = (cat.slug || cat.id || "").toLowerCase();
    const meta = DEFAULT_CATEGORY_METADATA[slugKey] || {
      badge: "Industrial Grade",
      description: "High-tolerance precision components engineered for reliable plant uptime.",
      accentColor: "from-sky-500/20 to-blue-600/5",
      defaultImage: FALLBACK_CATEGORY_IMAGES[slugKey] || FALLBACK_CATEGORY_IMAGES.default,
    };

    // Filter matching active products
    const matchedProducts = dbProducts.filter((p) => {
      return (
        p.categoryId === cat.id ||
        p.categoryId === cat.slug ||
        p.categoryIds?.includes(cat.id) ||
        p.categoryIds?.includes(cat.slug)
      );
    });

    // Determine category image:
    // 1. First product image with valid url if available
    // 2. Otherwise category meta default cutout image
    const firstProductImg = matchedProducts[0]?.images?.[0]?.url;
    const categoryImage = firstProductImg || meta.defaultImage;

    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug || cat.id,
      description: meta.description,
      itemCount: cat.itemCount || matchedProducts.length,
      badge: meta.badge,
      accentColor: meta.accentColor,
      image: categoryImage,
      products: matchedProducts,
    };
  });
}
