export interface BrandMetadata {
  name: string;
  slug: string;
  country: string;
  category: "Linear Motion" | "Gearboxes & Reducers" | "Mechanical Transmission" | "Drives & Motors" | "Sensors & Controls";
  tagline: string;
  description: string;
  websiteUrl: string;
  accentColor: string;
  isPopular?: boolean;
}

export const KNOWN_BRANDS_METADATA: Record<string, BrandMetadata> = {
  hiwin: {
    name: "HIWIN",
    slug: "hiwin",
    country: "Taiwan",
    category: "Linear Motion",
    tagline: "Linear guideways, ballscrews & industrial motion systems",
    description: "Global leader in high-precision linear motion components, self-lubricating ballscrews, and multi-axis positioning systems.",
    websiteUrl: "https://www.hiwin.tw",
    accentColor: "#00a651",
    isPopular: true,
  },
  "miki-pulley": {
    name: "Miki Pulley",
    slug: "miki-pulley",
    country: "Japan",
    category: "Mechanical Transmission",
    tagline: "Flexible couplings, electromagnetic clutches, brakes & speed changers",
    description: "World-class Japanese transmission engineering specializing in servoflex couplings, shaft locks, and electromagnetic motion brakes.",
    websiteUrl: "https://www.mikipulley.co.jp/en/",
    accentColor: "#0284c7",
    isPopular: true,
  },
  liming: {
    name: "Liming",
    slug: "liming",
    country: "Taiwan",
    category: "Gearboxes & Reducers",
    tagline: "High-precision planetary gearboxes & hypoid reducers",
    description: "Industry-standard precision planetary servo gearheads, helical hypoid reducers, and high-torque speed reducers for automation.",
    websiteUrl: "https://www.liming.com.tw",
    accentColor: "#dc2626",
    isPopular: true,
  },
  kh: {
    name: "K.H",
    slug: "kh",
    country: "Taiwan",
    category: "Mechanical Transmission",
    tagline: "Kai He precision helical & spur gear racks and pinions",
    description: "Premier manufacturer of ground hardened precision helical gear racks, spur racks, and mating pinions for CNC and automation gantries.",
    websiteUrl: "https://www.kh-rack.com",
    accentColor: "#b91c1c",
    isPopular: true,
  },
  stober: {
    name: "STÖBER",
    slug: "stober",
    country: "Germany",
    category: "Gearboxes & Reducers",
    tagline: "Precision servo gear units, helical bevel reducers & drive electronics",
    description: "Ultra-low backlash German engineered planetary gearboxes, geared motors, and synchronized multi-axis servo drives.",
    websiteUrl: "https://www.stoeber.de/en/",
    accentColor: "#0284c7",
    isPopular: true,
  },
  atlanta: {
    name: "Atlanta",
    slug: "atlanta",
    country: "Germany",
    category: "Mechanical Transmission",
    tagline: "High precision rack & pinion drive systems and servo gearboxes",
    description: "Complete engineered rack & pinion motion systems, servo worm gearboxes, and automated lubrication cartridges.",
    websiteUrl: "https://www.atlantadrives.com",
    accentColor: "#1e293b",
    isPopular: true,
  },
  "elesa-ganter": {
    name: "E+G",
    slug: "elesa-ganter",
    country: "Italy & Germany",
    category: "Mechanical Transmission",
    tagline: "Standard machine elements, clamping knobs, handles & leveling elements",
    description: "The gold standard joint venture offering over 60,000 standard elements for machine construction, handles, knobs, and hinges.",
    websiteUrl: "https://www.elesa-ganter.com",
    accentColor: "#e11d48",
    isPopular: true,
  },
  aadarsh: {
    name: "Aadarsh",
    slug: "aadarsh",
    country: "India",
    category: "Mechanical Transmission",
    tagline: "ADDPower industrial power transmission, timing belts & pulleys",
    description: "Durable power transmission timing belts, pulleys, V-belts, and industrial mechanical drives manufactured to heavy standards.",
    websiteUrl: "https://www.shreeautotech.com/brands",
    accentColor: "#ea580c",
    isPopular: true,
  },
  thk: {
    name: "THK",
    slug: "thk",
    country: "Japan",
    category: "Linear Motion",
    tagline: "Pioneers of Linear Motion (LM) guides and ball splines",
    description: "Pioneered the world's first LM Guide mechanism; trusted globally for sub-micron precision linear motion and ball splines.",
    websiteUrl: "https://www.thk.com",
    accentColor: "#dc2626",
    isPopular: true,
  },
  "bosch-rexroth": {
    name: "Bosch Rexroth",
    slug: "bosch-rexroth",
    country: "Germany",
    category: "Linear Motion",
    tagline: "Linear motion technology, industrial hydraulics & factory automation",
    description: "German motion pioneer delivering cam roller guides, linear bushings, compact modules, and smart mechatronic assemblies.",
    websiteUrl: "https://www.boschrexroth.com",
    accentColor: "#0284c7",
    isPopular: true,
  },
  siemens: {
    name: "Siemens",
    slug: "siemens",
    country: "Germany",
    category: "Sensors & Controls",
    tagline: "SIMATIC PLCs, SINAMICS drives & automation hardware",
    description: "Global automation powerhouse driving Industry 4.0 with SIMATIC S7 controllers, TIA Portal architectures, and scalable motor drives.",
    websiteUrl: "https://www.siemens.com",
    accentColor: "#0f766e",
    isPopular: true,
  },
  "schneider-electric": {
    name: "Schneider Electric",
    slug: "schneider-electric",
    country: "France",
    category: "Sensors & Controls",
    tagline: "Modicon PLCs, Altivar VFDs, power management & controlgear",
    description: "EcoStruxure automation platform, TeSys contactors, Altivar variable frequency drives, and smart factory energy monitoring.",
    websiteUrl: "https://www.se.com",
    accentColor: "#16a34a",
    isPopular: true,
  },
  delta: {
    name: "Delta Electronics",
    slug: "delta",
    country: "Taiwan",
    category: "Drives & Motors",
    tagline: "Industrial automation drives, servos, HMIs & power electronics",
    description: "High-efficiency AC motor drives, high-response AC servos, DOP human machine interfaces, and smart industrial automation power.",
    websiteUrl: "https://www.deltaww.com",
    accentColor: "#0284c7",
    isPopular: true,
  },
  omron: {
    name: "Omron",
    slug: "omron",
    country: "Japan",
    category: "Sensors & Controls",
    tagline: "Industrial sensing, machine safety, PLCs & relays",
    description: "Industrial photoelectric, proximity and fiber sensors, safety light curtains, Sysmac controllers, and high-durability relays.",
    websiteUrl: "https://www.ia.omron.com",
    accentColor: "#1d4ed8",
    isPopular: true,
  },
  abb: {
    name: "ABB",
    slug: "abb",
    country: "Switzerland",
    category: "Drives & Motors",
    tagline: "Industrial robotics, motion drives & low voltage electrical hardware",
    description: "Benchmark Swiss-Swedish technology delivering ACS variable speed drives, synchronized electric motors, and heavy factory power.",
    websiteUrl: "https://www.abb.com",
    accentColor: "#e11d48",
    isPopular: true,
  },
  nsk: {
    name: "NSK",
    slug: "nsk",
    country: "Japan",
    category: "Linear Motion",
    tagline: "Super-precision ball bearings, ball screws & linear guides",
    description: "Over a century of Japanese motion excellence in ultra-precision machine tool bearings, linear guides, and ground ballscrews.",
    websiteUrl: "https://www.nsk.com",
    accentColor: "#dc2626",
    isPopular: true,
  },
};

