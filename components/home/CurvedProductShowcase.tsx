"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";

export interface MotionProductItem {
  id: string;
  name: string;
  category?: string;
  brand?: string;
  price?: number | string;
  imageUrl: string;
  slug: string;
}

export interface CurvedProductShowcaseProps {
  products?: MotionProductItem[];
  badgeText?: string;
  headlineLine1?: string;
  headlineLine2?: string;
  sublineText?: string;
  noteTopText?: string;
  noteBottomText?: string;
  ctaText?: string;
  ctaUrl?: string;
}

// 10 Fallback real Ballscrew & Linear Guideway products verified from the database
const VERIFIED_FALLBACK_PRODUCTS: MotionProductItem[] = [
  {
    id: "prd_sample01",
    name: "HIWIN Precision Ground Ballscrew R40-10B2",
    brand: "HIWIN",
    category: "Ballscrew",
    price: 18500,
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800",
    slug: "hiwin-precision-ground-ballscrew-r40-10",
  },
  {
    id: "cl0cb4fa2a7e790d4409ce1009",
    name: "HIWIN HGH25CA Heavy Load Linear Guideway Block",
    brand: "HIWIN",
    category: "Linear Guideway",
    price: 3400,
    imageUrl: "https://res.cloudinary.com/hecyltpu/image/upload/v1785590290/Screenshot_2026-05-07_210349_bnhfgy.png",
    slug: "hiwin-hgh25ca-heavy-load-linear-guideway-block",
  },
  {
    id: "prd_804b391bf3117431",
    name: "HIWIN EG Series Low Profile Linear Guideway",
    brand: "HIWIN",
    category: "Linear Guideway",
    price: 2500,
    imageUrl: "https://res.cloudinary.com/hecyltpu/image/upload/v1788819936/products/cmklq8thmjvyl2psqc0c.jpg",
    slug: "hiwin-eg-series",
  },
  {
    id: "prd_99bbbc3667d7ce93",
    name: "HIWIN E2 Self-Lubricating Ballscrew",
    brand: "HIWIN",
    category: "Ballscrew",
    price: 2500,
    imageUrl: "https://res.cloudinary.com/hecyltpu/image/upload/v1788819936/products/rih3jjv0sbxgrov5bhkp.jpg",
    slug: "hiwin-e2-self-lubricating-ballscrew",
  },
  {
    id: "cl19d6f4b50cf283ced8ac1413",
    name: "Rexroth Ball Rail Runner Block BSHP R1651",
    brand: "Bosch Rexroth",
    category: "Linear Guideway",
    price: 5200,
    imageUrl: "https://res.cloudinary.com/hecyltpu/image/upload/v1785595269/propel_products/nbrj8wthoma3aimgf0fs.png",
    slug: "rexroth-ball-rail-runner-block-bshp-r165121420",
  },
  {
    id: "prd_8639d85e918bb7cd",
    name: "HIWIN Heavy Duty High-Load Ballscrew",
    brand: "HIWIN",
    category: "Ballscrew",
    price: 2500,
    imageUrl: "https://res.cloudinary.com/hecyltpu/image/upload/v1788819938/products/om7exnrljlp6axknvvtb.jpg",
    slug: "hiwin-heavy-duty-ballscrew",
  },
  {
    id: "clf0c85375f8e894d3bd3f3c66",
    name: "THK HSR30A Heavy Load Flanged Linear Guide Block",
    brand: "THK",
    category: "Linear Guideway",
    price: 5800,
    imageUrl: "https://res.cloudinary.com/hecyltpu/image/upload/v1786262976/Screenshot_2026-05-09_061038_ltlkmx.png",
    slug: "thk-hsr30a-heavy-load-flanged-linear-guide-block",
  },
  {
    id: "prd_530d655efab8276a",
    name: "HIWIN Internal Circulation Precision Ballscrew",
    brand: "HIWIN",
    category: "Ballscrew",
    price: 2500,
    imageUrl: "https://res.cloudinary.com/hecyltpu/image/upload/v1788819938/products/ymqt5uevirdrprtpiul6.jpg",
    slug: "hiwin-internal-circulation-ballscrew",
  },
  {
    id: "cl4fb891abd71bb867fa217736",
    name: "THK SHS25C Precision Caged Ball Linear Guide",
    brand: "THK",
    category: "Linear Guideway",
    price: 4600,
    imageUrl: "https://res.cloudinary.com/hecyltpu/image/upload/v1785588776/WhatsApp_Image_2026-06-30_at_4.34.09_PM_we7jhu.jpg",
    slug: "thk-shs25c-precision-caged-ball-linear-guide-block",
  },
  {
    id: "prd_b865d56994aec059",
    name: "HIWIN End Cap High Rigidity Ballscrew",
    brand: "HIWIN",
    category: "Ballscrew",
    price: 2500,
    imageUrl: "https://res.cloudinary.com/hecyltpu/image/upload/v1788819936/products/mtn4xhnbyvbd1mttloi6.jpg",
    slug: "hiwin-end-cap-ballscrew",
  },
];

