export interface HeroSlide {
  id: string;
  desktopImage: string;
  mobileImage: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CategoryShowcaseConfig {
  id: string;
  categoryId: string; // matches Category.id or Category.slug
  eyebrow?: string;
  customTitle?: string;
  viewAllText?: string;
  viewAllUrl?: string;
  bannerBadge?: string;
  bannerTitle?: string;
  bannerDescription?: string;
  heroImage?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface MainframeHeroConfig {
  eyebrow: string;
  subheading?: string;
  headline: string;
  videoUrl: string;
  ctaText: string;
  ctaUrl: string;
  salesEmailText?: string;
  salesEmail?: string;
  navPills: Array<{ label: string; url: string }>;
}

export interface PromoBannerConfig {
  badge: string;
  title: string;
  description: string;
  primaryCtaText: string;
  primaryCtaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
  image: string;
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
  detail: string;
}

export interface WhyBuyItem {
  id: string;
  title: string;
  description: string;
}

export interface StickyShowcaseConfig {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  ctaText: string;
  ctaUrl: string;
  image: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  rating: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface BrandItem {
  id: string;
  name: string;
  country?: string;
  url?: string;
}

export interface BrandMarqueeConfig {
  eyebrow: string;
  note: string;
  isActive: boolean;
  brands: BrandItem[];
}

export interface HeaderConfig {
  supportPhone: string;
  supportEmail: string;
  announcementUrl: string;
  navLinks: Array<{ label: string; url: string }>;
}

export interface FooterConfig {
  catalogBadge: string;
  catalogTitle: string;
  catalogDesc: string;
  catalogCtaText: string;
  catalogCtaUrl: string;
  usefulLinks: Array<{ label: string; url: string }>;
  helpLinks: Array<{ label: string; url: string }>;
  facebookUrl: string;
  instagramUrl: string;
  whatsappNumber: string;
  youtubeUrl: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  addressLine1: string;
  addressLine2: string;
  copyrightText: string;
}

export interface OrbitStageProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  subtitle: string;
  price: string;
  specs: Array<{ label: string; value: string }>;
  image?: string;
}

export interface OrbitStageConfig {
  eyebrow: string;
  title: string;
  subtitle: string;
  products?: OrbitStageProduct[];
}

export interface CategoryGridItem {
  id: string;
  slug: string;
  name: string;
  badge: string;
  description: string;
  itemCount: number;
  subcategories: string[];
  accentColor?: string;
}

export interface CategoryGridConfig {
  eyebrow: string;
  title: string;
  subtitle: string;
  categories: CategoryGridItem[];
}

export interface FeaturedCatalogConfig {
  eyebrow: string;
  title: string;
  allTabLabel: string;
  sensorsTabLabel: string;
  plcsTabLabel: string;
  motorsTabLabel: string;
}

export interface BOMItemConfig {
  partNo: string;
  name: string;
  category: string;
  specs: string;
  manufacturer: string;
}

export interface VerticalConfig {
  id: string;
  title: string;
  description: string;
  stats: string;
  color?: string;
  categorySlug: string;
  categoryName: string;
  bom: BOMItemConfig[];
}

export interface SolutionsShowcaseConfig {
  eyebrow: string;
  title: string;
  subtitle: string;
  verticals: VerticalConfig[];
}

export interface AssemblyStepConfig {
  id: string;
  title: string;
  description: string;
  tag: string;
}

export interface AssemblySequenceConfig {
  eyebrow: string;
  title: string;
  subtitle: string;
  steps: AssemblyStepConfig[];
}

export interface BestSellersConfig {
  eyebrow: string;
  title: string;
}

export interface SpecCompareRowConfig {
  parameter: string;
  sensorVal: string;
  plcVal: string;
  driveVal: string;
}

export interface SpecCompareConfig {
  eyebrow: string;
  title: string;
  ctaText: string;
  ctaUrl: string;
  rows: SpecCompareRowConfig[];
}

export interface ResourceArticleConfig {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  author: string;
  readTime: string;
}

export interface ResourceHubConfig {
  eyebrow: string;
  title: string;
  ctaText: string;
  ctaUrl: string;
  articles: ResourceArticleConfig[];
}

export interface HomepageData {
  promoTicker: string;
  promoTickerUrl?: string;
  promoTickerActive?: boolean;
  mainframeHero: MainframeHeroConfig;
  heroSlides: HeroSlide[];
  categoryShowcases: CategoryShowcaseConfig[];
  stickyShowcase: StickyShowcaseConfig;
  brandMarquee?: BrandMarqueeConfig;
  promoBanner: PromoBannerConfig;
  stats: StatItem[];
  whyBuyFromUs: WhyBuyItem[];
  whyBuy?: WhyBuyItem[];
  whyBuyEyebrow?: string;
  whyBuyTitle?: string;
  testimonials: TestimonialItem[];
  testimonialsEyebrow?: string;
  testimonialsTitle?: string;
  faqs: FaqItem[];
  faqsEyebrow?: string;
  faqsTitle?: string;
  headerConfig: HeaderConfig;
  footerConfig: FooterConfig;
  orbitStage?: OrbitStageConfig;
  categoryGrid?: CategoryGridConfig;
  featuredCatalog?: FeaturedCatalogConfig;
  solutionsShowcase?: SolutionsShowcaseConfig;
  assemblySequence?: AssemblySequenceConfig;
  bestSellers?: BestSellersConfig;
  specCompare?: SpecCompareConfig;
  resourceHub?: ResourceHubConfig;
  sectionOrder?: string[];
  hiddenSectionIds?: string[];
  sectionInstances?: Record<string, any>;
}

export const DEFAULT_SECTION_ORDER: string[] = [
  "sec-ticker",
  "sec-header",
  "sec-mainframe",
  "sec-slider",
  "sec-showcases",
  "sec-brand-marquee",
  "sec-cinematic",
  "sec-categories-grid",
  "sec-featured-catalog",
  "sec-solutions",
  "sec-assembly",
  "sec-why-buy",
  "sec-sticky-showcase",
  "sec-best-sellers",
  "sec-stats",
  "sec-promo-banner",
  "sec-testimonials",
  "sec-compare",
  "sec-resource-hub",
  "sec-faqs",
  "sec-footer-config",
];

export const getBaseSectionId = (id: string): string => {
  if (!id) return "";
  return id.replace(/-copy(-\d+)?$/, "").replace(/_\d+$/, "");
};

export const DEFAULT_PROMO_TICKER =
  "🎁 BUY ANY 2 PRODUCTS & GET 1 PREMIUM GOGGLE FREE • FREE SHIPPING • CASH ON DELIVERY • SHOP NOW";

export const DEFAULT_MAINFRAME_HERO: MainframeHeroConfig = {
  eyebrow: "INDUSTRIAL AUTOMATION SYSTEM",
  subheading: "High-Precision Sensors, PLCs & Factory Drives",
  headline:
    "Engineered for 99.9% industrial uptime. Factory-certified OEM components with same-day B2B dispatch. What system are we powering today?",
  videoUrl: "/videos/Character_horizontal_eye_scan.mp4",
  ctaText: "Request Instant Quote",
  ctaUrl: "/quote",
  salesEmailText: "Reach Sales:",
  salesEmail: "omautomation2012@gmail.com",
  navPills: [
    { label: "Sensors & Perception", url: "/category/sensors" },
    { label: "Ballscrew", url: "/products" },
    { label: "Linear Guideway", url: "/products" },
    { label: "Instant RFQ Portal", url: "/quote" },
  ],
};

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    desktopImage:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1600&auto=format&fit=crop&q=80",
    mobileImage:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
    title: "NEXT-GEN INDUSTRIAL AUTOMATION",
    subtitle: "Precision PLCs, VFDs & Sensors with Same-Day Dispatch",
    ctaText: "Explore Catalog",
    ctaUrl: "/products",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "slide-2",
    desktopImage:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&auto=format&fit=crop&q=80",
    mobileImage:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80",
    title: "SMART FACTORY CONTROL HARDWARE",
    subtitle: "Certified Heavy-Duty OEM Components for Industrial Operations",
    ctaText: "Request a Quote",
    ctaUrl: "/quote",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "slide-3",
    desktopImage:
      "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1600&auto=format&fit=crop&q=80",
    mobileImage:
      "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80",
    title: "HIGH PERFORMANCE DRIVES & MOTORS",
    subtitle: "Energy Efficient Industrial Controllers & Servo Drives",
    ctaText: "View Hardware",
    ctaUrl: "/products",
    isActive: true,
    sortOrder: 3,
  },
];

