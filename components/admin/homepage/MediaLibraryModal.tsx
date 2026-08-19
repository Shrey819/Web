"use client";

import { useState, useEffect } from "react";
import { X, Check, Image as ImageIcon, Search, Upload } from "lucide-react";
import { CldUploadButton } from "next-cloudinary";
import { getAdminMediaLibrary } from "@/app/actions/media";

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string) => void;
  title?: string;
}

export function MediaLibraryModal({
  isOpen,
  onClose,
  onSelectImage,
  title = "Select Image from Media Library",
}: MediaLibraryModalProps) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [customInputUrl, setCustomInputUrl] = useState("");

  // Lock background body scroll when Media Library Modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getAdminMediaLibrary()
        .then((res) => {
          setImages(res);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredImages = searchQuery.trim()
    ? images.filter((img) => img.toLowerCase().includes(searchQuery.toLowerCase()))
    : images;

  const handleConfirmSelect = (urlToUse?: string) => {
    const finalUrl = urlToUse || selectedUrl || customInputUrl;
    if (finalUrl) {
      onSelectImage(finalUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white font-mono">{title}</h3>
              <p className="text-xs text-slate-400">
                Choose from previously uploaded store images, hero banners, or paste a new URL.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <CldUploadButton
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
              onSuccess={(res: any) => {
                if (res?.info?.secure_url) {
                  const newUrl = res.info.secure_url;
                  setImages((prev) => [newUrl, ...prev]);
                  setSelectedUrl(newUrl);
                  handleConfirmSelect(newUrl);
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow font-mono w-full sm:w-auto"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload New File</span>
            </CldUploadButton>
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 p-6 overflow-y-auto overscroll-contain min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Loading Media Library...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <p className="text-sm">No images found matching your search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredImages.map((imgUrl, index) => {
                const isSelected = selectedUrl === imgUrl;
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedUrl(imgUrl)}
                    onDoubleClick={() => handleConfirmSelect(imgUrl)}
                    className={`group relative aspect-video rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200 bg-slate-950 ${
                      isSelected
                        ? "border-amber-400 ring-4 ring-amber-400/20 scale-102 shadow-xl"
                        : "border-slate-800 hover:border-slate-600 hover:scale-101"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Media Asset ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-amber-400 text-slate-950 w-6 h-6 rounded-full flex items-center justify-center shadow-lg font-bold">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto flex-1">
            <input
              type="text"
              placeholder="Or paste direct image URL here (https://...)"
              value={customInputUrl}
              onChange={(e) => {
                setCustomInputUrl(e.target.value);
                if (e.target.value) setSelectedUrl(e.target.value);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={!selectedUrl && !customInputUrl}
              onClick={() => handleConfirmSelect()}
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-lg transition-all font-mono"
            >
              Select Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
