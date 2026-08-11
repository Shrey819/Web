export interface AssemblyComponentConfig {
  id: string;
  name: string;
  category: string;
  label: string;
  image: string;
  dimensions: {
    width: number;
    height: number;
    className: string; // Tailwind width/height classes for responsive sizing
  };
  initial: {
    x: number;
    y: number;
    rotate: number;
    scale: number;
    opacity: number;
  };
  final: {
    x: number;
    y: number;
    rotate: number;
    scale: number;
    opacity: number;
  };
  startProgress: number; // 0.0 - 1.0 scroll fraction
  endProgress: number;   // 0.0 - 1.0 scroll fraction
  zIndex: number;
  labelPosition?: {
    side: "left" | "right" | "top" | "bottom";
    offsetX?: number;
    offsetY?: number;
  };
}

export const ASSEMBLY_COMPONENTS: AssemblyComponentConfig[] = [
  {
    id: "spindle-enclosure",
    name: "Precision Spindle Enclosure",
    category: "MACHINE STRUCTURE",
    label: "MAIN SPINDLE FRAME",
    image: "/images/product-assembly/processed/component-01-spindle-enclosure.png",
    dimensions: { width: 600, height: 350, className: "w-[260px] sm:w-[360px] md:w-[460px] h-auto" },
    initial: { x: 0, y: 220, rotate: 0, scale: 0.8, opacity: 0 },
    final: { x: 0, y: 0, rotate: 0, scale: 1.0, opacity: 1 },
    startProgress: 0.06,
    endProgress: 0.18,
    zIndex: 10,
    labelPosition: { side: "left", offsetX: -160, offsetY: 0 },
  },
  {
    id: "linear-rail",
    name: "High-Precision Linear Rail",
    category: "PRECISION GUIDE",
    label: "DUAL AXIS LINEAR RAIL",
    image: "/images/product-assembly/processed/component-02-linear-rail.png",
    dimensions: { width: 300, height: 300, className: "w-[140px] sm:w-[200px] md:w-[260px] h-auto" },
    initial: { x: -280, y: -40, rotate: -20, scale: 0.7, opacity: 0 },
    final: { x: -140, y: 20, rotate: 0, scale: 0.9, opacity: 1 },
    startProgress: 0.16,
    endProgress: 0.28,
    zIndex: 15,
    labelPosition: { side: "left", offsetX: -140, offsetY: -30 },
  },
  {
    id: "power-unit",
    name: "High-Torque Servo Drive Unit",
    category: "MOTIVE POWER",
    label: "SERVO SPINDLE MOTOR",
    image: "/images/product-assembly/processed/component-08-power-unit.png",
    dimensions: { width: 220, height: 200, className: "w-[100px] sm:w-[140px] md:w-[170px] h-auto" },
    initial: { x: 20, y: -240, rotate: 15, scale: 0.65, opacity: 0 },
    final: { x: 0, y: -120, rotate: 0, scale: 0.95, opacity: 1 },
    startProgress: 0.26,
    endProgress: 0.38,
    zIndex: 20,
    labelPosition: { side: "right", offsetX: 140, offsetY: -40 },
  },
  {
    id: "carbide-endmill",
    name: "Solid Carbide Endmill Assembly",
    category: "CUTTING SYSTEM",
    label: "CARBIDE CUTTER HEAD",
    image: "/images/product-assembly/processed/component-03-carbide-endmill.png",
    dimensions: { width: 60, height: 240, className: "w-[30px] sm:w-[45px] md:w-[60px] h-auto" },
    initial: { x: 240, y: -60, rotate: 25, scale: 0.6, opacity: 0 },
    final: { x: 130, y: -30, rotate: 0, scale: 0.9, opacity: 1 },
    startProgress: 0.34,
    endProgress: 0.46,
    zIndex: 25,
    labelPosition: { side: "right", offsetX: 150, offsetY: 0 },
  },
  {
    id: "router-head",
    name: "Multi-Tool Router Head",
    category: "TOOLING MOUNT",
    label: "MULTI-AXIS ROTOR",
    image: "/images/product-assembly/processed/component-09-router-head.png",
    dimensions: { width: 240, height: 200, className: "w-[110px] sm:w-[150px] md:w-[190px] h-auto" },
    initial: { x: -240, y: 160, rotate: -35, scale: 0.6, opacity: 0 },
    final: { x: -110, y: -90, rotate: 0, scale: 0.85, opacity: 1 },
    startProgress: 0.42,
    endProgress: 0.54,
    zIndex: 22,
    labelPosition: { side: "left", offsetX: -140, offsetY: -20 },
  },
  {
    id: "round-gauge",
    name: "Digital Telemetry Gauge",
    category: "SENSING & CONTROL",
    label: "SUB-MICRON SENSOR GAUGE",
    image: "/images/product-assembly/processed/component-05-round-gauge.png",
    dimensions: { width: 180, height: 180, className: "w-[80px] sm:w-[110px] md:w-[140px] h-auto" },
    initial: { x: 220, y: -200, rotate: -20, scale: 0.5, opacity: 0 },
    final: { x: 140, y: -140, rotate: 0, scale: 0.85, opacity: 1 },
    startProgress: 0.48,
    endProgress: 0.58,
    zIndex: 30,
    labelPosition: { side: "right", offsetX: 130, offsetY: -30 },
  },
  {
    id: "carbide-insert",
    name: "Titanium Carbide Inserts",
    category: "INDEXABLE TOOLING",
    label: "HARDENED CUTTING INSERT",
    image: "/images/product-assembly/processed/component-04-carbide-insert.png",
    dimensions: { width: 120, height: 240, className: "w-[50px] sm:w-[70px] md:w-[90px] h-auto" },
    initial: { x: 220, y: 180, rotate: 40, scale: 0.5, opacity: 0 },
    final: { x: 90, y: 90, rotate: 0, scale: 0.8, opacity: 1 },
    startProgress: 0.54,
    endProgress: 0.64,
    zIndex: 32,
    labelPosition: { side: "right", offsetX: 130, offsetY: 20 },
  },
  {
    id: "torx-screw",
    name: "Precision Torx Fastener Set",
    category: "HARDWARE LOCKING",
    label: "M6 TORX HARDWARE",
    image: "/images/product-assembly/processed/component-07-torx-screw.png",
    dimensions: { width: 160, height: 160, className: "w-[60px] sm:w-[85px] md:w-[110px] h-auto" },
    initial: { x: -220, y: 160, rotate: 180, scale: 0.4, opacity: 0 },
    final: { x: -70, y: 110, rotate: 0, scale: 0.75, opacity: 1 },
    startProgress: 0.60,
    endProgress: 0.70,
    zIndex: 35,
    labelPosition: { side: "left", offsetX: -130, offsetY: 20 },
  },
];