export const DEFAULT_CATEGORY_SHOWCASES: CategoryShowcaseConfig[] = [
  {
    id: "showcase-1",
    categoryId: "cat_sensors",
    eyebrow: "Explore Collection",
    customTitle: "Sensors & Perception",
    viewAllText: "View All",
    viewAllUrl: "",
    bannerBadge: "Featured Category",
    bannerTitle: "Sensors & Perception",
    bannerDescription:
      "Browse our certified, high-performance line of Sensors & Perception hardware components.",
    heroImage:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "showcase-2",
    categoryId: "cat_plc",
    eyebrow: "Explore Collection",
    customTitle: "Programmable Logic Controllers (PLCs)",
    viewAllText: "View All",
    viewAllUrl: "",
    bannerBadge: "Featured Category",
    bannerTitle: "Programmable Logic Controllers (PLCs)",
    bannerDescription:
      "High-speed multi-axis PLCs and micro-controllers built for continuous factory runtime.",
    heroImage:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop&q=80",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "showcase-3",
    categoryId: "cat_vfd",
    eyebrow: "Explore Collection",
    customTitle: "Variable Frequency Drives (VFDs)",
    viewAllText: "View All",
    viewAllUrl: "",
    bannerBadge: "Featured Category",
    bannerTitle: "Variable Frequency Drives (VFDs)",
    bannerDescription:
      "Industrial AC drives, servo amplifiers and heavy-duty motor control systems.",
    heroImage:
      "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1200&auto=format&fit=crop&q=80",
    isActive: true,
    sortOrder: 3,
  },
];

