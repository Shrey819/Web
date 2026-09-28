import { Category } from "@/types";

export const CATEGORIES: Category[] = [
  {
    id: "ballscrew",
    name: "Ballscrew",
    slug: "ballscrew",
    description: "High-rigidity precision ground and rolled ballscrews, preloaded ball nuts, and support units engineered for smooth linear transmission and zero backlash.",
    itemCount: 16,
    accentColor: "from-sky-600/20 via-cyan-500/10 to-transparent",
    badge: "Zero Backlash",
    image: "/images/categories/ballscrew.svg",
    subcategories: ["Precision Ground Ballscrews", "Rolled Ball Screws", "Flanged Ball Nuts", "BK/BF End Support Units", "Rigid Couplings"]
  },
  {
    id: "linear-guideway",
    name: "Linear Guideway",
    slug: "linear-guideway",
    description: "Heavy-duty linear guideways and ground guide rail systems engineered for sub-micron precision, high moment rigidity, and smooth low-friction machine travel.",
    itemCount: 25,
    accentColor: "from-emerald-600/20 via-teal-500/10 to-transparent",
    badge: "Class P Precision",
    image: "/images/categories/guideway.svg",
    subcategories: ["Linear Guide Rails", "Flange Slider Blocks", "Square Runner Carriages", "End Dust Seals", "Preloaded Carriages"]
  },
  {
    id: "actuators",
    name: "Actuators",
    slug: "actuators",
    description: "High-speed electric linear actuators, CNC motorized slide stages, and precision positioning modules built for automated handling and robotic machinery.",
    itemCount: 12,
    accentColor: "from-amber-500/20 via-orange-500/10 to-transparent",
    badge: "High Repeatability",
    image: "/images/categories/actuators.svg",
    subcategories: ["Electric Linear Actuators", "Motorized Slide Stages", "Belt-Driven Linear Modules", "Rod-Style Cylinders", "Multi-Axis Positioning"]
  }
];
