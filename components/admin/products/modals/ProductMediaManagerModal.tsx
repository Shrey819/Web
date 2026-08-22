"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  Image as ImageIcon,
  Search,
  UploadCloud,
  Globe,
  Plus,
  Loader2,
  HardDrive,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { getAdminMediaLibrary } from "@/app/actions/media";

interface ProductMediaManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddImages: (urls: string[]) => void;
  maxSelectable?: number;
}

export function ProductMediaManagerModal({
  isOpen,
  onClose,
  onAddImages,
  maxSelectable = 10,
}: ProductMediaManagerModalProps) {
  const [activeTab, setActiveTab] = useState<"library" | "upload" | "url">("library");
  const [libraryImages, setLibraryImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [customUrlError, setCustomUrlError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isOpen]);

  // Fetch recent images on open
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setSelectedUrls([]);
      setCustomUrlInput("");
      setCustomUrlError("");
      setUploadError("");
      getAdminMediaLibrary()
        .then((res) => {
          setLibraryImages(res);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelectImage = (url: string) => {
    if (selectedUrls.includes(url)) {
      setSelectedUrls((prev) => prev.filter((u) => u !== url));
    } else {
      if (selectedUrls.length >= maxSelectable) return;
      setSelectedUrls((prev) => [...prev, url]);
    }
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(Array.from(files));
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    setUploadError("");
    setUploadProgress(`Uploading ${files.length} image${files.length > 1 ? "s" : ""}...`);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload images");
      }

      const newUrls: string[] = data.urls || [];
      setLibraryImages((prev) => [...newUrls, ...prev]);

      // Automatically select new images up to remaining quota
      const remainingQuota = maxSelectable - selectedUrls.length;
      const toSelect = newUrls.slice(0, remainingQuota);
      setSelectedUrls((prev) => [...toSelect, ...prev]);

      setActiveTab("library");
    } catch (err: any) {
      console.error("Bulk upload error:", err);
      setUploadError(err.message || "Upload failed. Please check network.");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  const handleAddCustomUrl = () => {
    const trimmed = customUrlInput.trim();
    if (!trimmed) {
      setCustomUrlError("Please enter a valid image URL");
      return;
    }
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setCustomUrlError("URL must start with http:// or https://");
      return;
    }
    setLibraryImages((prev) => [trimmed, ...prev]);
    if (selectedUrls.length < maxSelectable) {
      setSelectedUrls((prev) => [trimmed, ...prev]);
    }
    setCustomUrlInput("");
    setCustomUrlError("");
    setActiveTab("library");
  };

  const handleConfirmAdd = () => {
    if (selectedUrls.length > 0) {
      onAddImages(selectedUrls);
      onClose();
    }
  };

  const filteredImages = searchQuery.trim()
    ? libraryImages.filter((img) => img.toLowerCase().includes(searchQuery.toLowerCase()))
    : libraryImages;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Navigation Tabs */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Media Manager</h3>
              <p className="text-xs text-slate-500">
                Upload new media or choose from previously uploaded store images (Max {maxSelectable} items)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-white gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("library")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "library"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <HardDrive className="w-4 h-4" />
            My Files / Store Library ({libraryImages.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "upload"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload New Media {isUploading && <Loader2 className="w-3 h-3 animate-spin text-blue-600 ml-1" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "url"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Globe className="w-4 h-4" />
            Web Address (URL)
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {/* TAB 1: Library & Recently Uploaded Images */}
          {activeTab === "library" && (
            <div className="space-y-4">
              {/* Search & Actions Bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search recent images..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <span>Selected: <strong className="text-blue-600 font-bold">{selectedUrls.length}</strong> / {maxSelectable}</span>
                  {selectedUrls.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedUrls([])}
                      className="text-xs text-red-600 hover:underline ml-2"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Image Grid */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <p className="text-xs font-medium">Loading uploaded store images...</p>
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                  <ImageIcon className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No images found</p>
                  <p className="text-xs text-slate-400 mt-1">Upload an image or switch to the Upload tab.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
                  {filteredImages.map((url, idx) => {
                    const isSelected = selectedUrls.includes(url);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleSelectImage(url)}
                        className={`group relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all bg-white flex items-center justify-center ${
                          isSelected
                            ? "border-blue-600 ring-3 ring-blue-500/20 shadow-md scale-[0.98]"
                            : "border-slate-200 hover:border-slate-400 hover:shadow-xs"
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Library item ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />

                        {/* Checkbox indicator */}
                        <div
                          className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-white/80 border border-slate-300 text-transparent group-hover:border-blue-500"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Upload New Media (Server-Side Cloudinary Drag & Drop & Multi-Upload) */}
          {activeTab === "upload" && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl bg-white text-center space-y-4 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFilesSelected}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <UploadCloud className="w-8 h-8" />
                )}
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-800">
                  {isUploading ? uploadProgress : "Drag and Drop assets here"}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Supports bulk selection of PNG, JPG, WEBP, and MP4 files
                </p>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isUploading ? "Uploading to Cloudinary..." : "Browse Files from Device"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Web Address (Direct URL) */}
          {activeTab === "url" && (
            <div className="max-w-xl mx-auto py-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Image / Media Web Address (URL)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/product-image.jpg"
                    value={customUrlInput}
                    onChange={(e) => {
                      setCustomUrlInput(e.target.value);
                      setCustomUrlError("");
                    }}
                    className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomUrl}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>
                {customUrlError && (
                  <p className="text-xs text-red-600 font-medium">{customUrlError}</p>
                )}
              </div>

              {customUrlInput.trim().startsWith("http") && (
                <div className="pt-4 border-t border-slate-100 flex flex-col items-center">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Live Preview</p>
                  <div className="w-48 h-48 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-xs">
                    <img
                      src={customUrlInput}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setCustomUrlError("Unable to load image from this URL")}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="text-xs font-medium text-slate-600">
            {selectedUrls.length > 0 ? (
              <span className="flex items-center gap-1.5 text-blue-600 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                {selectedUrls.length} image{selectedUrls.length > 1 ? "s" : ""} ready to add
              </span>
            ) : (
              <span>Select images to add to this product</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={selectedUrls.length === 0}
              onClick={handleConfirmAdd}
              className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Add to Product ({selectedUrls.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