export const DEFAULT_STICKY_SHOWCASE: StickyShowcaseConfig = {
  eyebrow: "FLAGSHIP CONTROLLER",
  title: "Ultra-Fast Multi-Axis Motion Control",
  description:
    "Real-time deterministic EtherCAT cycle times down to 250μs with integrated functional safety (SIL 3, PLe). Built for harsh electrical and thermal plant floors.",
  bullets: [
    "Quad-Core ARM Cortex-A53 processor with hardware floating point",
    "Dual Gigabit TSN Ethernet with daisy-chain ring redundancy",
    "Operating temperature from -25°C to +70°C without derating",
    "Native MQTT & OPC-UA for enterprise IIoT connectivity",
  ],
  ctaText: "Explore Spec Sheet",
  ctaUrl: "/products",
  image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80",
};

export const DEFAULT_BRAND_MARQUEE: BrandMarqueeConfig = {
  eyebrow: "Authorized OEM Brand Distribution Partners",
  note: "[Placeholder brand names marked for official licensing reference]",
  isActive: true,
  brands: [
    { id: "allen-bradley", name: "Allen-Bradley", country: "USA", url: "/products?brand=allen-bradley" },
    { id: "delta", name: "Delta Electronics", country: "Taiwan", url: "/products?brand=delta" },
    { id: "mitsubishi", name: "Mitsubishi Electric", country: "Japan", url: "/products?brand=mitsubishi" },
    { id: "honeywell", name: "Honeywell", country: "USA", url: "/products?brand=honeywell" },
    { id: "siemens", name: "Siemens", country: "Germany", url: "/products?brand=siemens" },
    { id: "schneider", name: "Schneider Electric", country: "France", url: "/products?brand=schneider" },
    { id: "abb", name: "ABB", country: "Switzerland", url: "/products?brand=abb" },
    { id: "omron", name: "OMRON", country: "Japan", url: "/products?brand=omron" },
  ],
};

export const DEFAULT_PROMO_BANNER: PromoBannerConfig = {
  badge: "Volume Procurement Discounts",
  title: "Planning Large Machine Builds or Plant Retrofits?",
  description:
    "Unlock tiered volume discounts starting at 10+ units per line item. Access dedicated account managers, scheduled multi-shipment releases, and net-30 terms.",
  primaryCtaText: "Submit Bill of Materials (RFQ)",
  primaryCtaUrl: "/quote",
  secondaryCtaText: "Speak with an Application Engineer",
  secondaryCtaUrl: "/contact",
  image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1000&auto=format&fit=crop&q=80",
};

export const DEFAULT_STATS: StatItem[] = [
  { id: "stat-1", label: "Industrial Components", value: "2,000+", detail: "Sensors, PLCs, VFDs & Servos" },
  { id: "stat-2", label: "OEM Brand Partners", value: "50+", detail: "Siemens, Omron, ABB & Rockwell" },
  { id: "stat-3", label: "Same-Day Dispatch", value: "99.8%", detail: "Orders before 4 PM EST" },
  { id: "stat-4", label: "B2B Quote Turnaround", value: "< 2 Hours", detail: "Formal pricing & BOM estimates" },
];

export const DEFAULT_WHY_BUY: WhyBuyItem[] = [
  {
    id: "why-1",
    title: "100% Genuine Factory Direct",
    description: "Every component is direct from OEM certified partners with traceable serials and warranty.",
  },
  {
    id: "why-2",
    title: "Express Same-Day Dispatch",
    description: "In-stock hardware ships within 2 hours with priority freight across major industrial hubs.",
  },
  {
    id: "why-3",
    title: "Dedicated Automation Engineers",
    description: "Our technical team reviews your wiring schematics and cross-references obsolete part numbers.",
  },
  {
    id: "why-4",
    title: "Instant GST Invoicing & Net-30",
    description: "Automated B2B tax invoicing with compliant input credits and approved credit lines for plants.",
  },
];

export const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    id: "test-1",
    quote: "OM Automation sourced 40 Siemens S7-1500 units during a plant overhaul when no other vendor had inventory.",
    author: "Rajesh Sharma",
    role: "Lead Automation Engineer, AutoTech Industries",
    rating: 5,
  },
  {
    id: "test-2",
    quote: "The instant RFQ response and technical support helped us commission our pharmaceutical packaging line 2 weeks ahead of schedule.",
    author: "Priya Mehta",
    role: "Plant Operations Manager, Cadence Pharma",
    rating: 5,
  },
  {
    id: "test-3",
    quote: "Reliable OEM drives and sensors with complete test certificates. Their express delivery saved us from significant downtime.",
    author: "Anil Patel",
    role: "Maintenance Head, Precision Metals",
    rating: 5,
  },
];

export const DEFAULT_FAQS: FaqItem[] = [
  {
    id: "faq-1",
    question: "Do you supply 100% authentic OEM components with warranties?",
    answer:
      "Yes, all components supplied by OM Automation are 100% brand new, authentic, and backed by full OEM manufacturer warranties and compliance certificates.",
  },
  {
    id: "faq-2",
    question: "How fast can I receive a formal B2B price quote for my BOM?",
    answer:
      "Our engineering desk provides comprehensive line-item pricing, availability timelines, and GST invoices within 2 hours of RFQ submission.",
  },
  {
    id: "faq-3",
    question: "Do you support cross-referencing for obsolete or discontinued parts?",
    answer:
      "Yes! Our applications engineers can match pinouts, voltages, and communication protocols to recommend drop-in replacements for obsolete parts.",
  },
  {
    id: "faq-4",
    question: "What payment and credit terms are available for corporate accounts?",
    answer:
      "We support Net Banking, Corporate UPI, RTGS/NEFT, Credit Cards, Cash on Delivery (COD), and Net-30 terms for pre-approved corporate accounts.",
  },
];

