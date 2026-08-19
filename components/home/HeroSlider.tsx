"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HeroSlide } from "@/lib/homepage";

interface HeroSliderProps {
  slides: HeroSlide[];
}

export function HeroSlider({ slides }: HeroSliderProps) {
  // Ensure we operate on active slides, or fallback to first 3
  const activeSlides = (slides && slides.length > 0 ? slides.filter((s) => s.isActive) : []).slice(0, 3);
  
  // If fewer than 3, fallback gracefully or pad
  const displaySlides = activeSlides.length > 0 ? activeSlides : slides.slice(0, 3);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Touch Swipe tracking
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const totalSlides = displaySlides.length;

  const goToNext = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    startAutoplayTimer();
  };

  const startAutoplayTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (!isPaused && totalSlides > 1) {
      timerRef.current = setInterval(() => {
        goToNext();
      }, 3000);
    }
  }, [isPaused, totalSlides, goToNext]);

  useEffect(() => {
    startAutoplayTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startAutoplayTimer]);



  // Touch handling for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const distance = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 50;
      if (distance > minSwipeDistance) {
        goToNext();
      } else if (distance < -minSwipeDistance) {
        goToPrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
    setIsPaused(false);
  };

  if (totalSlides === 0) return null;

  return (
    <section
      className="relative w-full max-w-none px-0 mx-0 overflow-hidden bg-slate-950 group select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Hero Carousel"
    >
      {/* Slides Container */}
      <div className="relative w-full h-[400px] sm:h-[480px] md:h-[540px] lg:h-[600px] xl:h-[640px]">
        {displaySlides.map((slide, index) => {
          const isActive = index === currentIndex;

          return (
            <div
              key={slide.id || index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Responsive HTML Picture element for GPU optimization & device-specific image loading */}
              <picture className="block w-full h-full">
                {/* Desktop viewports (>= 768px) get desktopImage */}
                <source media="(min-width: 768px)" srcSet={slide.desktopImage} />
                {/* Mobile viewports get mobileImage */}
                <img
                  src={slide.mobileImage || slide.desktopImage}
                  alt={slide.title || `Hero Slide ${index + 1}`}
                  className="w-full h-full object-cover object-center transform scale-100 transition-transform duration-1000 ease-out"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </picture>

              {/* Overlay Gradient for Text Contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex items-end md:items-center">
                <div className="content-shell pb-16 md:pb-0">
                  <div className="max-w-2xl text-white space-y-3 md:space-y-4 animate-fadeIn">
                    {slide.title && (
                      <h2 className="type-display-hero font-extrabold text-white tracking-tight drop-shadow-md">
                        {slide.title}
                      </h2>
                    )}
                    {slide.subtitle && (
                      <p className="type-body-large text-slate-200 font-medium drop-shadow max-w-xl">
                        {slide.subtitle}
                      </p>
                    )}
                    {slide.ctaText && slide.ctaUrl && (
                      <div className="pt-2">
                        <Link
                          href={slide.ctaUrl}
                          className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all transform hover:scale-[1.03] active:scale-95 font-mono"
                        >
                          <span>{slide.ctaText}</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToPrev();
              startAutoplayTimer();
            }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-slate-950/60 hover:bg-slate-950 text-white backdrop-blur-md border border-slate-700/80 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xl focus:outline-none"
            aria-label="Previous Hero Slide"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToNext();
              startAutoplayTimer();
            }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-slate-950/60 hover:bg-slate-950 text-white backdrop-blur-md border border-slate-700/80 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xl focus:outline-none"
            aria-label="Next Hero Slide"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Pagination Dots (Exactly 3 dots) */}
      {totalSlides > 1 && (
        <div className="absolute bottom-5 inset-x-0 z-20 flex items-center justify-center gap-2.5">
          {displaySlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`transition-all duration-300 rounded-full focus:outline-none ${
                idx === currentIndex
                  ? "w-8 h-2.5 bg-amber-400 shadow-md shadow-amber-400/50"
                  : "w-2.5 h-2.5 bg-white/50 hover:bg-white/90"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
