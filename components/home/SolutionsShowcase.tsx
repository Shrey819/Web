"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Factory,
  Box,
  Activity,
  Truck,
  Settings,
  ArrowRight,
  X,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BOMItem {
  partNo: string;
  name: string;
  category: string;
  specs: string;
  manufacturer: string;
}

interface Vertical {
  id: string;
  title: string;
  icon: any;
  description: string;
  stats: string;
  color: string;
  categorySlug: string;
  categoryName: string;
  bom: BOMItem[];
}

const VERTICALS: Vertical[] = [
  {
    id: "manufacturing",
    title: "Automotive & Discrete Manufacturing",
    icon: Factory,
    description:
      "Ultra-fast PROFINET PLCs, laser positioning, and heavy robotic servo axes for high-speed vehicle assembly lines.",
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
    icon: Box,
    description:
      "Synchronized multi-axis motion, vision rejection optical sensors, and IP69K washdown VFD drives.",
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
        partNo: "ACS380-0401-017A-4",
        name: "Machinery Washdown VFD",
        category: "Drives & Servo Motors",
        specs: "7.5kW, sensorless vector, IP66 washdown enclosure",
        manufacturer: "ABB",
      },
      {
        partNo: "UM30-213111",
        name: "Ultrasonic Liquid Fill Transducer",
        category: "Sensors & Perception",
        specs: "±0.2mm resolution, chemical-resistant Teflon head",
        manufacturer: "Sick",
      },
      {
        partNo: "NX-ECC203",
        name: "Decentralized High-Speed I/O Coupler",
        category: "PLCs & Controllers",
        specs: "1μs I/O refresh rate, EtherCAT slave, IP20 modular",
        manufacturer: "Omron",
      },
    ],
  },
  {
    id: "process",
    title: "Process & Fluid Automation",
    icon: Activity,
    description:
      "Hermetic pressure transmitters, SIL3 safety interlocks, and continuous flow monitoring for oil & chemical vats.",
    stats: "SIL3 / IP69K Rated",
    color: "from-amber-600/20 via-slate-900 to-slate-950",
    categorySlug: "sensors",
    categoryName: "Sensors & Perception",
    bom: [
      {
        partNo: "PMP71-AA11AA1AE8AE",
        name: "Cerabar Hermetic Pressure Transmitter",
        category: "Sensors & Perception",
        specs: "0.05% accuracy, 4-20mA HART, SIL3 certified",
        manufacturer: "Endress+Hauser",
      },
      {
        partNo: "XPSAK311144P",
        name: "Preventa Emergency Safety Interlock",
        category: "Safety Relays & Controllers",
        specs: "SIL3 / Cat 4, 3 N/O safety contacts, 24V AC/DC",
        manufacturer: "Schneider Electric",
      },
      {
        partNo: "8732EMT1A1",
        name: "Continuous Magnetic Flow Transmitter",
        category: "Flow & Process Sensors",
        specs: "Sub-0.1% volumetric flow precision, dual-frequency",
        manufacturer: "Rosemount",
      },
      {
        partNo: "ATV630U55N4",
        name: "Process Pump & Fan Controller VFD",
        category: "Drives & Servo Motors",
        specs: "5.5kW, low harmonic, integrated fluid macro routines",
        manufacturer: "Schneider Electric",
      },
    ],
  },
  {
    id: "material-handling",
    title: "Warehouse & Material Handling",
    icon: Truck,
    description:
      "Variable frequency drives for heavy conveyors, automated sorters, and laser barcode pallet positioning.",
    stats: "24/7 Heavy Duty",
    color: "from-purple-600/20 via-slate-900 to-slate-950",
    categorySlug: "drives",
    categoryName: "Drives & Servo Motors",
    bom: [
      {
        partNo: "ACS580-01-045A-4",
        name: "Heavy Conveyor Frequency Inverter",
        category: "Drives & Servo Motors",
        specs: "22kW, 150% overload for 60s, EMC filter Class C2",
        manufacturer: "ABB",
      },
      {
        partNo: "MATRIX-320-100-010",
        name: "High-Speed 2D Matrix Barcode Reader",
        category: "Vision & Identification",
        specs: "60 fps CMOS, liquid lens autofocus, PROFINET",
        manufacturer: "Datalogic",
      },
      {
        partNo: "EZS-4-900",
        name: "Safety Light Curtain Sorter Protection",
        category: "Safety & Light Curtains",
        specs: "14mm resolution, 0-6m range, Type 4 SIL3",
        manufacturer: "Banner Engineering",
      },
      {
        partNo: "ET200SP-IM155-6PN",
        name: "Multi-Drop Conveyor Remote I/O Head",
        category: "Remote I/O Modules",
        specs: "32 I/O module capacity, PROFINET redundant ring",
        manufacturer: "Siemens",
      },
    ],
  },
];