/**
 * Returns metadata for a brand name or slug with fallback
 */
export function getBrandMetadata(nameOrSlug: string): BrandMetadata {
  if (!nameOrSlug) {
    return {
      name: "Industrial Automation",
      slug: "industrial",
      country: "Global",
      category: "Linear Motion",
      tagline: "Precision automation components",
      description: "OEM verified industrial hardware manufactured to international engineering standards.",
      websiteUrl: "/products",
      accentColor: "#00a651",
    };
  }

  const clean = nameOrSlug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  
  if (KNOWN_BRANDS_METADATA[clean]) {
    return KNOWN_BRANDS_METADATA[clean];
  }

  // Check by name search
  for (const key of Object.keys(KNOWN_BRANDS_METADATA)) {
    const item = KNOWN_BRANDS_METADATA[key];
    if (item.name.toLowerCase() === nameOrSlug.toLowerCase().trim()) {
      return item;
    }
  }

  return {
    name: nameOrSlug,
    slug: clean || "brand",
    country: "Global",
    category: "Linear Motion",
    tagline: "Precision industrial automation components",
    description: "High-grade industrial automation components engineered for durability, precision, and reliable plant floor uptime.",
    websiteUrl: `/products?brand=${encodeURIComponent(nameOrSlug)}`,
    accentColor: "#00a651",
  };
}
