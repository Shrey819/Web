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

  const isReduced = Boolean(shouldReduceMotion);

  return (
    <section
      data-scene="product-assembly"
      ref={sectionRef}
      className={`relative w-full bg-[#f6f5f0] border-b border-slate-300/80 ${
        isReduced ? "h-auto py-12 sm:py-20" : "h-auto md:h-[220vh] lg:h-[250vh]"
      }`}
    >
      <div
        className={
          isReduced
            ? "relative w-full h-auto"
            : "relative md:sticky md:top-0 w-full min-h-[600px] md:h-screen md:overflow-hidden"
        }
      >
        <AssemblyScene
          scrollProgress={scrollYProgress}
          isReducedMotion={isReduced}
        />
      </div>
    </section>
  );
}
