"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Maximize2, X, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchHolding, setIsTouchHolding] = useState(false);
  const [isManualPaused, setIsManualPaused] = useState(false);

  // Touch Swipe tracking state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const safeImages = images.length > 0 ? images : ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80"];

  const shouldPause = isHovered || isTouchHolding || isManualPaused || isZoomOpen;

  // 3-second auto slideshow timer for web/desktop & mobile
  useEffect(() => {
    if (safeImages.length <= 1 || shouldPause) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % safeImages.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [safeImages.length, shouldPause]);

  // Keyboard Arrow Navigation (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isZoomOpen) {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setActiveIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setActiveIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
        } else if (e.key === "Escape") {
          setIsZoomOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomOpen, safeImages.length]);

  const prevImage = () => {
    setActiveIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setActiveIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
  };

  const handleToggleManualPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsManualPaused((prev) => !prev);
  };

  // Touch Swipe Handlers for Mobile Sliding (Right-to-Left -> Next, Left-to-Right -> Prev)
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsTouchHolding(true);
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsTouchHolding(false);
    if (touchStartX !== null && e.changedTouches && e.changedTouches.length > 0) {
      const touchEndX = e.changedTouches[0].clientX;
      const diffX = touchStartX - touchEndX;

      // Threshold of 40px for swipe action
      if (Math.abs(diffX) > 40) {
        if (diffX > 0) {
          // Swiped Right-to-Left -> Show Next Image
          nextImage();
        } else {
          // Swiped Left-to-Right -> Show Previous Image
          prevImage();
        }
      }
    }
    setTouchStartX(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Viewer */}
      <div 
        className="relative aspect-4/3 rounded-3xl overflow-hidden bg-slate-950 border border-slate-200/90 shadow-xl group select-none cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsTouchHolding(false);
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={safeImages[activeIndex] || safeImages[0]}
          alt={productName}
          fill
          className="object-cover transition-all duration-500"
          unoptimized
        />

        {/* Interactive Play/Pause Toggle Badge Button */}
        {safeImages.length > 1 && (
          <button
            type="button"
            onClick={handleToggleManualPause}
            className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md text-[11px] font-mono font-medium border transition-all z-20 shadow-md ${
              isManualPaused
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                : shouldPause
                ? "bg-slate-900/90 text-amber-300 border-amber-400/30"
                : "bg-slate-900/80 text-white border-white/10 hover:bg-slate-900"
            }`}
            title="Click to toggle auto-play slideshow"
          >
            {isManualPaused ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="font-bold">Paused (Click to Play)</span>
              </>
            ) : shouldPause ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{isHovered ? "Hover Paused" : "Holding Paused"}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                <span className="text-slate-200">Auto 3s (Click to Pause)</span>
              </>
            )}
          </button>
        )}

        {/* Fullscreen Zoom Trigger Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomOpen(true);
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/40 hover:bg-slate-900/80 text-white/90 backdrop-blur-md transition-colors border border-white/10 z-20 shadow-md"
          aria-label="Zoom image"
        >
          <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Next/Prev Navigation overlay (Semi-transparent & small on mobile) */}
        {safeImages.length > 1 && (
          <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="pointer-events-auto p-1.5 sm:p-2.5 rounded-full bg-slate-900/40 hover:bg-slate-900/90 text-white backdrop-blur-md transition-all border border-white/20 shadow-lg"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="pointer-events-auto p-1.5 sm:p-2.5 rounded-full bg-slate-900/40 hover:bg-slate-900/90 text-white backdrop-blur-md transition-all border border-white/20 shadow-lg"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}

        {/* Bottom Pagination Dots */}
        {safeImages.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-1.5 z-10">
            {safeImages.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  activeIndex === idx
                    ? "w-6 bg-sky-400 shadow-md"
                    : "w-1.5 bg-white/50 hover:bg-white"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Bar */}
      {safeImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`w-20 h-16 relative rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                activeIndex === idx
                  ? "border-sky-600 shadow-md scale-105"
                  : "border-slate-200 opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-between p-3 sm:p-8 select-none"
          >
            {/* Modal Top Bar */}
            <div className="w-full flex items-center justify-between max-w-5xl text-white z-20">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="font-bold text-xs sm:text-base text-slate-200 font-mono truncate max-w-[150px] sm:max-w-md">
                  {productName}
                </span>
                {safeImages.length > 1 && (
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-slate-800 text-[10px] sm:text-xs font-mono text-slate-300 border border-slate-700">
                    {activeIndex + 1} / {safeImages.length}
                  </span>
                )}
              </div>

              <button
                onClick={() => setIsZoomOpen(false)}
                className="p-2 sm:p-3 rounded-full bg-slate-900/40 text-white/90 hover:bg-slate-900/80 transition-colors border border-white/20 shadow-md backdrop-blur-md"
                aria-label="Close popup"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Main Fullscreen Image Container with Touch Swipe & Compact Transparent Nav Arrows */}
            <div 
              className="relative w-full max-w-5xl h-[70vh] flex items-center justify-center my-auto touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Left Arrow Button (Small & Transparent on mobile) */}
              {safeImages.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-1 sm:left-4 z-30 p-2 sm:p-3.5 rounded-full bg-slate-900/30 text-white/90 hover:bg-sky-600/90 hover:scale-110 backdrop-blur-md transition-all border border-white/20 shadow-lg group/btn"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-7 sm:h-7 group-hover/btn:-translate-x-0.5 transition-transform" />
                </button>
              )}

              {/* Centered Image */}
              <div 
                className="relative w-full h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={safeImages[activeIndex]}
                  alt={productName}
                  fill
                  className="object-contain drop-shadow-2xl"
                  unoptimized
                />
              </div>

              {/* Right Arrow Button (Small & Transparent on mobile) */}
              {safeImages.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-1 sm:right-4 z-30 p-2 sm:p-3.5 rounded-full bg-slate-900/30 text-white/90 hover:bg-sky-600/90 hover:scale-110 backdrop-blur-md transition-all border border-white/20 shadow-lg group/btn"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4 sm:w-7 sm:h-7 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {/* Bottom Thumbnail Strip in Popup */}
            {safeImages.length > 1 && (
              <div 
                className="w-full max-w-md flex justify-center gap-2 overflow-x-auto p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800 z-20"
                onClick={(e) => e.stopPropagation()}
              >
                {safeImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`w-12 h-9 sm:w-14 sm:h-11 relative rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeIndex === idx
                        ? "border-sky-500 scale-105 shadow-md"
                        : "border-slate-800 opacity-50 hover:opacity-100"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
