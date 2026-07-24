import { Category } from "@/types";

export const CATEGORIES: Category[] = [
  {
    id: "sensors",
    name: "Sensors & Perception",
    slug: "sensors",
    description: "High-precision inductive, photoelectric, ultrasonic, and pressure sensors engineered for harsh industrial environments.",
    itemCount: 680,
    accentColor: "from-blue-600/20 via-cyan-500/10 to-transparent",
    badge: "IP69K Rated",
    image: "/images/categories/sensors.svg",
    subcategories: ["Inductive Proximity", "Photoelectric Beam", "Laser Distance", "Ultrasonic Transducers", "Pressure & Flow Transmitters"]
  },
  {
    id: "plcs",
    name: "PLCs & Controllers",
    slug: "plcs",
    description: "Modular programmable logic controllers, industrial IPCs, remote I/O systems, and high-speed motion CPUs.",
    itemCount: 520,
    accentColor: "from-emerald-600/20 via-teal-500/10 to-transparent",
    badge: "IEC 61131-3",
    image: "/images/categories/plcs.svg",
    subcategories: ["Modular PLCs", "Compact Micro Controllers", "Distributed I/O Blocks", "Safety PLCs", "Industrial IPCs & HMIs"]
  },
  {
    id: "drives",
    name: "Drives & Servo Motors",
    slug: "drives",
    description: "Variable frequency drives, brushless servo drives, high-torque industrial motors, and precision planetary gearboxes.",
    itemCount: 440,
    accentColor: "from-amber-500/20 via-orange-500/10 to-transparent",
    badge: "Heavy Duty",
    image: "/images/categories/drives.svg",
    subcategories: ["Variable Frequency Drives (VFD)", "AC Servo Amplifiers", "Precision Servo Motors", "Soft Starters", "Planetary Gearboxes"]
  }
];