/**
 * Rounded Quadrilateral Path Generator
 * Computes tangent rounded corners of radius r on an arbitrary quadrilateral.
 */
function buildRoundedQuadPath(
  w: number,
  y_tl: number,
  y_tr: number,
  y_br: number,
  y_bl: number,
  r: number
): string {
  const p1 = { x: 0, y: y_tl };
  const p2 = { x: w, y: y_tr };
  const p3 = { x: w, y: y_br };
  const p4 = { x: 0, y: y_bl };

  const dxTop = p2.x - p1.x;
  const dyTop = p2.y - p1.y;
  const lenTop = Math.hypot(dxTop, dyTop) || 1;
  const uxTop = dxTop / lenTop;
  const uyTop = dyTop / lenTop;

  const dxBot = p4.x - p3.x;
  const dyBot = p4.y - p3.y;
  const lenBot = Math.hypot(dxBot, dyBot) || 1;
  const uxBot = dxBot / lenBot;
  const uyBot = dyBot / lenBot;

  const a1 = { x: 0, y: y_tl + r };
  const b1 = { x: p1.x + r * uxTop, y: p1.y + r * uyTop };

  const a2 = { x: p2.x - r * uxTop, y: p2.y - r * uyTop };
  const b2 = { x: w, y: y_tr + r };

  const a3 = { x: w, y: y_br - r };
  const b3 = { x: p3.x + r * uxBot, y: p3.y + r * uyBot };

  const a4 = { x: p4.x - r * uxBot, y: p4.y - r * uyBot };
  const b4 = { x: 0, y: y_bl - r };

  return (
    `M ${a1.x.toFixed(2)} ${a1.y.toFixed(2)} ` +
    `Q ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} ${b1.x.toFixed(2)} ${b1.y.toFixed(2)} ` +
    `L ${a2.x.toFixed(2)} ${a2.y.toFixed(2)} ` +
    `Q ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} ${b2.x.toFixed(2)} ${b2.y.toFixed(2)} ` +
    `L ${a3.x.toFixed(2)} ${a3.y.toFixed(2)} ` +
    `Q ${p3.x.toFixed(2)} ${p3.y.toFixed(2)} ${b3.x.toFixed(2)} ${b3.y.toFixed(2)} ` +
    `L ${a4.x.toFixed(2)} ${a4.y.toFixed(2)} ` +
    `Q ${p4.x.toFixed(2)} ${p4.y.toFixed(2)} ${b4.x.toFixed(2)} ${b4.y.toFixed(2)} Z`
  );
}

