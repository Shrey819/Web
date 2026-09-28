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
    image: "https://res.cloudinary.com/hecyltpu/image/upload/v1790332551/showcase-orbit/carbide-endmill.png",
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
    image: "https://res.cloudinary.com/hecyltpu/image/upload/v1790332552/showcase-orbit/carbide-insert.png",
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
    image: "https://res.cloudinary.com/hecyltpu/image/upload/v1790332553/showcase-orbit/spindle-enclosure.png",
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
    image: "https://res.cloudinary.com/hecyltpu/image/upload/v1790332554/showcase-orbit/torx-screw.png",
    accentColor: "#a855f7",
  },
  {
    id: "cine-prod-5",
    sku: "LGR-500-HI",
    name: "Heavy-Duty Linear Guide Rail System",
    category: "Precision Linear Motion",
    subtitle: "High-Rigidity Ground Linear Rail Block",
    description:
      "Precision-ground high-capacity linear motion rail ensuring micrometer positional repeatability under extreme loads.",
    price: "$890.00",
    specs: [
      { label: "Accuracy", value: "Class P Precision" },
      { label: "Dynamic Load", value: "38.5 kN" },
      { label: "Preload", value: "Heavy Preload ZA" },
    ],
    image: "https://res.cloudinary.com/hecyltpu/image/upload/v1790332555/showcase-orbit/linear-rail.png",
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
    image: "https://res.cloudinary.com/hecyltpu/image/upload/v1790332556/showcase-orbit/ballnose-tool.png",
    accentColor: "#06b6d4",
  },
];