export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  supportPhone: "+91 90993 92066",
  supportEmail: "omautomation2012@gmail.com",
  announcementUrl: "/products",
  navLinks: [
    { label: "Products", url: "/products" },
    { label: "Categories", url: "/category/sensors" },
    { label: "Brands", url: "/products" },
    { label: "RFQ Portal", url: "/quote" },
    { label: "About Us", url: "/about" },
    { label: "Contact", url: "/contact" },
  ],
};

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  catalogBadge: "2026 Industrial Automation Catalog",
  catalogTitle: "Download Full Product & Parts Catalog",
  catalogDesc:
    "Get immediate offline access to 1,500+ CAD models, electrical schematics, and pricing for factory automation.",
  catalogCtaText: "Download PDF",
  catalogCtaUrl: "/resources",
  usefulLinks: [
    { label: "Home", url: "/" },
    { label: "Company", url: "/about" },
    { label: "Brands & Products", url: "/products" },
    { label: "Contact Us", url: "/contact" },
    { label: "Delivery & Shipping", url: "/delivery" },
  ],
  helpLinks: [
    { label: "Privacy Policy", url: "/privacy" },
    { label: "Refund Policy", url: "/refund-policy" },
    { label: "Shipping Policy", url: "/shipping-policy" },
    { label: "Terms of Service", url: "/terms-of-service" },
    { label: "Legal Notice", url: "/legal-notice" },
  ],
  facebookUrl: "https://www.facebook.com/OMAUTOMATIONRAJKOT/",
  instagramUrl: "https://www.instagram.com/om_automation_rajkot_/",
  whatsappNumber: "+91 90993 92066",
  youtubeUrl: "https://www.youtube.com/user/padiahir",
  addressLine1: "Shed No : C1B-271 R - Road,",
  addressLine2: "Aji GIDC, Rajkot - 360002.",
  copyrightText: "© 2026 OM Automation. All rights reserved.",
};

export const DEFAULT_ORBIT_STAGE: OrbitStageConfig = {
  eyebrow: "AUTONOMOUS 3D PRODUCT SHOWCASE",
  title: "Speak with precision components that power automation",
  subtitle: "Continuous 3D horizontal orbital product movement. Uninterrupted autonomous rotation.",
  products: [
    {
      id: "cine-prod-1",
      sku: "SERVO-X900",
      name: "Industrial High-Torque Servo Actuator",
      category: "MOTION CONTROL & ROBOTICS",
      subtitle: "Closed-Loop Brushless Synchronous Servo",
      price: "$1,240.00",
      specs: [
        { label: "Feedback", value: "24-bit Absolute Encoder" },
        { label: "Torque", value: "45.0 Nm Peak" },
        { label: "Protection", value: "IP67 Submersible" },
      ],
      image: "/cinematic-products/carbide-cutter-endmill_e29a3cd3-680f-4e33-bf24-e213effcbe3c.webp",
    },
    {
      id: "cine-prod-2",
      sku: "ISC-15816-B",
      name: "Iscar Indexable Milling Insert",
      category: "Precision Machine Accessories",
      subtitle: "High-Temperature Thermal-Resistant Cutters",
      price: "$42.50",
      specs: [
        { label: "Grade", value: "IC908 TiAlN" },
        { label: "Feed", value: "0.15-0.35 mm/t" },
      ],
      image: "/cinematic-products/iscar-insert-carbide-3_3a2b7245-567a-4299-8ea5-06c8b9399cb1.webp",
    },
  ],
};

export const DEFAULT_CATEGORY_GRID: CategoryGridConfig = {
  eyebrow: "Core Hardware Categories",
  title: "Shop by Industrial Domain",
  subtitle: "Architect your control system with 1,500+ stocked components classified by sensing precision, PLC logic execution, and power drive specs.",
  categories: [
    {
      id: "sensors",
      slug: "sensors",
      name: "Sensors & Machine Vision",
      badge: "Nanosecond Edge Trigger",
      description: "Photoelectric, inductive proximity, laser measurement, and machine vision cameras rated for continuous line inspection.",
      itemCount: 840,
      subcategories: ["Photoelectric Sensors", "Inductive Proximity", "Laser Measurement", "Vision Systems"],
      accentColor: "from-sky-500/10 to-transparent",
    },
    {
      id: "plcs",
      slug: "plcs",
      name: "PLCs & Embedded Logic",
      badge: "Deterministic Execution",
      description: "Modular CPU racks, distributed IO modules, and safety controllers with PROFINET, EtherCAT, and Modbus TCP.",
      itemCount: 420,
      subcategories: ["Modular CPU Racks", "Distributed I/O", "HMI Operator Panels", "Safety Relays"],
      accentColor: "from-blue-500/10 to-transparent",
    },
    {
      id: "drives",
      slug: "drives",
      name: "Drives, Servos & Motion",
      badge: "Sub-Micron Positioning",
      description: "Variable frequency AC inverters, high-torque servo motors, planetary gearboxes, and closed-loop steppers.",
      itemCount: 380,
      subcategories: ["Variable Frequency Drives", "Servo Motors & Packs", "Stepper Systems", "Motion Controllers"],
      accentColor: "from-amber-500/10 to-transparent",
    },
  ],
};