export function SolutionsShowcase() {
  const [selectedVertical, setSelectedVertical] = useState<Vertical | null>(null);

  const getQuoteUrl = (v: Vertical) => {
    const bomSummary = v.bom
      .map((item, i) => `${i + 1}. [${item.manufacturer}] ${item.partNo} - ${item.name} (${item.specs})`)
      .join("\n");
    return `/quote?notes=${encodeURIComponent(`Architectural BOM Request for ${v.title}:\n\n${bomSummary}`)}&scope=${encodeURIComponent(v.title)}`;
  };

  return (
    <section className="py-24 bg-slate-950 text-white border-b border-slate-900 relative overflow-hidden">
      <div className="content-shell relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-2 type-label text-sky-400 bg-sky-500/10 px-3.5 py-1.5 rounded-full border border-sky-500/20">
            <Settings className="w-3.5 h-3.5" />
            Tailored Industry Vertical Solutions
          </span>
          <h2 className="section-title font-mono text-white">
            Engineered for Demanding Industrial Vertical Ecosystems
          </h2>
          <p className="text-sm text-slate-300">
            Explore turnkey hardware bills-of-materials optimized for high throughput, heavy environmental washdown, and zero unplanned downtime.
          </p>
        </div>

        {/* 4 Immersive Industry Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VERTICALS.map((v, idx) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`group relative bg-gradient-to-br ${v.color} rounded-3xl p-8 border border-slate-800 hover:border-sky-500/60 shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer`}
                onClick={() => setSelectedVertical(v)}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-sky-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="type-technical font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      {v.stats}
                    </span>
                  </div>

                  <h3 className="type-section-title text-white mb-3 group-hover:text-sky-400 transition-colors">
                    {v.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed mb-8">
                    {v.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-white group-hover:text-sky-400">
                  <span className="group-hover:underline">View Vertical Architecture BOM</span>
                  <div className="w-8 h-8 rounded-full bg-slate-900 group-hover:bg-sky-500 group-hover:text-slate-950 flex items-center justify-center transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Interactive Vertical Architecture BOM Modal */}
      <AnimatePresence>
        {selectedVertical && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVertical(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden z-10 text-white my-8 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 sm:p-8 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 text-sky-400 flex items-center justify-center shrink-0">
                    <selectedVertical.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        {selectedVertical.stats}
                      </span>
                      <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-slate-400">
                        BOM V4.2 ARCHITECTURE
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-mono text-white">
                      {selectedVertical.title}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedVertical(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Body: BOM Lines & Architecture Specs */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
                <div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {selectedVertical.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-mono text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                      Verified Hardware Bill of Materials (BOM)
                    </h4>
                    <span className="font-mono text-[10px] text-slate-500">
                      4 Recommended Components
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {selectedVertical.bom.map((item, index) => (
                      <div
                        key={item.partNo}
                        className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-slate-500">
                              #{index + 1}
                            </span>
                            <span className="font-mono text-xs font-extrabold text-sky-400">
                              {item.partNo}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                              {item.manufacturer}
                            </span>
                          </div>
                          <div className="font-bold text-sm text-white">
                            {item.name}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            {item.specs}
                          </div>
                        </div>

                        <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Stock Ready
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 sm:p-8 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link
                  href={`/category/${selectedVertical.categorySlug}`}
                  onClick={() => setSelectedVertical(null)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition-colors border border-slate-700"
                >
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>Explore {selectedVertical.categoryName} Catalog</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href={getQuoteUrl(selectedVertical)}
                  onClick={() => setSelectedVertical(null)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs sm:text-sm transition-colors shadow-lg shadow-sky-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Request Custom BOM Quote</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

