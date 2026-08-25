"use client";

import { useMotionValue } from "framer-motion";
import { AssemblyScene } from "@/components/home/ProductAssembly/AssemblyScene";

/**
 * Static admin preview of the Product Assembly section.
 * Uses a fixed scroll progress of 0.40 so all the parts are
 * visible mid-flight without requiring any real page scroll.
 */
export function AssemblyScenePreview() {
  // Freeze at 40 % scroll — every part is visible and scattered
  const frozenProgress = useMotionValue(0.4);

  return (
    <div
      id="sec-assembly"
      className="relative w-full bg-[#f6f5f0] border-b border-slate-300/80 overflow-hidden"
      style={{ height: "560px" }}
    >
      {/* Full-height static snapshot of the scene */}
      <div className="w-full h-full">
        <AssemblyScene scrollProgress={frozenProgress} />
      </div>

      {/* Admin overlay badge */}
      <div className="absolute top-3 right-3 z-50 bg-amber-400/90 text-slate-950 text-[10px] font-black font-mono uppercase tracking-widest px-3 py-1 rounded-full shadow-lg pointer-events-none">
        📐 Assembly Preview (scroll-driven on live site)
      </div>
    </div>
  );
}