export function CurvedProductShowcase({
  products = [],
  badgeText = "Trusted by 5,000+ CNC & Automation Builders",
  headlineLine1 = "Captivate Performance",
  headlineLine2 = "with Precision Ballscrews & Guides",
  sublineText = "Power your CNC machinery, Cartesian robots, and high-speed automation with ground ball screws and hardened linear guides. Zero backlash, heavy load capacity, and extreme durability.",
  noteTopText = "Zero backlash\nin stock",
  noteBottomText = "Ready to ship",
  ctaText = "Explore Ballscrews & Guides",
  ctaUrl = "/category/ballscrew",
}: CurvedProductShowcaseProps) {
  // Ensure we always have 10 products for the smooth cylinder carousel
  const displayProducts = useMemo(() => {
    const list: MotionProductItem[] = [];
    if (products && products.length > 0) {
      products.forEach((p) => {
        if (p.imageUrl && p.imageUrl.startsWith("http")) {
          list.push(p);
        }
      });
    }

    if (list.length < 10) {
      for (const item of VERIFIED_FALLBACK_PRODUCTS) {
        if (!list.find((p) => p.slug === item.slug) && list.length < 10) {
          list.push(item);
        }
      }
    }

    // If still less than 10, duplicate until 10 items
    while (list.length < 10) {
      const copy = { ...VERIFIED_FALLBACK_PRODUCTS[list.length % VERIFIED_FALLBACK_PRODUCTS.length] };
      copy.id = `${copy.id}_dup_${list.length}`;
      list.push(copy);
    }

    return list.slice(0, 10);
  }, [products]);

  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const desktopStageRef = useRef<HTMLDivElement>(null);
  const desktopCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const mobileStageRef = useRef<HTMLDivElement>(null);
  const mobileCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Carousel physics state
  const NUM_CARDS = 10;
  const PITCH_BASE = 196.0;
  const TOTAL_LOOP = PITCH_BASE * NUM_CARDS;

  const scrollOffsetRef = useRef(1568.0);
  const baseSpeedRef = useRef(50.0); // units per second
  const momentumVelocityRef = useRef(0.0);
  const isDraggingRef = useRef(false);
  const pointerStartXRef = useRef(0);
  const lastPointerXRef = useRef(0);
  const lastPointerTimeRef = useRef(0);
  const totalDragDistanceRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const isHoveredRef = useRef(false);

  // Formatting currency
  const formatPrice = (val?: number | string) => {
    if (!val) return "₹2,500";
    const num = typeof val === "number" ? val : parseFloat(val.toString().replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return "₹2,500";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  useEffect(() => {
    let animId: number;

    const updateGeometry = () => {
      const isMobile = window.innerWidth <= 820;
      const stage = isMobile ? mobileStageRef.current : desktopStageRef.current;
      const cards = isMobile ? mobileCardRefs.current : desktopCardRefs.current;
      if (!stage) return;

      const stageW = stage.clientWidth || window.innerWidth;

      let u: number, centerX: number, yCenterBase: number, pitch: number, widthScale: number, heightScale: number;

      if (isMobile) {
        centerX = stageW / 2;
        yCenterBase = 138;
        const mobScale = Math.min(1.0, stageW / 390);
        pitch = 124 * mobScale;
        widthScale = 0.64 * mobScale;
        heightScale = 0.76;
        u = 1;
      } else {
        const contW = containerRef.current?.clientWidth || 1440;
        u = Math.min(contW / 1440, 1.0);
        centerX = 720;
        yCenterBase = 687;
        pitch = PITCH_BASE;
        widthScale = 1.0;
        heightScale = 1.0;
      }

      const totalTrack = pitch * NUM_CARDS;
      const stageWidth = isMobile ? stageW : 1440;
      const margin = isMobile ? 30 : 300;

      for (let i = 0; i < NUM_CARDS; i++) {
        const cardEl = cards[i];
        if (!cardEl) continue;

        let t = (i * pitch - scrollOffsetRef.current) % totalTrack;
        while (t > totalTrack / 2) t -= totalTrack;
        while (t < -totalTrack / 2) t += totalTrack;

        let x_c: number, w: number, h_L: number, h_R: number, y_c: number;

        if (isMobile) {
          const dNorm = Math.abs(t) / (centerX * 0.95);
          x_c = centerX + t * (1.0 + 0.07 * (dNorm * dNorm));
          const d = Math.min(1.5, Math.abs(x_c - centerX) / (centerX * 0.9));
          w = (112 + 24 * (d * d)) * widthScale;

          const x_L = x_c - w / 2;
          const x_R = x_c + w / 2;
          const q_L = Math.abs(x_L - centerX) / (centerX * 0.9);
          const q_R = Math.abs(x_R - centerX) / (centerX * 0.9);

          h_L = (175 + 50 * Math.pow(q_L, 2.4)) * heightScale;
          h_R = (175 + 50 * Math.pow(q_R, 2.4)) * heightScale;
          y_c = yCenterBase - 6 * (d * d);
        } else {
          // Exact cylinder formula:
          const ratioT = t / 706.0;
          x_c = 720.0 + t * (1.0 + 0.083 * (ratioT * ratioT));
          const d = Math.abs(x_c - 720.0) / 706.0;

          w = 170.0 + 48.0 * (d * d);

          const x_L = x_c - w / 2.0;
          const x_R = x_c + w / 2.0;

          const q_L = Math.abs(x_L - 720.0) / 706.0;
          const q_R = Math.abs(x_R - 720.0) / 706.0;

          h_L = 280.0 + 92.0 * Math.pow(q_L, 2.6);
          h_R = 280.0 + 92.0 * Math.pow(q_R, 2.6);

          y_c = 687.0 - 12.0 * (d * d);
        }

        const top_L = y_c - h_L / 2.0;
        const bot_L = y_c + h_L / 2.0;
        const top_R = y_c - h_R / 2.0;
        const bot_R = y_c + h_R / 2.0;

        const boxX = x_c - w / 2.0;
        const boxY = Math.min(top_L, top_R);
        const boxH = Math.max(bot_L, bot_R) - boxY;

        if (boxX + w < -margin || boxX > stageWidth + margin) {
          cardEl.style.display = "none";
          continue;
        }
        cardEl.style.display = "block";

        const px_x = boxX * u;
        const px_y = boxY * u;
        const px_w = w * u;
        const px_h = boxH * u;

        const px_ytl = (top_L - boxY) * u;
        const px_ybl = (bot_L - boxY) * u;
        const px_ytr = (top_R - boxY) * u;
        const px_ybr = (bot_R - boxY) * u;
        const px_r = Math.min(15.0 * u, px_w * 0.16);

        const pathD = buildRoundedQuadPath(px_w, px_ytl, px_ytr, px_ybr, px_ybl, px_r);

        cardEl.style.left = `${px_x}px`;
        cardEl.style.top = `${px_y}px`;
        cardEl.style.width = `${px_w}px`;
        cardEl.style.height = `${px_h}px`;
        cardEl.style.clipPath = `path('${pathD}')`;
        cardEl.style.setProperty("-webkit-clip-path", `path('${pathD}')`);
      }
    };

    const tick = (now: number) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = now;
      const dt = Math.min(0.1, (now - lastTimestampRef.current) / 1000.0);
      lastTimestampRef.current = now;

      if (!isDraggingRef.current) {
        if (Math.abs(momentumVelocityRef.current) > 2) {
          scrollOffsetRef.current += momentumVelocityRef.current * dt;
          momentumVelocityRef.current *= Math.pow(0.05, dt);
        } else {
          momentumVelocityRef.current = 0;
          if (!isHoveredRef.current) {
            scrollOffsetRef.current += baseSpeedRef.current * dt;
          }
        }
      }

      updateGeometry();
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    // Pointer Drag Handlers
    const setupPointerEvents = (st: HTMLDivElement | null) => {
      if (!st) return () => {};

      const onPointerDown = (e: PointerEvent) => {
        isDraggingRef.current = true;
        st.classList.add("is-dragging");
        pointerStartXRef.current = e.clientX;
        lastPointerXRef.current = e.clientX;
        lastPointerTimeRef.current = performance.now();
        totalDragDistanceRef.current = 0;
        momentumVelocityRef.current = 0;
        try {
          st.setPointerCapture(e.pointerId);
        } catch (_) {}
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isDraggingRef.current) return;
        const now = performance.now();
        const dx = e.clientX - lastPointerXRef.current;
        const dt = Math.max(1, now - lastPointerTimeRef.current) / 1000.0;

        totalDragDistanceRef.current += Math.abs(dx);

        const isMobile = window.innerWidth <= 820;
        const contW = containerRef.current?.clientWidth || 1440;
        const u = isMobile ? 1 : Math.min(contW / 1440, 1.0);

        const dx_u = dx / u;
        scrollOffsetRef.current -= dx_u;

        const instantVelocity = -dx_u / dt;
        momentumVelocityRef.current = momentumVelocityRef.current * 0.4 + instantVelocity * 0.6;

        lastPointerXRef.current = e.clientX;
        lastPointerTimeRef.current = now;
      };

      const onPointerUp = (e: PointerEvent) => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        st.classList.remove("is-dragging");
        try {
          st.releasePointerCapture(e.pointerId);
        } catch (_) {}

        const maxMomentum = 1200;
        momentumVelocityRef.current = Math.max(-maxMomentum, Math.min(maxMomentum, momentumVelocityRef.current));
      };

      st.addEventListener("pointerdown", onPointerDown);
      st.addEventListener("pointermove", onPointerMove);
      st.addEventListener("pointerup", onPointerUp);
      st.addEventListener("pointercancel", onPointerUp);

      return () => {
        st.removeEventListener("pointerdown", onPointerDown);
        st.removeEventListener("pointermove", onPointerMove);
        st.removeEventListener("pointerup", onPointerUp);
        st.removeEventListener("pointercancel", onPointerUp);
      };
    };

    const cleanupDesktop = setupPointerEvents(desktopStageRef.current);
    const cleanupMobile = setupPointerEvents(mobileStageRef.current);

    return () => {
      cancelAnimationFrame(animId);
      cleanupDesktop();
      cleanupMobile();
    };
  }, []);

  // Safe navigation handler: prevent click if dragged more than 6px
  const handleCardClick = (e: React.MouseEvent, slug: string) => {
    if (totalDragDistanceRef.current > 6) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#F5F8EF] text-[#101410] overflow-hidden select-none border-t border-b border-[#E3E8DC]"
      style={{
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      aria-label="Precision Ballscrew and Linear Guideway Showcase"
    >
      {/* Import Google Fonts for Caveat handwritten notes & Inter Tight */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Inter+Tight:wght@700&family=Inter:wght@400;500;600;700&display=swap");

        .font-caveat {
          font-family: "Caveat", cursive;
        }
        .font-inter-tight {
          font-family: "Inter Tight", "Inter", sans-serif;
        }

        .cylinder-stage {
          cursor: grab;
          touch-action: pan-y;
          overflow: hidden;
          contain: layout paint;
        }
        .cylinder-stage.is-dragging {
          cursor: grabbing;
        }

        .cylinder-card {
          position: absolute;
          overflow: hidden;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transform: translateZ(0);
          will-change: transform, clip-path, left, top, width, height;
          box-shadow: 0 4px 20px rgba(8, 72, 45, 0.08);
          background: #ffffff;
          transition: filter 0.25s ease, box-shadow 0.25s ease;
        }

        .cylinder-card:hover {
          box-shadow: 0 8px 30px rgba(8, 72, 45, 0.16);
        }

        .cylinder-card:hover .action-pill {
          transform: scale(1.1);
          background: rgba(8, 72, 45, 0.95);
          color: #ffffff;
        }

        .cylinder-card:hover .product-img {
          transform: scale(1.05);
        }

        .draw-stroke {
          stroke: #08482d;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
      `}</style>

      {/* =========================================================================
          DESKTOP CONTAINER (min-width: 821px) — Exact Proportioned 1440x1080 Frame
          ========================================================================= */}
      <div
        ref={containerRef}
        className="hidden md:block relative mx-auto w-full max-w-[1440px] h-[1000px] lg:h-[1080px]"
        style={{
          // --u scales cleanly with container width up to 1440px
          // @ts-ignore
          "--u": "min(100vw / 1440, 1px)",
        }}
        onMouseEnter={() => {
          isHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
        }}
      >
        {/* Top Trust Badge */}
        <div
          className="absolute z-30 flex items-center justify-center gap-2 rounded-full px-5 py-2 shadow-xs transition-transform hover:scale-102"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            top: "calc(115 * var(--u, 1px))",
            backgroundColor: "#DAE7C7",
            color: "#08482D",
            fontWeight: 500,
            fontSize: "calc(16.6 * var(--u, 1px))",
            letterSpacing: "-0.01em",
          }}
        >
          <ShieldCheck className="w-4 h-4 text-[#08482D]" />
          <span>{badgeText}</span>
        </div>

        {/* Big Bold Headline */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-full text-center z-30 pointer-events-none"
          style={{
            top: "calc(176 * var(--u, 1px))",
          }}
        >
          <h2
            className="font-inter-tight font-bold tracking-tight text-[#101410] leading-none"
            style={{
              fontSize: "calc(88 * var(--u, 1px))",
              lineHeight: "calc(92 * var(--u, 1px))",
            }}
          >
            <span className="block" style={{ letterSpacing: "-0.035em" }}>
              {headlineLine1}
            </span>
            <span className="block" style={{ letterSpacing: "-0.022em" }}>
              {headlineLine2}
            </span>
          </h2>
        </div>

        {/* Hand-Drawn Left Slash Doodle */}
        <svg
          className="absolute z-35 pointer-events-none"
          style={{
            left: "calc(263 * var(--u, 1px))",
            top: "calc(377 * var(--u, 1px))",
            width: "calc(40 * var(--u, 1px))",
            height: "calc(52 * var(--u, 1px))",
          }}
          viewBox="0 0 40 52"
          fill="none"
        >
          <path className="draw-stroke" d="M 8 46 L 24 6" strokeWidth="3" />
          <path className="draw-stroke" d="M 20 46 L 36 6" strokeWidth="3" />
        </svg>

        {/* Subline */}
        <p
          className="absolute left-1/2 -translate-x-1/2 text-center text-[#5E5E61] z-30 pointer-events-none max-w-[760px]"
          style={{
            top: "calc(394 * var(--u, 1px))",
            fontSize: "calc(20.8 * var(--u, 1px))",
            lineHeight: "calc(32 * var(--u, 1px))",
            letterSpacing: "-0.015em",
          }}
        >
          {sublineText}
        </p>

        {/* Hand-Drawn Note & Arrow: "Zero backlash" */}
        <div
          className="font-caveat font-semibold text-[#08482D] absolute pointer-events-none z-35 whitespace-pre-line leading-tight"
          style={{
            left: "calc(1185 * var(--u, 1px))",
            top: "calc(310 * var(--u, 1px))",
            fontSize: "calc(29 * var(--u, 1px))",
            transform: "rotate(16deg)",
            transformOrigin: "top left",
          }}
        >
          {noteTopText}
        </div>
        <svg
          className="absolute pointer-events-none z-35"
          style={{
            left: "calc(1160 * var(--u, 1px))",
            top: "calc(385 * var(--u, 1px))",
            width: "calc(125 * var(--u, 1px))",
            height: "calc(90 * var(--u, 1px))",
          }}
          viewBox="0 0 125 90"
          fill="none"
        >
          <path
            className="draw-stroke"
            d="M 28 8 C 65 14, 98 34, 76 68 C 68 78, 56 82, 42 78"
            strokeWidth="2.5"
          />
          <path className="draw-stroke" d="M 52 70 L 40 78 L 48 88" strokeWidth="2.5" />
        </svg>

        {/* Curved Cylinder Card Carousel Stage */}
        <div
          ref={desktopStageRef}
          className="cylinder-stage absolute inset-0 w-full h-full z-20"
          aria-label="Interactive Curved Product Carousel"
        >
          {displayProducts.map((p, i) => (
            <div
              key={p.id}
              ref={(el) => {
                desktopCardRefs.current[i] = el;
              }}
              className="cylinder-card group flex flex-col justify-between"
              style={{ display: "none" }}
            >
              <Link
                href={`/product/${p.slug}`}
                onClick={(e) => handleCardClick(e, p.slug)}
                className="w-full h-full flex flex-col justify-between relative no-underline cursor-pointer"
              >
                {/* Brand / Category Top Header */}
                <div className="w-full pt-2.5 px-3 pb-1 flex items-center justify-between z-10 shrink-0 pointer-events-none">
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-white/90 text-[#08482D] backdrop-blur-md shadow-xs border border-[#08482D]/10">
                    {p.brand || "HIWIN"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-medium bg-[#DAE7C7]/90 text-[#08482D] backdrop-blur-md shadow-xs">
                    {p.category || "Motion"}
                  </span>
                </div>

                {/* Product Image Cover */}
                <div className="w-full flex-1 relative overflow-hidden bg-gradient-to-b from-[#F2F5ED] to-white flex items-center justify-center p-2.5">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="product-img w-full h-full object-contain transition-transform duration-500 ease-out"
                    loading="eager"
                    onError={(e) => {
                      const fallback = VERIFIED_FALLBACK_PRODUCTS[i % VERIFIED_FALLBACK_PRODUCTS.length].imageUrl;
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                  />
                </div>

                {/* Bottom Product Details Pill / Footer */}
                <div className="p-3 bg-white/95 border-t border-[#E3E8DC] backdrop-blur-md flex flex-col gap-1 relative z-10">
                  <h3 className="text-xs font-bold text-[#101410] line-clamp-1 leading-snug group-hover:text-[#08482D] transition-colors">
                    {p.name}
                  </h3>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[12.5px] font-extrabold text-[#08482D]">
                      {formatPrice(p.price)}
                    </span>
                    {/* Action Pill */}
                    <div className="action-pill w-6 h-6 rounded-full bg-[#DAE7C7] text-[#08482D] flex items-center justify-center transition-all duration-300 shadow-xs">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Hand-Drawn Note & Arrow: "Ready to ship" */}
        <div
          className="font-caveat font-semibold text-[#08482D] absolute pointer-events-none z-35 whitespace-nowrap"
          style={{
            left: "calc(455 * var(--u, 1px))",
            top: "calc(930 * var(--u, 1px))",
            fontSize: "calc(28 * var(--u, 1px))",
            transform: "rotate(-20deg)",
            transformOrigin: "center center",
          }}
        >
          {noteBottomText}
        </div>
        <svg
          className="absolute pointer-events-none z-35"
          style={{
            left: "calc(470 * var(--u, 1px))",
            top: "calc(892 * var(--u, 1px))",
            width: "calc(110 * var(--u, 1px))",
            height: "calc(48 * var(--u, 1px))",
          }}
          viewBox="0 0 110 48"
          fill="none"
        >
          <path className="draw-stroke" d="M 6 12 C 30 32, 70 38, 98 18" strokeWidth="2.5" />
          <path className="draw-stroke" d="M 82 12 L 98 18 L 88 30" strokeWidth="2.5" />
        </svg>

        {/* Primary CTA Button with Dashed Green Outline Ring */}
        <div
          className="absolute z-38 flex items-center justify-center group"
          style={{
            left: "calc(585 * var(--u, 1px))",
            top: "calc(901 * var(--u, 1px))",
            width: "calc(270 * var(--u, 1px))",
            height: "calc(74 * var(--u, 1px))",
          }}
        >
          {/* Dashed outer ring */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none transition-transform duration-400 ease-out group-hover:scale-105 group-hover:rotate-2"
            style={{
              border: "calc(1.8 * var(--u, 1px)) dashed #08482D",
            }}
          />

          {/* Solid Forest-Green Pill Button */}
          <Link
            href={ctaUrl}
            className="relative z-10 flex items-center justify-center rounded-full font-semibold text-white transition-all duration-300 hover:scale-102 shadow-md active:scale-98"
            style={{
              width: "calc(250 * var(--u, 1px))",
              height: "calc(58 * var(--u, 1px))",
              backgroundColor: "#08482D",
              fontSize: "calc(15.5 * var(--u, 1px))",
              letterSpacing: "-0.01em",
            }}
          >
            <span className="whitespace-nowrap px-4">{ctaText}</span>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          MOBILE LAYOUT (max-width: 820px) — Touch-Optimized Responsive Stack
          ========================================================================= */}
      <div className="block md:hidden w-full px-4 py-12 flex flex-col items-center text-center">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#DAE7C7] text-[#08482D] text-xs font-semibold mb-4 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{badgeText}</span>
        </div>

        {/* Headline */}
        <h2 className="font-inter-tight text-3xl sm:text-4xl font-bold tracking-tight text-[#101410] leading-tight mb-3">
          <span className="block">{headlineLine1}</span>
          <span className="block">{headlineLine2}</span>
        </h2>

        {/* Subline */}
        <p className="text-xs sm:text-sm text-[#5E5E61] max-w-md mx-auto leading-relaxed mb-6">
          {sublineText}
        </p>

        {/* Mobile Curved Carousel Stage Band */}
        <div
          ref={mobileStageRef}
          className="cylinder-stage relative w-full h-[295px] overflow-hidden my-4"
          aria-label="Mobile Product Carousel"
        >
          {displayProducts.map((p, i) => (
            <div
              key={`mob_${p.id}`}
              ref={(el) => {
                mobileCardRefs.current[i] = el;
              }}
              className="cylinder-card group flex flex-col justify-between"
              style={{ display: "none" }}
            >
              <Link
                href={`/product/${p.slug}`}
                onClick={(e) => handleCardClick(e, p.slug)}
                className="w-full h-full flex flex-col justify-between relative no-underline cursor-pointer"
              >
                {/* Brand Top Header Row - Stays strictly on the upperside so it never blocks the image */}
                <div className="w-full pt-2 px-2 pb-0.5 flex items-center justify-center z-10 shrink-0 pointer-events-none">
                  <span className="px-2 py-0.5 rounded-full text-[8.5px] font-extrabold bg-[#DAE7C7] text-[#08482D] border border-[#08482D]/15 shadow-2xs tracking-wide">
                    {p.brand || "HIWIN"}
                  </span>
                </div>

                {/* Product Image - Dedicated clean space with zero obstruction */}
                <div className="w-full flex-1 relative overflow-hidden bg-gradient-to-b from-[#F2F5ED]/40 to-white flex items-center justify-center p-2 min-h-[80px]">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="product-img w-full h-full object-contain"
                    loading="eager"
                    onError={(e) => {
                      const fallback = VERIFIED_FALLBACK_PRODUCTS[i % VERIFIED_FALLBACK_PRODUCTS.length].imageUrl;
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                  />
                </div>

                {/* Product Info */}
                <div className="p-2 bg-white/95 border-t border-[#E3E8DC] flex flex-col gap-0.5">
                  <h4 className="text-[9.5px] font-bold text-[#101410] line-clamp-2 leading-tight">
                    {p.name.replace(/^HIWIN\s+/i, "")}
                  </h4>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[11px] font-extrabold text-[#08482D]">
                      {formatPrice(p.price)}
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-[#08482D]" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Mobile CTA and Note */}
        <div className="flex flex-col items-center gap-3 mt-4">
          <div className="relative p-1.5 rounded-full border border-dashed border-[#08482D]">
            <Link
              href={ctaUrl}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#08482D] text-white font-semibold text-sm shadow-md hover:bg-[#0b5c39] transition-colors"
            >
              {ctaText}
            </Link>
          </div>

          <div className="inline-flex items-center gap-1 text-[#08482D] font-caveat text-lg font-semibold">
            <span>{noteBottomText}</span>
            <svg className="w-6 h-3" viewBox="0 0 32 18" fill="none">
              <path d="M 4 14 C 12 4, 22 4, 28 8" stroke="#08482D" strokeWidth="2" strokeLinecap="round" />
              <path d="M 22 5 L 28 8 L 24 14" stroke="#08482D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
