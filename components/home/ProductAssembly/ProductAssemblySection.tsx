"use client";

import { useRef } from "react";
import { useScroll } from "framer-motion";
import { AssemblyScene } from "./AssemblyScene";

export function ProductAssemblySection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[500vh] bg-[#f6f5f0] border-b border-slate-300/80"
    >
      <div className="sticky top-0 w-full h-screen overflow-hidden">
        <AssemblyScene scrollProgress={scrollYProgress} />
      </div>
    </section>
  );
}