export const DEFAULT_FEATURED_CATALOG: FeaturedCatalogConfig = {
  eyebrow: "Live Database Catalog",
  title: "Featured Industrial Components",
  allTabLabel: "All Top Components",
  sensorsTabLabel: "Sensors",
  plcsTabLabel: "PLCs",
  motorsTabLabel: "Motors & Drives",
};

export const DEFAULT_SOLUTIONS_SHOWCASE: SolutionsShowcaseConfig = {
  eyebrow: "Industrial Solutions Showcase",
  title: "Domain-Engineered Automation Packages",
  subtitle: "Turnkey bills of materials, architecture schematics, and certified components for high-throughput factory lines.",
  verticals: [
    {
      id: "manufacturing",
      title: "Automotive & Discrete Manufacturing",
      description: "Ultra-fast PROFINET PLCs, laser positioning, and heavy robotic servo axes for high-speed vehicle assembly lines.",
      stats: "0.08ms Execution Speed",
      color: "from-blue-600/20 via-slate-900 to-slate-950",
      categorySlug: "plcs",
      categoryName: "PLCs & Controllers",
      bom: [
        {
          partNo: "6ES7512-1DK01-0AB0",
          name: "SIMATIC S7-1500 Motion CPU",
          category: "PLCs & Controllers",
          specs: "0.08ms bit execution, PROFINET IRT, 32-axis sync",
          manufacturer: "Siemens",
        },
        {
          partNo: "CMMT-AS-C2-11A-P3-PN",
          name: "Heavy-Duty Servo Controller",
          category: "Drives & Servo Motors",
          specs: "2.5kW peak, EtherCAT/PROFINET, Safe Torque Off (STO)",
          manufacturer: "Festo",
        },
        {
          partNo: "LR-TB5000",
          name: "Time-of-Flight Laser Distance Sensor",
          category: "Sensors & Perception",
          specs: "0.1mm repeatability, 5m range, Class 1 Laser",
          manufacturer: "Keyence",
        },
        {
          partNo: "6GK5208-0BA00-2AB2",
          name: "SCALANCE Managed Switch",
          category: "Industrial Networking",
          specs: "8x Gigabit RJ45, PROFINET Conformance Class B",
          manufacturer: "Siemens",
        },
      ],
    },
    {
      id: "packaging",
      title: "High-Speed Bottling & Packaging",
      description: "Synchronized multi-axis motion, vision rejection optical sensors, and IP69K washdown VFD drives.",
      stats: "1,200 PPM Capacity",
      color: "from-emerald-600/20 via-slate-900 to-slate-950",
      categorySlug: "sensors",
      categoryName: "Sensors & Perception",
      bom: [
        {
          partNo: "E3Z-T81A-M1J",
          name: "Optical Rejection Photoelectric Sensor",
          category: "Sensors & Perception",
          specs: "0.5ms response time, IP69K washdown, 15m through-beam",
          manufacturer: "Omron",
        },
        {
          partNo: "ATV340U40N4E",
          name: "Altivar Process ATV340 VFD",
          category: "Drives & Servo Motors",
          specs: "4kW / 5.5HP, EtherNet/IP & Modbus, Built-in EMC filter",
          manufacturer: "Schneider Electric",
        },
        {
          partNo: "FX5U-32MT/ES",
          name: "MELSEC iQ-F Compact PLC",
          category: "PLCs & Controllers",
          specs: "34ns execution, 4-axis 200kHz pulse output, Ethernet built-in",
          manufacturer: "Mitsubishi Electric",
        },
      ],
    },
    {
      id: "pharma",
      title: "Pharma Cleanroom & Biotech",
      description: "Stainless steel AISI 316L housings, FDA 21 CFR Part 11 compliant data loggers, and ultra-sterile sensors.",
      stats: "Zero Particle Ingress",
      color: "from-teal-600/20 via-slate-900 to-slate-950",
      categorySlug: "sensors",
      categoryName: "Sensors & Perception",
      bom: [
        {
          partNo: "W4S-3 Inox",
          name: "IP69K Stainless Steel Photoelectric Sensor",
          category: "Sensors & Perception",
          specs: "Ecolab certified, PinPoint LED, 100mm background suppression",
          manufacturer: "SICK",
        },
        {
          partNo: "CPX-AP-I-4IOL-M12",
          name: "IO-Link Cleanroom Master Module",
          category: "Industrial Networking",
          specs: "IP67 protection, 4x IO-Link ports, cycle time 1ms",
          manufacturer: "Festo",
        },
      ],
    },
    {
      id: "logistics",
      title: "Warehouse Sortation & Intralogistics",
      description: "Long-range barcode laser scanners, high-torque motor rollers, and high-density distributed I/O blocks.",
      stats: "24,000 Parcels / Hour",
      color: "from-amber-600/20 via-slate-900 to-slate-950",
      categorySlug: "plcs",
      categoryName: "PLCs & Controllers",
      bom: [
        {
          partNo: "CLV650-0120",
          name: "Fixed-Mount Barcode Scanner",
          category: "Sensors & Perception",
          specs: "Real-time auto focus, 1,000 scans/sec, PROFINET",
          manufacturer: "SICK",
        },
        {
          partNo: "6SL3210-1KE18-8AF1",
          name: "SINAMICS G120C Compact Inverter",
          category: "Drives & Servo Motors",
          specs: "3.7kW, Safe Torque Off, PROFINET integrated",
          manufacturer: "Siemens",
        },
      ],
    },
  ],
};

