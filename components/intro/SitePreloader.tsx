"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";

const STORAGE_KEY = "has_seen_site_preloader";

// ==========================================
// AUDIO HELPER FOR AUTHENTIC TEAR SOUND
// ==========================================
function playAudio(name: string, volume = 0.7) {
  try {
    const soundMap: Record<string, string> = {
      paperTear: "/sounds/papersound.mp3",
    };
    const src = soundMap[name];
    if (src) {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.play().catch(() => {});
    }
  } catch {}
}

// ==========================================
// EXACT PAPER-TEAR SITE PRELOADER (First Visit Only)
// ==========================================
export function SitePreloader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftHalfRef = useRef<HTMLDivElement>(null);
  const rightHalfRef = useRef<HTMLDivElement>(null);
  const pathLeftRef = useRef<SVGPathElement>(null);
  const pathRightRef = useRef<SVGPathElement>(null);
  const textLeftRef = useRef<HTMLSpanElement>(null);
  const textRightRef = useRef<HTMLSpanElement>(null);

  const [isDone, setIsDone] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const alreadySeen = sessionStorage.getItem(STORAGE_KEY);
      if (alreadySeen) {
        setIsDone(true);
      } else {
        setIsDone(false);
      }
    } catch {
      setIsDone(false);
    }
    setMounted(true);
  }, []);

  // Generate jagged tear points along the middle crack line
  const tearPoints = useMemo(() => {
    const points: [number, number][] = [];
    const segments = 14;
    points.push([50, 0]);
    for (let i = 1; i < segments; i++) {
      const y = (i / segments) * 100;
      const xOffset = (Math.random() - 0.5) * 6.5;
      points.push([50 + xOffset, y]);
    }
    points.push([50, 100]);
    return points;
  }, []);

  const svgPathData = useMemo(() => {
    return tearPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]} `).join(" ");
  }, [tearPoints]);

  const leftClipPoly = useMemo(() => {
    let poly = "0% 0%, ";
    tearPoints.forEach((p) => {
      poly += `${p[0]}% ${p[1]}%, `;
    });
    poly += "0% 100%";
    return `polygon(${poly})`;
  }, [tearPoints]);

  const rightClipPoly = useMemo(() => {
    let poly = "100% 0%, 100% 100%, ";
    [...tearPoints].reverse().forEach((p) => {
      poly += `${p[0]}% ${p[1]}%, `;
    });
    return `polygon(${poly.slice(0, -2)})`;
  }, [tearPoints]);

  const pathLength = 120;

  const markAsSeen = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {}
  };

  useEffect(() => {
    if (!mounted || isDone) return;

    const tracker = { val: 0 };

    gsap.to(tracker, {
      val: 100,
      duration: 1.8,
      ease: "power2.out",
      onUpdate: () => {
        const val = tracker.val;
        const safeProgress = Math.min(100, Math.max(0, val));
        const strokeDashoffset = pathLength - (pathLength * safeProgress) / 100;
        const text = `${Math.round(safeProgress)}%`;

        if (textLeftRef.current) textLeftRef.current.innerText = text;
        if (textRightRef.current) textRightRef.current.innerText = text;
        if (pathLeftRef.current) pathLeftRef.current.style.strokeDashoffset = `${strokeDashoffset}`;
        if (pathRightRef.current) pathRightRef.current.style.strokeDashoffset = `${strokeDashoffset}`;
      },
      onComplete: () => {
        // Play paper tearing sound
        playAudio("paperTear", 0.85);
        markAsSeen();

        const tl = gsap.timeline({
          onComplete: () => {
            setIsDone(true);
          },
        });

        tl.to({}, { duration: 0.1 });

        // Left paper half slides and rotates out to the left
        tl.to(
          leftHalfRef.current,
          {
            xPercent: -100,
            rotation: -2.5,
            duration: 1.25,
            ease: "power3.inOut",
          },
          "tear"
        );

        // Right paper half slides and rotates out to the right
        tl.to(
          rightHalfRef.current,
          {
            xPercent: 100,
            rotation: 2.5,
            duration: 1.25,
            ease: "power3.inOut",
          },
          "tear"
        );

        // Fade out container
        tl.to(
          containerRef.current,
          {
            opacity: 0,
            duration: 0.35,
          },
          "-=0.3"
        );
      },
    });
  }, [mounted, isDone]);

  const handleSkip = () => {
    markAsSeen();
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => setIsDone(true),
      });
    } else {
      setIsDone(true);
    }
  };

  if (!mounted || isDone) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100000] overflow-hidden pointer-events-auto select-none font-mono"
    >
      {/* Skip button in corner */}
      <div className="absolute top-4 right-4 z-[100002]">
        <button
          type="button"
          onClick={handleSkip}
          className="px-3 py-1.5 bg-black text-white rounded-lg border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)] text-xs font-bold font-mono tracking-wider uppercase flex items-center gap-1 hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <span>Skip</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* LEFT HALF */}
      <div
        ref={leftHalfRef}
        className="absolute top-0 bottom-0 left-0 w-full h-full bg-[#fbfaf7] bg-cover bg-center will-change-transform shadow-[0_0_15px_rgba(0,0,0,0.12)]"
        style={{
          clipPath: leftClipPoly,
          backgroundImage: "url('/textures/paper-texture.webp')",
        }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-20 flex items-center justify-center">
          <span
            ref={textLeftRef}
            className="text-4xl md:text-5xl font-extrabold tracking-wider text-black mix-blend-multiply"
          >
            0%
          </span>
        </div>
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            ref={pathLeftRef}
            d={svgPathData}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="0.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: pathLength,
            }}
          />
        </svg>
      </div>

      {/* RIGHT HALF */}
      <div
        ref={rightHalfRef}
        className="absolute top-0 bottom-0 right-0 w-full h-full bg-[#fbfaf7] bg-cover bg-center will-change-transform shadow-[0_0_15px_rgba(0,0,0,0.12)]"
        style={{
          clipPath: rightClipPoly,
          backgroundImage: "url('/textures/paper-texture.webp')",
        }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-20 flex items-center justify-center">
          <span
            ref={textRightRef}
            className="text-4xl md:text-5xl font-extrabold tracking-wider text-black mix-blend-multiply"
          >
            0%
          </span>
        </div>
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            ref={pathRightRef}
            d={svgPathData}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="0.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: pathLength,
            }}
          />
        </svg>
      </div>

      {/* Rotating Ring Loader */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 pointer-events-none z-30">
        <svg width="128" height="128" viewBox="0 0 100 100" className="animate-spin" style={{ animationDuration: "10s" }}>
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#000"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="10 15"
            opacity="0.8"
          />
          <circle
            cx="50"
            cy="50"
            r="34"
            fill="none"
            stroke="#000"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="5 10"
            opacity="0.5"
            className="animate-spin"
            style={{
              animationDirection: "reverse",
              animationDuration: "4s",
              transformOrigin: "50% 50%",
            }}
          />
        </svg>
      </div>
    </div>
  );
}
