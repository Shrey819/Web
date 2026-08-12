export interface CinematicProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  subtitle: string;
  description: string;
  price: string;
  specs: { label: string; value: string }[];
  image: string;
  accentColor?: string;
}

export const CINEMATIC_CONFIG = {
  // Motion curve scales
  activeScale: 1.0,
  enterScale: 0.65,
  exitScale: 0.65,
  farScale: 0.45,

  // Position offsets
  enterTranslateY: 120, // px
  exitTranslateY: -120, // px
  enterTranslateX: 10, // px horizontal tilt
  exitTranslateX: -10, // px horizontal tilt

  // Rotation parameters
  enterRotate: -6, // deg
  exitRotate: 6, // deg

  // Visual filters
  activeBlur: 0, // px
  ambientBlur: 6, // px
  enterOpacity: 0,
  activeOpacity: 1,
  exitOpacity: 0,

  // Depth layout
  activeZIndex: 40,
  adjacentZIndex: 20,
  farZIndex: 10,

  // Scroll multiplier (number of complete circular rotations during sticky scroll)
  defaultTotalCycles: 4,
};

export const CINEMATIC_PRODUCTS: CinematicProduct[] = [
  {
    id: "cine-prod-1",
    sku: "GUH-40355-A",
    name: "Guhring Pro Carbide Endmill",
    category: "Cutting Tools & CNC Inserts",
    subtitle: "Ultra-precise DLC Micro-Coated Endmill",
    description:
      "Tungsten carbide high-feed endmill engineered for sub-micron accuracy in aerospace titanium alloys.",
    price: "$249.00",
    specs: [
      { label: "Material", value: "Micrograin Carbide" },
      { label: "Coating", value: "DLC Diamond" },
      { label: "Tolerance", value: "±0.002mm" },
    ],
    image: "/cinematic-products/carbide-cutter-endmill_e29a3cd3-680f-4e33-bf24-e213effcbe3c.webp",
    accentColor: "#38bdf8",
  },
  {
    id: "cine-prod-2",
    sku: "ISC-15816-B",
    name: "Iscar Indexable Milling Insert",
    category: "Precision Machine Accessories",
    subtitle: "High-Temperature Thermal-Resistant Cutters",
    description:
      "Precision-ground indexable insert built for heavy-duty metal turning under continuous thermal stress.",
    price: "$185.50",
    specs: [
      { label: "Material", value: "PVD Coated Alloy" },
      { label: "Grade", value: "IC908 Heavy Duty" },
      { label: "Cutting Edges", value: "4 Precision Corners" },
    ],
    image: "/cinematic-products/carbide-insert_27f87af9-658a-48ac-a685-fcc0447aae63.webp",
    accentColor: "#f59e0b",
  },
  {
    id: "cine-prod-3",
    sku: "SERVO-X900",
    name: "Industrial High-Torque Servo Actuator",
    category: "Motion Control & Robotics",
    subtitle: "Closed-Loop Brushless Synchronous Servo",
    description:
      "Deterministic 0.08ms motion controller with EtherCAT integration and SIL3 safe torque off.",
    price: "$1,240.00",
    specs: [
      { label: "Feedback", value: "24-bit Absolute Encoder" },
      { label: "Torque", value: "45.0 Nm Peak" },
      { label: "Protection", value: "IP67 Submersible" },
    ],
    image: "/cinematic-products/110302586530_001.jpg",
    accentColor: "#10b981",
  },
  {
    id: "cine-prod-4",
    sku: "TORX-TI-M8",
    name: "Titanium Torx High-Fastener Assembly",
    category: "Hardware & Fasteners",
    subtitle: "Aerospace Grade Titanium Fastener",
    description:
      "Grade 5 Ti-6Al-4V fastener designed for zero backlash in high-vibration robotic arms.",
    price: "$48.00",
    specs: [
      { label: "Grade", value: "Ti-6Al-4V Grade 5" },
      { label: "Tensile Strength", value: "950 MPa" },
      { label: "Drive System", value: "T30 Security Torx" },
    ],
    image: "/cinematic-products/TORX-SCREW_b8e51035-e565-487f-8015-6e052b1d0503.webp",
    accentColor: "#a855f7",
  },
  {
    id: "cine-prod-5",
    sku: "VFD-ABB-380",
    name: "ABB Machinery Variable Frequency Drive",
    category: "Drive Controllers & Motors",
    subtitle: "Compact Dynamic Speed Controller",
    description:
      "Heavy-duty VFD with built-in EMC filter and dual PROFINET IRT ports for synchronized motor speed.",
    price: "$890.00",
    specs: [
      { label: "Input Voltage", value: "380-480V 3-Phase" },
      { label: "Overload Capacity", value: "150% for 60s" },
      { label: "Interface", value: "PROFINET / EtherCAT" },
    ],
    image: "/cinematic-products/222000195786_002.jpg",
    accentColor: "#ec4899",
  },
  {
    id: "cine-prod-6",
    sku: "BALL-ROUTER-99",
    name: "High-Feed Ball Nose Router Tool",
    category: "Cutting Tools & Milling",
    subtitle: "Sub-Millimeter Contour Milling Router",
    description:
      "Engineered for 3D mold finishing and smooth surface profiling at maximum RPM spindle speeds.",
    price: "$310.00",
    specs: [
      { label: "Helix Angle", value: "35 Degrees" },
      { label: "Shank Dia.", value: "12mm Precision H6" },
      { label: "Evacuation", value: "Dual Chip Flutes" },
    ],
    image: "/cinematic-products/inserted-ballnose2_3bff53e0-7aeb-4634-abcc-b3bd2f98b7a4.webp",
    accentColor: "#06b6d4",
  },
];