export const DEFAULT_ASSEMBLY_SEQUENCE: AssemblySequenceConfig = {
  eyebrow: "Precision Engineering",
  title: "Precision Product Assembly Sequence",
  subtitle: "Explore the internal architecture of our industrial motion components, layer by layer.",
  steps: [
    {
      id: "step-1",
      title: "Die-Cast Aluminum Enclosure",
      description: "IP67 sealed housing with thermal heat sinks and vibration damping channels.",
      tag: "Stage 01",
    },
    {
      id: "step-2",
      title: "Multi-Layer Surface Mount PCB",
      description: "Industrial grade surface mount electronics with conformal coating for humidity resistance.",
      tag: "Stage 02",
    },
    {
      id: "step-3",
      title: "High-Resolution Optical Encoder",
      description: "24-bit absolute feedback encoder providing sub-micron rotational precision.",
      tag: "Stage 03",
    },
    {
      id: "step-4",
      title: "Heavy-Duty M12 Connector Terminal",
      description: "Gold-plated sealed pin contacts for shielded Ethernet and 24V DC auxiliary power.",
      tag: "Stage 04",
    },
  ],
};

export const DEFAULT_BEST_SELLERS: BestSellersConfig = {
  eyebrow: "Highest B2B Demand",
  title: "Top Best Sellers & Fast Movers",
};

export const DEFAULT_SPEC_COMPARE: SpecCompareConfig = {
  eyebrow: "Specification Benchmarking",
  title: "Technical Specification Matrix Preview",
  ctaText: "Launch Full Side-by-Side Comparison Tool",
  ctaUrl: "/compare",
  rows: [
    {
      parameter: "Primary Interface",
      sensorVal: "IO-Link / PNP 24V",
      plcVal: "PROFINET IRT / Modbus TCP",
      driveVal: "EtherCAT / Safe Torque Off",
    },
    {
      parameter: "Response Speed",
      sensorVal: "0.5ms Switch Rate",
      plcVal: "0.08ms Execution Cycle",
      driveVal: "250μs Current Loop",
    },
    {
      parameter: "Ingress Protection",
      sensorVal: "IP67 / IP69K Washdown",
      plcVal: "IP20 Cabinet Sealed",
      driveVal: "IP20 / NEMA 1 Flanged",
    },
    {
      parameter: "Operating Temperature",
      sensorVal: "-25°C to +70°C",
      plcVal: "-20°C to +60°C",
      driveVal: "-10°C to +50°C",
    },
  ],
};

export const DEFAULT_RESOURCE_HUB: ResourceHubConfig = {
  eyebrow: "Engineering Knowledge Base",
  title: "Latest Technical Resources & Selection Guides",
  ctaText: "View All Engineering Articles",
  ctaUrl: "/resources",
  articles: [
    {
      id: "res-1",
      slug: "selecting-right-plc-for-high-speed-motion",
      title: "Selecting the Right PLC Architecture for Multi-Axis Motion",
      category: "PLCs & Controllers",
      summary: "A practical guide on evaluating EtherCAT cycle times, memory buffers, and synchronized servo axes.",
      author: "Hiren Padia",
      readTime: "6 min read",
    },
    {
      id: "res-2",
      slug: "io-link-sensors-predictive-maintenance",
      title: "IO-Link Sensors & Predictive Maintenance on Modern Plant Floors",
      category: "Sensors & Perception",
      summary: "How edge diagnostics, temperature telemetry, and parameterization reduce unplanned machine downtime.",
      author: "Mahesh Pambhar",
      readTime: "8 min read",
    },
    {
      id: "res-3",
      slug: "vfd-sizing-and-harmonic-mitigation",
      title: "VFD Sizing Guidelines & Harmonic Mitigation for Heavy Motors",
      category: "Drives & Motion",
      summary: "Preventing drive overheating, selecting line reactors, and matching peak torque curves.",
      author: "Dharmesh Pambhar",
      readTime: "7 min read",
    },
  ],
};

export const BASE_SECTION_TEMPLATES: Record<
  string,
  { name: string; description: string; category: string; defaultData: any }
