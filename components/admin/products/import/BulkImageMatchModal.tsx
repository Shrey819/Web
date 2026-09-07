"use client";

import { useState, useRef } from "react";
import {
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  ArrowRight,
  RefreshCw,
  Trash2,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

interface BulkImageMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  headers: string[];
  rows: string[][];
  onApplyMatches: (updatedRows: string[][], matchedCount: number) => void;
}

interface UploadedMatchItem {
  id: string;
  originalName: string;
  fileSize: number;
  url: string;
  previewUrl: string;
  matchedRowIdx: number; // -1 if unmatched
  matchType: "exact-filename" | "basename" | "product-name" | "manual" | "none";
}

export function BulkImageMatchModal({
  isOpen,
  onClose,
  headers,
  rows,
  onApplyMatches,
}: BulkImageMatchModalProps) {
  const [items, setItems] = useState<UploadedMatchItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Resolve Column Indices
  const headerLower = headers.map((h) => (h || "").toLowerCase().trim());
  const imagesColIdx = headerLower.findIndex(
    (h) => h === "images url" || h === "image url" || h.includes("images") || h.includes("image")
  );
  const nameColIdx = headerLower.findIndex(
    (h) => h === "product name" || h === "name" || h === "title"
  );

  // Helper to normalize strings for comparison
  const normalize = (str: string) =>
    (str || "")
      .toLowerCase()
      .replace(/\.[a-zA-Z0-9]+$/, "") // remove extension
      .replace(/[^a-z0-9]/g, "") // remove symbols
      .trim();

  // Match an uploaded filename to a row in the spreadsheet
  const findBestRowMatch = (filename: string, currentRows: string[][]): { rowIdx: number; type: UploadedMatchItem["matchType"] } => {
    const cleanFileName = filename.trim().toLowerCase();
    const baseFileName = cleanFileName.replace(/\.[^/.]+$/, "");
    const normalizedFile = normalize(filename);

    // 1. Exact or case-insensitive match against Images URL column
    if (imagesColIdx !== -1) {
      for (let r = 0; r < currentRows.length; r++) {
        const cellVal = (currentRows[r][imagesColIdx] || "").trim().toLowerCase();
        if (!cellVal) continue;
        const cellParts = cellVal.split(/[;,]/).map((s) => s.trim().toLowerCase());
        if (cellParts.includes(cleanFileName)) {
          return { rowIdx: r, type: "exact-filename" };
        }
      }

      // 2. Basename match against Images URL
      for (let r = 0; r < currentRows.length; r++) {
        const cellVal = (currentRows[r][imagesColIdx] || "").trim().toLowerCase();
        if (!cellVal) continue;
        const cellBase = cellVal.replace(/\.[^/.]+$/, "");
        if (cellBase === baseFileName || normalize(cellVal) === normalizedFile) {
          return { rowIdx: r, type: "basename" };
        }
      }
    }

    // 3. Name similarity match against Product Name
    if (nameColIdx !== -1) {
      for (let r = 0; r < currentRows.length; r++) {
        const prodName = (currentRows[r][nameColIdx] || "").trim().toLowerCase();
        const normProd = normalize(prodName);
        if (normProd && (normProd.includes(normalizedFile) || normalizedFile.includes(normProd))) {
          return { rowIdx: r, type: "product-name" };
        }
      }
    }

    return { rowIdx: -1, type: "none" };
  };

  // Upload files in chunks of 5
  const handleFilesSelected = async (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: fileArray.length });

    const newItems: UploadedMatchItem[] = [...items];
    const chunkSize = 5;

    try {
      for (let i = 0; i < fileArray.length; i += chunkSize) {
        const chunk = fileArray.slice(i, i + chunkSize);
        const formData = new FormData();
        chunk.forEach((f) => formData.append("files", f));

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.urls) {
          // If the backend returns items with originalName, use it; else fallback to chunk names
          const uploadedList: Array<{ originalName: string; url: string }> =
            data.items || data.urls.map((url: string, idx: number) => ({
              originalName: chunk[idx]?.name || `image_${i + idx}.jpg`,
              url,
            }));

          uploadedList.forEach((up, subIdx) => {
            const file = chunk[subIdx];
            const match = findBestRowMatch(up.originalName, rows);

            newItems.push({
              id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              originalName: up.originalName,
              fileSize: file ? file.size : 0,
              url: up.url,
              previewUrl: up.url,
              matchedRowIdx: match.rowIdx,
              matchType: match.type,
            });
          });
        }

        setUploadProgress({
          current: Math.min(i + chunkSize, fileArray.length),
          total: fileArray.length,
        });
      }

      setItems(newItems);
    } catch (err) {
      console.error("Bulk upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Reassign an item to a different row manually
  const handleReassignRow = (itemId: string, newRowIdx: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              matchedRowIdx: newRowIdx,
              matchType: newRowIdx === -1 ? "none" : "manual",
            }
          : it
      )
    );
  };

  // Remove an uploaded item from list
  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  // Apply matched images back to rows
  const handleApply = () => {
    if (imagesColIdx === -1) {
      alert("Error: 'Images URL' column could not be found in spreadsheet.");
      return;
    }

    const updatedRows = rows.map((r) => [...r]);
    let appliedCount = 0;

    items.forEach((it) => {
      if (it.matchedRowIdx >= 0 && it.matchedRowIdx < updatedRows.length) {
        // Update the Images URL column for that row
        updatedRows[it.matchedRowIdx][imagesColIdx] = it.url;
        appliedCount++;
      }
    });

    onApplyMatches(updatedRows, appliedCount);
    onClose();
  };

  const matchedCount = items.filter((it) => it.matchedRowIdx !== -1).length;
  const unmatchedCount = items.length - matchedCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Upload & Auto-Match Product Images
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload images from your folder. The system will automatically map each image to its product by filename or title.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? "border-blue-500 bg-blue-50/60 scale-[0.99]"
                : "border-slate-300 hover:border-blue-400 hover:bg-slate-50/60"
            } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFilesSelected(e.target.files);
                e.target.value = "";
              }}
            />

            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
              {isUploading ? (
                <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
              ) : (
                <Upload className="w-7 h-7 text-blue-600" />
              )}
            </div>

            {isUploading ? (
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-800">
                  Uploading images ({uploadProgress.current} / {uploadProgress.total})...
                </div>
                <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden mx-auto mt-2">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{
                      width: `${(uploadProgress.current / Math.max(1, uploadProgress.total)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-bold text-slate-800">
                  Drag and drop product images here, or{" "}
                  <span className="text-blue-600 underline">browse files</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Tip: Select all images from <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-700">D:\Website\Product_uplode\Image</code>
                </p>
              </div>
            )}
          </div>

          {/* Results & Mapping Table */}
          {items.length > 0 && (
            <div className="space-y-3">
              {/* Summary Stats Bar */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-slate-700">
                    {items.length} images uploaded
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {matchedCount} auto-matched
                  </span>
                  {unmatchedCount > 0 && (
                    <span className="flex items-center gap-1 text-amber-700 font-bold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {unmatchedCount} unmatched
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="text-slate-400 hover:text-rose-600 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear all
                </button>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[340px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200 z-5">
                    <tr>
                      <th className="p-2.5 px-3 w-16">Preview</th>
                      <th className="p-2.5 px-3">File Name</th>
                      <th className="p-2.5 px-3">Assigned Product</th>
                      <th className="p-2.5 px-3 w-28">Status</th>
                      <th className="p-2.5 px-3 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it) => {
                      const isMatched = it.matchedRowIdx >= 0 && it.matchedRowIdx < rows.length;
                      const matchedProdName = isMatched
                        ? (nameColIdx !== -1 ? rows[it.matchedRowIdx][nameColIdx] : `Row #${it.matchedRowIdx + 1}`)
                        : "";

                      return (
                        <tr key={it.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Thumbnail */}
                          <td className="p-2.5 px-3">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                              <Image
                                src={it.previewUrl}
                                alt={it.originalName}
                                fill
                                sizes="40px"
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          </td>

                          {/* Filename */}
                          <td className="p-2.5 px-3">
                            <div className="font-medium text-slate-800 max-w-[200px] truncate" title={it.originalName}>
                              {it.originalName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {(it.fileSize / 1024).toFixed(1)} KB
                            </div>
                          </td>

                          {/* Product Selection Dropdown */}
                          <td className="p-2.5 px-3">
                            <select
                              value={it.matchedRowIdx}
                              onChange={(e) => handleReassignRow(it.id, parseInt(e.target.value, 10))}
                              className={`w-full max-w-sm px-2 py-1.5 rounded-lg border text-xs cursor-pointer focus:outline-none focus:ring-1 ${
                                isMatched
                                  ? "border-slate-200 bg-white text-slate-800 focus:ring-blue-500"
                                  : "border-amber-300 bg-amber-50 text-amber-900 focus:ring-amber-500"
                              }`}
                            >
                              <option value="-1">-- Do Not Assign / Unmatched --</option>
                              {rows.map((row, rIdx) => {
                                const prodName = nameColIdx !== -1 && row[nameColIdx] ? row[nameColIdx] : `Row #${rIdx + 1}`;
                                return (
                                  <option key={rIdx} value={rIdx}>
                                    #{rIdx + 1}: {prodName}
                                  </option>
                                );
                              })}
                            </select>
                          </td>

                          {/* Match Status Badge */}
                          <td className="p-2.5 px-3">
                            {isMatched ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                Matched
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                                Unmatched
                              </span>
                            )}
                          </td>

                          {/* Remove button */}
                          <td className="p-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(it.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title="Remove image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={matchedCount === 0 || isUploading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Apply Matched Images ({matchedCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
