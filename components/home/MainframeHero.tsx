"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

// Custom hook for typewriter effect with configurable start delay and typing speed
export function useTypewriter(
  text: string,
  speed: number = 38,
  startDelay: number = 600
) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const timeoutId = setTimeout(() => {
      let currentIndex = 0;
      intervalId = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayed(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setDone(true);
          if (intervalId) clearInterval(intervalId);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

import { MainframeHeroConfig } from "@/lib/homepage";

export function MainframeHero({ config }: { config?: MainframeHeroConfig }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isSeekingRef = useRef<boolean>(false);
  const targetProgressRef = useRef<number>(0.5);
  const currentProgressRef = useRef<number>(0.5);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pillsVisible, setPillsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  // Industry-tailored headline typewriter copy
  const heroText =
    config?.headline ||
    "Engineered for 99.9% industrial uptime. Factory-certified OEM components with same-day B2B dispatch. What system are we powering today?";
  const { displayed, done } = useTypewriter(heroText, 32, 500);

  // Reveal pill buttons 400ms after mount (independent of typewriter)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPillsVisible(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleSeeked = () => {
    isSeekingRef.current = false;
  };

  // Precise video eye scan calibration:
  // 0.00s = Far Left, 0.78s = Exact Center Eye Contact (Direct to Camera), 1.90s = Far Right
  const SCAN_START = 0.00;
  const SCAN_CENTER = 0.78;
  const SCAN_END = 1.90;

  const calculateTargetTime = (progress: number) => {
    // progress is 0.0 (Far Left) -> 0.5 (Center / Character) -> 1.0 (Far Right)
    if (progress <= 0.5) {
      // 0.0 to 0.5 maps smoothly from SCAN_START (0.00s) to SCAN_CENTER (0.78s)
      return SCAN_START + (progress / 0.5) * (SCAN_CENTER - SCAN_START);
    } else {
      // 0.5 to 1.0 maps smoothly from SCAN_CENTER (0.78s) to SCAN_END (1.90s)
      return SCAN_CENTER + ((progress - 0.5) / 0.5) * (SCAN_END - SCAN_CENTER);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      const initialTime = calculateTargetTime(targetProgressRef.current);
      video.currentTime = initialTime;
      currentProgressRef.current = targetProgressRef.current;
    }
  };

  // Continuous animation loop for smooth eye-contact tracking on mouse pointer
  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      const video = videoRef.current;
      if (video && !isSeekingRef.current) {
        const diff = targetProgressRef.current - currentProgressRef.current;
        if (Math.abs(diff) > 0.001) {
          // Responsive easing towards mouse position
          currentProgressRef.current += diff * 0.5;
          const targetTime = Math.min(
            Math.max(SCAN_START, calculateTargetTime(currentProgressRef.current)),
            SCAN_END
          );

          if (Math.abs(video.currentTime - targetTime) > 0.008) {
            isSeekingRef.current = true;
            if (
              "fastSeek" in video &&
              typeof (video as any).fastSeek === "function"
            ) {
              try {
                (video as any).fastSeek(targetTime);
              } catch {
                video.currentTime = targetTime;
              }
            } else {
              video.currentTime = targetTime;
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Track mouse pointer relative to the character's center position on screen
  useEffect(() => {
    const updatePointerGaze = (clientX: number) => {
      const container = containerRef.current;
      let characterCenterX = window.innerWidth * 0.5;

      if (container) {
        const rect = container.getBoundingClientRect();
        characterCenterX = rect.left + rect.width * 0.5;
      }

      // Delta X from character's center to pointer
      const deltaX = clientX - characterCenterX;

      let progress = 0.5;
      if (deltaX < 0) {
        // Mouse is to the left of the character (over the text)
        const maxRangeLeft = Math.max(180, characterCenterX);
        const normalized = Math.max(-1, deltaX / maxRangeLeft); // -1.0 to 0.0
        progress = 0.5 + normalized * 0.5; // 0.0 to 0.5
      } else {
        // Mouse is to the right of the character (over the buttons)
        const maxRangeRight = Math.max(180, window.innerWidth - characterCenterX);
        const normalized = Math.min(1, deltaX / maxRangeRight); // 0.0 to 1.0
        progress = 0.5 + normalized * 0.5; // 0.5 to 1.0
      }

      targetProgressRef.current = progress;
    };

    const handleMouseMove = (e: MouseEvent) => {
      updatePointerGaze(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      updatePointerGaze(e.touches[0].clientX);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Copy email handler
  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText("omautomation2012@gmail.com");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  const industryPillActions = [
    { label: "Request Bulk Quote (RFQ)", href: "/quote", isLink: true },
    { label: "Explore Sensors & PLCs", href: "/products", isLink: true },
    { label: "Ballscrew & Linear Guideway", href: "/products", isLink: true },
    { label: "Engineering Solutions", href: "/about", isLink: true },
  ];

  return (
    <div
      className="mainframe-hero-wrapper relative w-full min-h-screen select-none font-body overflow-hidden text-slate-900 bg-[#faf9f5]"
      style={
        {
          "--font-heading":
            "'HelveticaNowDisplay-Medium', 'Helvetica Neue', Arial, sans-serif",
          "--font-body":
            "'HelveticaNowDisplayW01-Rg', 'Helvetica Neue', Arial, sans-serif",
          fontFamily: "var(--font-body)",
        } as React.CSSProperties
      }
    >
      {/* Dynamic Font Stylesheet Loader */}
      <link
        rel="stylesheet"
        href="https://db.onlinewebfonts.com/c/5ac3fe7c6abd2f62067f266d89671492?family=HelveticaNowDisplay-Medium"
        type="text/css"
      />
      <link
        rel="stylesheet"
        href="https://db.onlinewebfonts.com/c/1aa3377e489837a26d019bba501e779d?family=HelveticaNowDisplayW01-Rg"
        type="text/css"
      />

      {/* Embedded CSS for Blinking Cursor Animation */}
      <style>{`
        @keyframes mainframe-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .mainframe-cursor-blink {
          animation: mainframe-blink 1s step-end infinite;
        }
      `}</style>

      {/* NAVBAR (Fixed, z-index: 10) */}
      <nav
        className="fixed top-0 left-0 right-0 w-full px-5 sm:px-8 py-4 sm:py-5 flex justify-between items-center bg-[#faf9f5]/85 backdrop-blur-md border-b border-black/5"
        style={{ zIndex: 10 }}
      >
        {/* Logo (left) */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-[21px] sm:text-[26px] tracking-tight text-slate-950 font-bold hover:opacity-80 transition-opacity flex items-center gap-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span>OM AUTOMATION®</span>
          </Link>
          <span
            className="text-[25px] sm:text-[30px] text-amber-500 select-none leading-none"
            style={{ letterSpacing: "-0.02em" }}
          >
            ✳︎
          </span>
        </div>

        {/* Desktop Nav Links (center, hidden below md) */}
        <div className="hidden md:flex items-center text-[20px] lg:text-[22px] text-slate-800 font-medium">
          {(config?.navPills && config.navPills.length > 0 ? config.navPills : [
            { label: "Sensors", url: "/products" },
            { label: "PLCs", url: "/categories/plcs" },
            { label: "VFD Drives", url: "/categories/vfd-drives" },
            { label: "RFQ Portal", url: "/quote" },
          ]).map((item, idx, arr) => (
            <React.Fragment key={idx}>
              <Link
                href={item.url}
                className="hover:text-sky-600 transition-colors cursor-pointer"
              >
                {item.label}
              </Link>
              {idx < arr.length - 1 && <span>,&nbsp;</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Desktop CTA (right, hidden below md) */}
        <div className="hidden md:block">
          <Link
            href={config?.ctaUrl || "/quote"}
            className="text-[20px] lg:text-[22px] text-slate-950 font-semibold underline underline-offset-4 hover:text-sky-600 transition-colors cursor-pointer"
          >
            {config?.ctaText || "Request Instant Quote"}
          </Link>
        </div>

        {/* Mobile Hamburger (visible below md) */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="flex md:hidden flex-col justify-center items-center gap-[5px] w-8 h-8 focus:outline-none z-20 cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <span
            className={`w-6 h-[2px] bg-slate-900 transition-transform duration-300 origin-center ${
              isMenuOpen ? "rotate-45 translate-y-[7px]" : ""
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-slate-900 transition-opacity duration-300 ${
              isMenuOpen ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-slate-900 transition-transform duration-300 origin-center ${
              isMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile Menu Overlay (z-index: 9) */}
      <div
        className={`fixed inset-0 bg-[#faf9f5]/95 backdrop-blur-md flex flex-col justify-center px-8 gap-8 transition-opacity duration-300 md:hidden ${
          isMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        style={{ zIndex: 9 }}
      >
        {(config?.navPills && config.navPills.length > 0 ? config.navPills : [
          { label: "Sensors", url: "/products" },
          { label: "PLCs & Controllers", url: "/categories/plcs" },
          { label: "VFD Drives", url: "/categories/vfd-drives" },
          { label: "RFQ Portal", url: "/quote" },
        ]).map((item, idx) => (
          <Link
            key={idx}
            href={item.url}
            onClick={() => setIsMenuOpen(false)}
            className="text-[30px] font-semibold text-slate-900 hover:text-sky-600 transition-colors"
          >
            {item.label}
          </Link>
        ))}
        <Link
          href={config?.ctaUrl || "/quote"}
          onClick={() => setIsMenuOpen(false)}
          className="text-[30px] font-bold text-sky-600 underline underline-offset-4"
        >
          {config?.ctaText || "Request Instant Quote"}
        </Link>
      </div>

      {/* HERO SECTION (z-index: 1) */}
      <section
        className="relative w-full min-h-screen flex items-center justify-center pt-28 pb-16 px-5 sm:px-8 md:px-10 lg:px-12"
        style={{ zIndex: 1 }}
      >
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          
          {/* LEFT: Industrial Eyebrow & Value Proposition Text */}
          <div className="lg:col-span-4 flex flex-col justify-center text-center lg:text-left order-1">
            {/* 1. Clear Eyebrow Badge & Label */}
            <div className="mb-4 sm:mb-5 select-none">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {config?.eyebrow || "Industrial Motion & Automation"}
              </span>
              <div
                className="text-slate-700 font-medium text-[16px] sm:text-[18px] lg:text-[20px] leading-snug"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {config?.subheading || "High-Precision Sensors, PLCs & Factory Drives"}
              </div>
            </div>

            {/* 2. Typewriter Text */}
            <p
              className="text-slate-900 mb-2 min-h-[58px] font-normal leading-relaxed text-[17px] sm:text-[19px] lg:text-[22px]"
            >
              {displayed}
              {!done && (
                <span className="inline-block w-[2px] h-[1.1em] bg-slate-900 align-middle ml-[2px] mainframe-cursor-blink" />
              )}
            </p>

            {/* 3. Primary CTA Button */}
            {config?.ctaText && (
              <div className="mt-4 flex items-center justify-center lg:justify-start">
                <Link
                  href={config?.ctaUrl || "/quote"}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 text-white hover:bg-sky-600 active:bg-sky-700 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group"
                >
                  <span>{config.ctaText}</span>
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>

          {/* MIDDLE: Centered Person Character Frame with Real-Time Gaze Tracking */}
          <div className="lg:col-span-5 flex items-center justify-center order-2">
            <div
              ref={containerRef}
              className="relative w-full max-w-[320px] sm:max-w-[390px] lg:max-w-[440px] aspect-4/3 sm:aspect-[4/3] rounded-3xl overflow-hidden border border-black/10 shadow-2xl bg-[#eae7df] flex items-center justify-center transition-transform duration-300 hover:scale-[1.01]"
            >
              <video
                ref={videoRef}
                src={
                  config?.videoUrl && config.videoUrl !== "/videos/character-opt.mp4"
                    ? config.videoUrl
                    : "/videos/Character_horizontal_eye_scan.mp4"
                }
                muted
                playsInline
                preload="auto"
                onSeeked={handleSeeked}
                onLoadedMetadata={handleLoadedMetadata}
                className="w-full h-full object-cover object-center pointer-events-none select-none"
              />

              {/* Status Badge */}
              <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-slate-900/85 backdrop-blur-md px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-white text-[10px] sm:text-xs font-mono flex items-center gap-2 border border-white/15 shadow-md pointer-events-none select-none">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>OM Automation Industrial Motion</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Industry Action Pill Buttons */}
          <div className="lg:col-span-3 flex flex-col justify-center items-center lg:items-start order-3 w-full">
            <div
              className="grid grid-cols-2 md:flex md:flex-row lg:flex-col md:flex-wrap gap-2.5 sm:gap-3 items-center lg:items-start w-full max-w-sm sm:max-w-md md:max-w-none mx-auto lg:mx-0"
              style={{
                opacity: pillsVisible ? 1 : 0,
                transform: pillsVisible ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.4s ease, transform 0.4s ease",
              }}
            >
              {/* Industry Pill Buttons */}
              {(config?.navPills && config.navPills.length > 0 ? config.navPills : [
                { label: "Sensors", url: "/products" },
                { label: "PLCs", url: "/categories/plcs" },
                { label: "VFD Drives", url: "/categories/vfd-drives" },
                { label: "RFQ Portal", url: "/quote" },
              ]).map((pill, pIdx) => (
                <Link
                  key={pIdx}
                  href={pill.url}
                  className="w-full md:w-auto inline-flex items-center justify-center text-center bg-white text-slate-900 border border-slate-300/80 shadow-xs rounded-full text-[13px] sm:text-[14px] px-3.5 sm:px-5 py-[0.55em] font-medium hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all duration-200 cursor-pointer last:odd:col-span-2 truncate"
                >
                  {pill.label}
                </Link>
              ))}

              {/* 1 Outline Pill Button (Reach Sales & Copy Email) */}
              <button
                type="button"
                onClick={handleCopyEmail}
                className="w-full md:w-auto inline-flex items-center justify-center text-center text-slate-900 bg-transparent border border-slate-900/40 rounded-full text-[13px] sm:text-[14px] px-3.5 sm:px-5 py-[0.55em] gap-2 font-medium hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all duration-200 cursor-pointer group shadow-xs last:odd:col-span-2"
                title={`Copy ${config?.salesEmail || "omautomation2012@gmail.com"}`}
              >
                <span className="truncate">
                  {config?.salesEmailText || "Reach Sales:"}{" "}
                  <span className="underline underline-offset-2">
                    {config?.salesEmail || "omautomation2012@gmail.com"}
                  </span>
                  {copied && (
                    <span className="ml-1 text-[11px] opacity-90 font-bold text-emerald-600 group-hover:text-emerald-300">
                      (copied!)
                    </span>
                  )}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 transition-colors"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