> = {
  "sec-ticker": {
    name: "Top Announcement & Ticker",
    description: "Urgent top bar promotional ticker banner with link actions",
    category: "Promotional",
    defaultData: {
      promoTicker: DEFAULT_PROMO_TICKER,
      promoTickerUrl: "/products",
      promoTickerActive: true,
    },
  },
  "sec-header": {
    name: "Navigation Header",
    description: "Primary site header with OEM brand logo, search bar, and dynamic navigation links",
    category: "Navigation",
    defaultData: DEFAULT_HEADER_CONFIG,
  },
  "sec-mainframe": {
    name: "Mainframe Hero",
    description: "High-impact industrial hero section with video loop, RFQ CTA, sales email, and quick-access pills",
    category: "Hero Sections",
    defaultData: DEFAULT_MAINFRAME_HERO,
  },
  "sec-slider": {
    name: "Hero Slider",
    description: "Multi-slide industrial banner carousel with custom photography, headings, and CTAs",
    category: "Hero Sections",
    defaultData: DEFAULT_HERO_SLIDES,
  },
  "sec-showcases": {
    name: "Category Showcases",
    description: "Multi-category product carousels with banner hero images and direct catalog links",
    category: "Product Showcases",
    defaultData: DEFAULT_CATEGORY_SHOWCASES,
  },
  "sec-brand-marquee": {
    name: "OEM Brand Partners",
    description: "Certified OEM manufacturer partner logo badges with country indicators and product filters",
    category: "Trust & Social Proof",
    defaultData: DEFAULT_BRAND_MARQUEE,
  },
  "sec-cinematic": {
    name: "3D Product Orbit Stage",
    description: "Interactive 3D rotating industrial hardware showcase with live specs rail and orbit stage controls",
    category: "Interactive 3D",
    defaultData: DEFAULT_ORBIT_STAGE,
  },
  "sec-categories-grid": {
    name: "Categories Grid",
    description: "3-column domain grid for Sensors, PLCs, and VFD Drives with live item counts and subcategories",
    category: "Navigation",
    defaultData: DEFAULT_CATEGORY_GRID,
  },
  "sec-featured-catalog": {
    name: "Featured Catalog",
    description: "Dynamic database-connected catalog grid with category tab filters and instant quote actions",
    category: "Product Showcases",
    defaultData: DEFAULT_FEATURED_CATALOG,
  },
  "sec-solutions": {
    name: "Solutions Showcase",
    description: "Interactive industry solution switcher with editable Bill of Materials (BOM) data table",
    category: "Engineering Solutions",
    defaultData: DEFAULT_SOLUTIONS_SHOWCASE,
  },
  "sec-assembly": {
    name: "Product Assembly",
    description: "Exploded 3D pneumatic cylinder component assembly simulation with sequence steps",
    category: "Interactive 3D",
    defaultData: DEFAULT_ASSEMBLY_SEQUENCE,
  },
  "sec-why-buy": {
    name: "Why Buy From Us",
    description: "4-pillar value guarantee cards highlighting factory direct OEM parts, speed, and engineering support",
    category: "Trust & Social Proof",
    defaultData: {
      whyBuy: DEFAULT_WHY_BUY,
      whyBuyEyebrow: "VALUE GUARANTEE",
      whyBuyTitle: "Why Leading Engineering Teams Choose OM AUTOMATION",
    },
  },
  "sec-sticky-showcase": {
    name: "Sticky Flagship Controller",
    description: "High-spec flagship controller showcase card with technical bullet points and spec sheet download",
    category: "Product Showcases",
    defaultData: DEFAULT_STICKY_SHOWCASE,
  },
  "sec-best-sellers": {
    name: "Best Sellers Rail",
    description: "Fast-moving high-demand components carousel with live inventory dispatch indicators",
    category: "Product Showcases",
    defaultData: DEFAULT_BEST_SELLERS,
  },
  "sec-stats": {
    name: "Key Metrics & Stats",
    description: "4-metric industrial proof banner with bold stats numbers and operational details",
    category: "Trust & Social Proof",
    defaultData: DEFAULT_STATS,
  },
  "sec-promo-banner": {
    name: "Volume Promo Banner",
    description: "High-conversion volume procurement callout banner with dual CTA buttons and image card",
    category: "Promotional",
    defaultData: DEFAULT_PROMO_BANNER,
  },
  "sec-testimonials": {
    name: "Testimonials & Reviews",
    description: "Customer feedback cards with 5-star ratings, quotes, author names, and verified company titles",
    category: "Trust & Social Proof",
    defaultData: {
      testimonials: DEFAULT_TESTIMONIALS,
      testimonialsEyebrow: "CLIENT FEEDBACK",
      testimonialsTitle: "Trusted by Industrial Automation Leaders",
    },
  },
  "sec-compare": {
    name: "Benchmark Matrix",
    description: "Multi-domain technical specification benchmarking matrix with side-by-side parameter comparison",
    category: "Engineering Solutions",
    defaultData: DEFAULT_SPEC_COMPARE,
  },
  "sec-resource-hub": {
    name: "Knowledge Hub",
    description: "Technical articles, selection whitepapers, and engineering guides with read times and links",
    category: "Content & Resources",
    defaultData: DEFAULT_RESOURCE_HUB,
  },
  "sec-faqs": {
    name: "Support FAQs",
    description: "Accordion-style frequently asked technical questions with instant RFQ and GST quotation answers",
    category: "Support",
    defaultData: {
      faqs: DEFAULT_FAQS,
      faqsEyebrow: "SUPPORT & HELP",
      faqsTitle: "Frequently Asked Questions",
    },
  },
  "sec-footer-config": {
    name: "Footer & Downloads",
    description: "Comprehensive site footer with catalog PDF download callout, support phone, email, and social links",
    category: "Navigation",
    defaultData: DEFAULT_FOOTER_CONFIG,
  },
};

