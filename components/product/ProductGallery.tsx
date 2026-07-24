"use client";

import { useState } from "react";
import Image from "next/image";
import { Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const prevImage = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Viewer */}
      <div className="relative aspect-4/3 rounded-3xl overflow-hidden bg-slate-950 border border-slate-200/90 shadow-xl group">
        <Image
          src={images[activeIndex] || images[0]}
          alt={productName}
          fill
          className="object-cover"
          unoptimized
        />

        {/* Fullscreen Zoom Trigger Button */}
        <button
          onClick={() => setIsZoomOpen(true)}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Zoom image"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Next/Prev Navigation overlay */}
        {images.length > 1 && (
          <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={prevImage}
              className="pointer-events-auto p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 backdrop-blur-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="pointer-events-auto p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 backdrop-blur-md"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Thumbnail Bar */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
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
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-6 right-6 p-3 rounded-full bg-slate-800 text-white hover:bg-slate-700"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative w-full max-w-4xl aspect-4/3 max-h-[85vh]">
              <Image
                src={images[activeIndex]}
                alt={productName}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
