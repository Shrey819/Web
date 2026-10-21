"use client";

import { useRef } from "react";
import { useScroll, useReducedMotion } from "framer-motion";
import { AssemblyScene } from "./AssemblyScene";

export function ProductAssemblySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Reduced motion: completely unpinned, h-auto, instant rendering without scroll traps
  if (shouldReduceMotion) {
    return (
      <section
        data-scene="product-assembly"
        ref={sectionRef}
        className="relative w-full h-auto bg-[#f6f5f0] border-b border-slate-300/80 py-12 sm:py-20"
      >
        <div className="relative w-full h-auto">
          <AssemblyScene
            scrollProgress={scrollYProgress}
            isReducedMotion={true}
          />
        </div>
      </section>
    );
  }

  // Mobile: unpinned (h-auto), Desktop: calibrated 220vh-250vh pinned scroll stage
  return (
    <section
      data-scene="product-assembly"
      ref={sectionRef}
      className="relative w-full h-auto md:h-[220vh] lg:h-[250vh] bg-[#f6f5f0] border-b border-slate-300/80"
    >
      <div className="relative md:sticky md:top-0 w-full min-h-[600px] md:h-screen md:overflow-hidden">
        <AssemblyScene
          scrollProgress={scrollYProgress}
          isReducedMotion={false}
        />
      </div>
    </section>
  );
}
