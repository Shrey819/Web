"use client";

import Image from "next/image";
import { motion, useTransform, MotionValue } from "framer-motion";
import { AssemblyComponentConfig } from "./assemblyData";

interface AssemblyComponentProps {
  config: AssemblyComponentConfig;
  progress: MotionValue<number>;
  isMobile: boolean;
}

export function AssemblyComponent({ config, progress, isMobile }: AssemblyComponentProps) {
  // Mobile factor to scale down translation distances on smaller screens
  const distanceFactor = isMobile ? 0.45 : 1.0;
  const scaleFactor = isMobile ? 0.7 : 1.0;

  const startP = config.startProgress;
  const endP = config.endProgress;

  // Transform interpolation values
  const x = useTransform(
    progress,
    [0, startP, endP, 1],
    [config.initial.x * distanceFactor * 1.3, config.initial.x * distanceFactor, config.final.x * distanceFactor, config.final.x * distanceFactor]
  );

  const y = useTransform(
    progress,
    [0, startP, endP, 1],
    [config.initial.y * distanceFactor * 1.3, config.initial.y * distanceFactor, config.final.y * distanceFactor, config.final.y * distanceFactor]
  );

  const rotate = useTransform(
    progress,
    [startP, endP],
    [config.initial.rotate, config.final.rotate]
  );

  const scale = useTransform(
    progress,
    [0, startP, endP, 1],
    [
      config.initial.scale * scaleFactor * 0.85,
      config.initial.scale * scaleFactor,
      config.final.scale * scaleFactor,
      config.final.scale * scaleFactor
    ]
  );

  // Guarantee strictly monotonic non-decreasing input array: p1 < p2 < p3 < p4
  const p1 = Math.max(0, startP - 0.04);
  const p2 = Math.max(p1 + 0.01, startP + 0.02);
  const p3 = Math.max(p2 + 0.01, Math.min(endP, 0.64));
  const p4 = Math.max(p3 + 0.01, 0.71);

  const opacity = useTransform(
    progress,
    [p1, p2, p3, p4],
    [0, 1, 1, 0]
  );

  const lp1 = Math.max(0, startP + 0.01);
  const lp2 = Math.max(lp1 + 0.01, startP + 0.05);
  const lp3 = Math.max(lp2 + 0.01, Math.min(endP, 0.64));
  const lp4 = Math.max(lp3 + 0.01, 0.68);

  const labelOpacity = useTransform(
    progress,
    [lp1, lp2, lp3, lp4],
    [0, 1, 1, 0]
  );

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
      style={{
        x,
        y,
        rotate,
        scale,
        opacity,
        zIndex: config.zIndex,
        willChange: "transform, opacity",
      }}
    >
      <div className="relative group flex items-center justify-center">
        {/* Component Image with Proportional Dimension Class */}
        <div className={`relative ${config.dimensions.className} flex items-center justify-center`}>
          <Image
            src={config.image}
            alt={config.name}
            width={config.dimensions.width}
            height={config.dimensions.height}
            className="w-full h-auto object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.18)] pointer-events-none"
            priority
            unoptimized
          />
        </div>

        {/* Dynamic HUD Technical Callout Label */}
        {config.labelPosition && !isMobile && (
          <motion.div
            style={{ opacity: labelOpacity }}
            className={`absolute flex items-center gap-2 pointer-events-none whitespace-nowrap z-50 ${
              config.labelPosition.side === "left"
                ? "right-full mr-3 flex-row-reverse"
                : config.labelPosition.side === "right"
                ? "left-full ml-3 flex-row"
                : "bottom-full mb-3 flex-col"
            }`}
          >
            {/* Technical Connector Line */}
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-amber-500/30" />
              <div className="w-8 h-[1px] bg-gradient-to-r from-amber-500/80 to-slate-400/40" />
            </div>

            {/* Label Card */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-amber-500/40 px-3 py-1.5 rounded-lg shadow-lg">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                  {config.category}
                </span>
                <span className="font-mono text-xs font-semibold text-white tracking-wide">
                  {config.label}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