export function deepCloneSectionData<T = any>(data: T, baseId?: string): T {
  if (!data) return data;
  const clone = JSON.parse(JSON.stringify(data));
  const timestamp = Date.now();
  const randomSuffix = () => Math.random().toString(36).substring(2, 7);

  if (Array.isArray(clone)) {
    return clone.map((item: any, idx: number) => {
      if (item && typeof item === "object") {
        return {
          ...item,
          id: `${baseId || "item"}-${timestamp}-${idx}-${randomSuffix()}`,
        };
      }
      return item;
    }) as any;
  }

  if (typeof clone === "object") {
    for (const key of Object.keys(clone)) {
      if (Array.isArray(clone[key])) {
        clone[key] = clone[key].map((item: any, idx: number) => {
          if (item && typeof item === "object") {
            return {
              ...item,
              id: `${key}-${timestamp}-${idx}-${randomSuffix()}`,
            };
          }
          return item;
        });
      }
    }
  }

  return clone;
}

export function generateUniqueSectionId(baseId: string, existingIds: string[]): string {
  let count = 1;
  let candidate = `${baseId}-copy-${count}`;
  while (existingIds.includes(candidate)) {
    count++;
    candidate = `${baseId}-copy-${count}`;
  }
  return candidate;
}

export function getBaseSectionData(baseId: string, state: HomepageData): any {
  switch (baseId) {
    case "sec-ticker":
      return {
        promoTicker: state.promoTicker || DEFAULT_PROMO_TICKER,
        promoTickerUrl: state.promoTickerUrl || "/products",
        promoTickerActive: state.promoTickerActive ?? true,
      };
    case "sec-header":
      return state.headerConfig || DEFAULT_HEADER_CONFIG;
    case "sec-mainframe":
      return state.mainframeHero || DEFAULT_MAINFRAME_HERO;
    case "sec-slider":
      return state.heroSlides || DEFAULT_HERO_SLIDES;
    case "sec-showcases":
      return state.categoryShowcases || DEFAULT_CATEGORY_SHOWCASES;
    case "sec-brand-marquee":
      return state.brandMarquee || DEFAULT_BRAND_MARQUEE;
    case "sec-cinematic":
      return state.orbitStage || DEFAULT_ORBIT_STAGE;
    case "sec-categories-grid":
      return state.categoryGrid || DEFAULT_CATEGORY_GRID;
    case "sec-featured-catalog":
      return state.featuredCatalog || DEFAULT_FEATURED_CATALOG;
    case "sec-solutions":
      return state.solutionsShowcase || DEFAULT_SOLUTIONS_SHOWCASE;
    case "sec-assembly":
      return state.assemblySequence || DEFAULT_ASSEMBLY_SEQUENCE;
    case "sec-why-buy":
      return {
        whyBuy: state.whyBuy || state.whyBuyFromUs || DEFAULT_WHY_BUY,
        whyBuyEyebrow: state.whyBuyEyebrow || "VALUE GUARANTEE",
        whyBuyTitle: state.whyBuyTitle || "Why Leading Engineering Teams Choose OM AUTOMATION",
      };
    case "sec-sticky-showcase":
      return state.stickyShowcase || DEFAULT_STICKY_SHOWCASE;
    case "sec-best-sellers":
      return state.bestSellers || DEFAULT_BEST_SELLERS;
    case "sec-stats":
      return state.stats || DEFAULT_STATS;
    case "sec-promo-banner":
      return state.promoBanner || DEFAULT_PROMO_BANNER;
    case "sec-testimonials":
      return {
        testimonials: state.testimonials || DEFAULT_TESTIMONIALS,
        testimonialsEyebrow: state.testimonialsEyebrow || "CLIENT FEEDBACK",
        testimonialsTitle: state.testimonialsTitle || "Trusted by Industrial Automation Leaders",
      };
    case "sec-compare":
      return state.specCompare || DEFAULT_SPEC_COMPARE;
    case "sec-resource-hub":
      return state.resourceHub || DEFAULT_RESOURCE_HUB;
    case "sec-faqs":
      return {
        faqs: state.faqs || DEFAULT_FAQS,
        faqsEyebrow: state.faqsEyebrow || "SUPPORT & HELP",
        faqsTitle: state.faqsTitle || "Frequently Asked Questions",
      };
    case "sec-footer-config":
      return state.footerConfig || DEFAULT_FOOTER_CONFIG;
    default:
      return {};
  }
}

export function getSectionInstanceData(instanceId: string, state: HomepageData): any {
  const baseId = getBaseSectionId(instanceId);
  const baseData = getBaseSectionData(baseId, state);
  const instanceOverrides = state.sectionInstances?.[instanceId];
  if (!instanceOverrides) return baseData;
  if (Array.isArray(instanceOverrides) || Array.isArray(baseData)) {
    return instanceOverrides;
  }
  return { ...baseData, ...instanceOverrides };
}


