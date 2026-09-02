"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Image as ImageIcon, Camera, Check, X, Sparkles, Upload } from "lucide-react";

interface EditableImageProps {
  src: string | undefined | null;
  alt?: string;
  onChange: (newSrc: string) => void;
  className?: string;
  imgClassName?: string;
  label?: string;
  fill?: boolean;
  width?: number;
  height?: number;
}

const PRESET_INDUSTRIAL_IMAGES = [
  {
    label: "PLC Control Rack",
    url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80",
  },
  {
    label: "Robotic Assembly Cell",
    url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop&q=80",
  },
  {
    label: "Servo Drive Motor",
    url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1200&auto=format&fit=crop&q=80",
  },
  {
    label: "Laser Sensor Inspection",
    url: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1200&auto=format&fit=crop&q=80",
  },
  {
    label: "Electronics SMD Line",
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80",
  },
];

export function EditableImage({
  src,
  alt = "Image",
  onChange,
  className = "",
  imgClassName = "",
  label = "Click to change image",
  fill = false,
  width,
  height,
}: EditableImageProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState(src || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const nextSrc = src || "";
    setTempUrl((prev) => (prev !== nextSrc ? nextSrc : prev));
  }, [src]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
      inputRef.current.select();
    }
  }, [isOpen]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(true);
  };

  const handleApply = () => {
    if (tempUrl.trim()) {
      onChange(tempUrl.trim());
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempUrl(src || "");
    setIsOpen(false);
  };

  const currentImgSrc = src || PRESET_INDUSTRIAL_IMAGES[0].url;

  return (
    <div
      onClick={handleOpen}
      className={`group relative cursor-pointer overflow-hidden ${className}`}
      title={label}
    >
      {/* Underlying Image */}
      {fill ? (
        <img
          src={currentImgSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${imgClassName}`}
        />
      ) : (
        <img
          src={currentImgSrc}
          alt={alt}
          width={width}
          height={height}
          className={`transition-transform duration-300 group-hover:scale-105 ${imgClassName}`}
        />
      )}

      {/* Hover Replace Overlay Badge */}
      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white z-20 pointer-events-none p-2 text-center">
        <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
          <Camera className="w-4 h-4" />
        </div>
        <span className="text-[11px] font-bold tracking-wide bg-slate-900/90 px-2 py-0.5 rounded text-amber-300 border border-amber-500/30">
          Replace Image
        </span>
      </div>

      {/* Quick Image Replacement Modal (Portaled to body to prevent canvas background jumping/scrolling) */}
      {isOpen && mounted && typeof document !== "undefined" && createPortal(
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleCancel();
          }}
          className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-default"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-white animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Update Image Source</h3>
                  <p className="text-[11px] text-slate-400">Enter image URL or select from high-res presets</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* URL Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-400">
                Image Web URL (HTTPS)
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleApply();
                    if (e.key === "Escape") handleCancel();
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Instant Live Preview */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-400">Live Preview</label>
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 h-36 flex items-center justify-center">
                {tempUrl ? (
                  <img
                    src={tempUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PRESET_INDUSTRIAL_IMAGES[0].url;
                    }}
                  />
                ) : (
                  <span className="text-xs text-slate-500 font-mono">No Image URL</span>
                )}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Quick Industry Presets</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_INDUSTRIAL_IMAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTempUrl(preset.url)}
                    className={`p-2 rounded-lg text-left border transition-all text-xs flex flex-col gap-1 cursor-pointer ${
                      tempUrl === preset.url
                        ? "bg-sky-600/20 border-sky-500 text-white font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    <div className="h-10 rounded overflow-hidden bg-slate-900">
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </div>
                    <span className="truncate text-[10px]">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Image</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
