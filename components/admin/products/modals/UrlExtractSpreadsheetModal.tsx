"use client";

import { useState } from "react";
import Image from "next/image";
import {
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Save,
  Check,
  ChevronDown,
  ChevronUp,
  Cloud,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  AlertTriangle,
  FileText,
  Link2,
  Image as ImageIcon,
  Star,
  UploadCloud,
} from "lucide-react";
import {
  extractProductFromUrlAction,
  saveScrapedProductRowAction,
  checkProductExistsAction,
  ScrapedProductRow,
  ScrapedProductImage,
} from "@/app/actions/productScraper";
import { useToastStore } from "@/store/useToastStore";
import { ProductMediaManagerModal } from "./ProductMediaManagerModal";

interface UrlExtractSpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsSaved?: () => void;
}

export function UrlExtractSpreadsheetModal({
  isOpen,
  onClose,
  onProductsSaved,
}: UrlExtractSpreadsheetModalProps) {
  const { addToast } = useToastStore();

  const [urlInput, setUrlInput] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStep, setExtractStep] = useState<string>("");
  const [rows, setRows] = useState<ScrapedProductRow[]>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [hasSavedAny, setHasSavedAny] = useState(false);
  const [newAppInput, setNewAppInput] = useState<Record<string, string>>({});
  const [newImageInput, setNewImageInput] = useState<Record<string, string>>({});
  const [activeMediaRowId, setActiveMediaRowId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExtract = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      addToast("warning", "URL Required", "Please enter a product web URL to extract.");
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      addToast("error", "Invalid URL", "Please enter a valid HTTP or HTTPS URL.");
      return;
    }

    // Check if this URL is already in the current grid
    if (rows.some((r) => r.sourceUrl.toLowerCase() === trimmed.toLowerCase())) {
      addToast("info", "Already in Table", "This URL is already in your spreadsheet grid below.");
      return;
    }

    setIsExtracting(true);
    setExtractStep("1/3 Downloading remote product data & images...");

    try {
      const res = await extractProductFromUrlAction(trimmed);

      if (!res.success || !res.data) {
        addToast("error", "Extraction Failed", res.error || "Could not parse product details from URL.");
        setIsExtracting(false);
        setExtractStep("");
        return;
      }

      setExtractStep("2/3 Syncing media to Cloudinary storage...");

      // Add to rows at the top
      setRows((prev) => [res.data!, ...prev]);
      setUrlInput("");

      if (res.data.existingProduct) {
        addToast(
          "warning",
          "Already in Catalog",
          `"${res.data.name.substring(0, 35)}..." exists in your store. Defaulted to "Update Existing" mode.`
        );
      } else {
        addToast(
          "success",
          "Product Extracted!",
          `"${res.data.name.substring(0, 35)}..." added as row. Please set your selling price.`
        );
      }
    } catch (err: any) {
      console.error("Extraction error:", err);
      addToast("error", "Error", err.message || "Failed to extract product from URL.");
    } finally {
      setIsExtracting(false);
      setExtractStep("");
    }
  };

  const handleFillSampleUrl = () => {
    setUrlInput("https://www.shreeautotech.com/products/hiwin-el-self-lubricating-ballscrew");
  };

  const handleUpdateRowField = (id: string, field: keyof ScrapedProductRow, value: any) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value, saveError: undefined } : row))
    );
  };

  const handleNameChange = async (rowId: string, newName: string) => {
    handleUpdateRowField(rowId, "name", newName);

    // If user edited the name, re-check duplicate status
    if (newName.trim().length >= 3) {
      try {
        const check = await checkProductExistsAction(newName.trim());
        if (check.exists && check.product) {
          setRows((prev) =>
            prev.map((r) => {
              if (r.id !== rowId) return r;
              const hasExistingImgs = check.product!.images && check.product!.images.length > 0;
              return {
                ...r,
                name: newName,
                existingProduct: check.product,
                saveMode: "update",
                price: r.price === "" && check.product!.price > 0 ? check.product!.price : r.price,
                images: hasExistingImgs ? check.product!.images! : r.images,
                imageUrl: hasExistingImgs ? check.product!.images![0].url : r.imageUrl,
                cloudinaryUploaded: hasExistingImgs ? Boolean(check.product!.images![0].cloudinaryUploaded) : r.cloudinaryUploaded,
              };
            })
          );
        } else {
          setRows((prev) =>
            prev.map((r) =>
              r.id === rowId
                ? {
                    ...r,
                    name: newName,
                    existingProduct: null,
                    saveMode: "create",
                  }
                : r
            )
          );
        }
      } catch {}
    }
  };

  // Multiple Image Helpers
  const handleSetPrimaryImage = (rowId: string, imgIdx: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const updatedImages = (r.images || []).map((img, idx) => ({
          ...img,
          isPrimary: idx === imgIdx,
        }));
        const primaryUrl = updatedImages[imgIdx]?.url || r.imageUrl;
        return {
          ...r,
          images: updatedImages,
          imageUrl: primaryUrl,
        };
      })
    );
  };

  const handleAddImage = (rowId: string, url: string) => {
    const clean = url.trim();
    if (!clean) return;
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const isFirst = !r.images || r.images.length === 0;
        const newImg: ScrapedProductImage = {
          url: clean,
          originalUrl: clean,
          isPrimary: isFirst,
          altText: r.name,
          cloudinaryUploaded: clean.includes("cloudinary"),
        };
        const updatedImages = [...(r.images || []), newImg];
        return {
          ...r,
          images: updatedImages,
          imageUrl: isFirst ? clean : r.imageUrl,
        };
      })
    );
  };

  const handleAddMultipleImages = (rowId: string, urls: string[]) => {
    if (!urls || urls.length === 0) return;
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const currentImages = [...(r.images || [])];
        const newImgs: ScrapedProductImage[] = urls
          .map((u) => u.trim())
          .filter(Boolean)
          .map((clean, idx) => ({
            url: clean,
            originalUrl: clean,
            isPrimary: currentImages.length === 0 && idx === 0,
            altText: r.name,
            cloudinaryUploaded: clean.includes("cloudinary"),
          }));
        const updatedImages = [...currentImages, ...newImgs];
        const primary = updatedImages.find((img) => img.isPrimary) || updatedImages[0];
        return {
          ...r,
          images: updatedImages,
          imageUrl: primary ? primary.url : r.imageUrl,
          cloudinaryUploaded: primary ? Boolean(primary.cloudinaryUploaded) : r.cloudinaryUploaded,
        };
      })
    );
  };

  const handleAddImageClick = (rowId: string) => {
    const inputVal = (newImageInput[rowId] || "").trim();
    if (inputVal) {
      handleAddImage(rowId, inputVal);
      setNewImageInput((prev) => ({ ...prev, [rowId]: "" }));
    } else {
      // If user clicks add image and there is no URL given, open Cloudinary media manager modal!
      setActiveMediaRowId(rowId);
    }
  };

  const handleUpdateImage = (rowId: string, imgIdx: number, newUrl: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const updatedImages = [...(r.images || [])];
        if (updatedImages[imgIdx]) {
          updatedImages[imgIdx] = {
            ...updatedImages[imgIdx],
            url: newUrl,
            cloudinaryUploaded: newUrl.includes("cloudinary"),
          };
        }
        const primary = updatedImages.find((img) => img.isPrimary) || updatedImages[0];
        return {
          ...r,
          images: updatedImages,
          imageUrl: primary ? primary.url : "",
        };
      })
    );
  };

  const handleRemoveImage = (rowId: string, imgIdx: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const updatedImages = (r.images || []).filter((_, idx) => idx !== imgIdx);
        if (updatedImages.length > 0 && !updatedImages.some((img) => img.isPrimary)) {
          updatedImages[0].isPrimary = true;
        }
        const primary = updatedImages.find((img) => img.isPrimary) || updatedImages[0];
        return {
          ...r,
          images: updatedImages,
          imageUrl: primary ? primary.url : "",
        };
      })
    );
  };

  // Specifications helpers
  const handleAddSpec = (rowId: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              featureHighlights: [...(r.featureHighlights || []), { label: "", value: "" }],
            }
          : r
      )
    );
  };

  const handleUpdateSpec = (rowId: string, specIdx: number, field: "label" | "value", value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const updated = [...(r.featureHighlights || [])];
        if (updated[specIdx]) {
          updated[specIdx] = { ...updated[specIdx], [field]: value };
        }
        return { ...r, featureHighlights: updated };
      })
    );
  };

  const handleRemoveSpec = (rowId: string, specIdx: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              featureHighlights: (r.featureHighlights || []).filter((_, i) => i !== specIdx),
            }
          : r
      )
    );
  };

  // Application helpers
  const handleAddApplication = (rowId: string, tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        if ((r.applications || []).includes(clean)) return r;
        return { ...r, applications: [...(r.applications || []), clean] };
      })
    );
  };

  const handleRemoveApplication = (rowId: string, appIdx: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              applications: (r.applications || []).filter((_, i) => i !== appIdx),
            }
          : r
      )
    );
  };

  // Technical Link helpers
  const handleAddTechLink = (rowId: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              technicalSupportLinks: [
                ...(r.technicalSupportLinks || []),
                { title: "Technical Document", url: "" },
              ],
            }
          : r
      )
    );
  };

  const handleUpdateTechLink = (
    rowId: string,
    linkIdx: number,
    field: "title" | "url",
    value: string
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const updated = [...(r.technicalSupportLinks || [])];
        if (updated[linkIdx]) {
          updated[linkIdx] = { ...updated[linkIdx], [field]: value };
        }
        return { ...r, technicalSupportLinks: updated };
      })
    );
  };

  const handleRemoveTechLink = (rowId: string, linkIdx: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              technicalSupportLinks: (r.technicalSupportLinks || []).filter((_, i) => i !== linkIdx),
            }
          : r
      )
    );
  };

  const handleSaveSingleRow = async (rowId: string) => {
    const targetRow = rows.find((r) => r.id === rowId);
    if (!targetRow) return;

    const priceNum = typeof targetRow.price === "number" ? targetRow.price : parseFloat(targetRow.price || "0");
    if (isNaN(priceNum) || priceNum <= 0) {
      addToast("warning", "Price Required", `Please set a valid selling price (₹) for "${targetRow.name.slice(0, 30)}..."`);
      handleUpdateRowField(rowId, "saveError", "Please enter price > 0");
      return;
    }

    handleUpdateRowField(rowId, "saveStatus", "saving");

    try {
      const res = await saveScrapedProductRowAction(targetRow);
      if (res.success && res.productId) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === rowId
              ? {
                  ...r,
                  saveStatus: "saved",
                  savedProductId: res.productId,
                  savedMode: res.mode,
                  saveError: undefined,
                }
              : r
          )
        );
        setHasSavedAny(true);
        const actionText = res.mode === "updated" ? "Updated" : "Saved";
        addToast("success", `${actionText} to Database`, `"${targetRow.name}" was successfully ${actionText.toLowerCase()} in your store catalog!`);
      } else {
        handleUpdateRowField(rowId, "saveStatus", "error");
        handleUpdateRowField(rowId, "saveError", res.error || "Save failed");
        addToast("error", "Save Failed", res.error || "Could not save product into database.");
      }
    } catch (err: any) {
      handleUpdateRowField(rowId, "saveStatus", "error");
      handleUpdateRowField(rowId, "saveError", err.message || "Unknown error");
      addToast("error", "Error", err.message || "Save failed");
    }
  };

  const handleSaveAllUnsaved = async () => {
    const unsavedRows = rows.filter((r) => r.saveStatus !== "saved");
    if (unsavedRows.length === 0) {
      addToast("info", "Nothing to Save", "All products in the table are already saved.");
      return;
    }

    // Check if all unsaved rows have price
    const missingPrice = unsavedRows.filter((r) => {
      const p = typeof r.price === "number" ? r.price : parseFloat(r.price || "0");
      return isNaN(p) || p <= 0;
    });

    if (missingPrice.length > 0) {
      addToast(
        "error",
        "Missing Selling Prices",
        `${missingPrice.length} row(s) are missing a valid Selling Price (₹). Please fill them before saving.`
      );
      return;
    }

    setIsBulkSaving(true);
    let successCount = 0;

    for (const r of unsavedRows) {
      handleUpdateRowField(r.id, "saveStatus", "saving");
      try {
        const res = await saveScrapedProductRowAction(r);
        if (res.success && res.productId) {
          setRows((prev) =>
            prev.map((item) =>
              item.id === r.id
                ? {
                    ...item,
                    saveStatus: "saved",
                    savedProductId: res.productId,
                    savedMode: res.mode,
                    saveError: undefined,
                  }
                : item
            )
          );
          successCount++;
        } else {
          handleUpdateRowField(r.id, "saveStatus", "error");
          handleUpdateRowField(r.id, "saveError", res.error || "Save failed");
        }
      } catch (err: any) {
        handleUpdateRowField(r.id, "saveStatus", "error");
        handleUpdateRowField(r.id, "saveError", err.message || "Failed");
      }
    }

    setIsBulkSaving(false);
    if (successCount > 0) {
      setHasSavedAny(true);
      addToast("success", "Bulk Save Completed", `Successfully processed ${successCount} products in your store catalog.`);
    }
  };

  const handleDeleteRow = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleClose = () => {
    if (hasSavedAny && onProductsSaved) {
      onProductsSaved();
    }
    onClose();
  };

  const savedCount = rows.filter((r) => r.saveStatus === "saved").length;
  const unsavedCount = rows.filter((r) => r.saveStatus !== "saved").length;
  const updateCount = rows.filter((r) => r.saveMode === "update" && r.saveStatus !== "saved").length;
  const createCount = rows.filter((r) => r.saveMode === "create" && r.saveStatus !== "saved").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  URL Product Extractor & Excel Spreadsheet
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Excel Mode: 1 Row = 1 Product
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Auto Duplicate Detection
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Paste supplier URLs to extract products and sync images to Cloudinary. If a product already exists, choose whether to <strong>Update Existing</strong> or <strong>Create as New</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top URL Input Bar */}
        <div className="p-4 sm:px-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isExtracting) {
                    handleExtract();
                  }
                }}
                disabled={isExtracting}
                placeholder="Paste product page URL (e.g. https://www.shreeautotech.com/products/hiwin-el-self-lubricating-ballscrew)"
                className="w-full pl-3.5 pr-24 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 shadow-2xs font-mono"
              />
              {urlInput && (
                <button
                  type="button"
                  onClick={() => setUrlInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleExtract}
              disabled={isExtracting || !urlInput.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>⚡ Extract & Add Row</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Helper / Sample URL */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Quick Test:</span>
              <button
                type="button"
                onClick={handleFillSampleUrl}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] font-mono text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
              >
                <span>shreeautotech.com/products/hiwin-el-...</span>
                <span className="text-[10px] text-slate-400">(Click to fill)</span>
              </button>
            </div>

            {isExtracting && (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium animate-pulse text-[11px]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{extractStep}</span>
              </div>
            )}
          </div>
        </div>

        {/* Spreadsheet Table Container */}
        <div className="flex-1 overflow-auto bg-slate-100/50 dark:bg-slate-950/50 p-4">
          {rows.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                No products in the spreadsheet yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4">
                Paste the URL of any product above (e.g. Shree Autotech) and click <span className="font-semibold text-slate-700 dark:text-slate-300">"⚡ Extract & Add Row"</span>. Each link will create one editable Excel row with automatic duplicate detection.
              </p>
              <button
                type="button"
                onClick={handleFillSampleUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Try Sample Shree Autotech Ball Screw URL
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider select-none">
                      <th className="py-2.5 px-3 text-center w-12">#</th>
                      <th className="py-2.5 px-3 w-16 text-center">Image</th>
                      <th className="py-2.5 px-3 min-w-[280px]">Product Name & Match Mode</th>
                      <th className="py-2.5 px-3 min-w-[120px]">Brand</th>
                      <th className="py-2.5 px-3 min-w-[130px]">Category</th>
                      <th className="py-2.5 px-3 min-w-[130px]">SKU</th>
                      <th className="py-2.5 px-3 min-w-[130px] bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">
                        Selling Price (₹) *
                      </th>
                      <th className="py-2.5 px-3 min-w-[110px]">MRP (₹)</th>
                      <th className="py-2.5 px-3 min-w-[110px]">Specs & Data</th>
                      <th className="py-2.5 px-3 min-w-[90px]">Status</th>
                      <th className="py-2.5 px-3 text-center w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((row, idx) => {
                      const isExpanded = expandedRowId === row.id;
                      const isSaved = row.saveStatus === "saved";
                      const isSaving = row.saveStatus === "saving";
                      const hasError = row.saveStatus === "error";
                      const isUpdateMode = row.saveMode === "update";

                      return (
                        <tr
                          key={row.id}
                          className={`group transition-colors ${
                            isSaved
                              ? "bg-emerald-50/30 dark:bg-emerald-950/15"
                              : hasError
                              ? "bg-rose-50/30 dark:bg-rose-950/15"
                              : isUpdateMode
                              ? "bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-50/40"
                              : "hover:bg-slate-50/70 dark:hover:bg-slate-850/60"
                          }`}
                        >
                          {/* Row # / Save status icon */}
                          <td className="py-2.5 px-3 text-center align-middle">
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin mx-auto" />
                            ) : isSaved ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                            ) : hasError ? (
                              <span title={row.saveError || "Error saving"}>
                                <AlertCircle className="w-4 h-4 text-rose-500 mx-auto" />
                              </span>
                            ) : (
                              <span className="font-mono text-slate-400 text-[11px]">{idx + 1}</span>
                            )}
                          </td>

                          {/* Image Thumbnail with Cloudinary status & Multi-image badge */}
                          <td className="py-2 px-2 text-center align-middle">
                            <div className="relative w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden mx-auto group/img">
                              {row.imageUrl ? (
                                <Image
                                  src={row.imageUrl}
                                  alt={row.name}
                                  fill
                                  unoptimized
                                  sizes="48px"
                                  className="object-contain p-1"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">
                                  No Img
                                </div>
                              )}

                              {/* Multi-image count badge */}
                              {row.images && row.images.length > 1 && (
                                <span
                                  className="absolute top-0.5 right-0.5 bg-blue-600/90 text-white text-[8px] font-bold px-1 rounded-full leading-tight shadow-xs"
                                  title={`${row.images.length} product images extracted`}
                                >
                                  +{row.images.length - 1}
                                </span>
                              )}

                              {/* Cloudinary or Existing DB reuse badge */}
                              {row.existingProduct && row.saveMode === "update" ? (
                                <div
                                  className="absolute bottom-0 inset-x-0 bg-blue-600/90 text-white text-[8px] font-bold py-0.5 text-center leading-none"
                                  title="Reusing previously uploaded image from database"
                                >
                                  DB Img
                                </div>
                              ) : row.cloudinaryUploaded ? (
                                <div
                                  className="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-white text-[8px] font-bold py-0.5 text-center leading-none"
                                  title="Image uploaded to Cloudinary storage"
                                >
                                  Cloud
                                </div>
                              ) : null}
                            </div>
                          </td>

                          {/* Product Name (Excel Cell Input) & Duplicate Status */}
                          <td className="py-2 px-2.5 align-middle">
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) => handleNameChange(row.id, e.target.value)}
                              disabled={isSaved || isSaving}
                              className="w-full px-2 py-1.5 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 rounded text-xs font-semibold text-slate-900 dark:text-slate-100 transition-colors"
                            />

                            {/* Existing Product Badge & Option to Update or Create New */}
                            {row.existingProduct ? (
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-bold">
                                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span>
                                    Already Exists {row.existingProduct.price > 0 ? `(₹${row.existingProduct.price})` : ""}
                                  </span>
                                </span>

                                {/* Mode Switcher Pill */}
                                <div className="inline-flex items-center rounded-lg p-0.5 bg-slate-200/90 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 text-[10px] font-bold">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRowField(row.id, "saveMode", "update")}
                                    disabled={isSaved || isSaving}
                                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                      row.saveMode === "update"
                                        ? "bg-amber-500 text-white shadow-2xs"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                                    title="Update the existing product in your catalog with new price & specs"
                                  >
                                    🔄 Update
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRowField(row.id, "saveMode", "create")}
                                    disabled={isSaved || isSaving}
                                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                      row.saveMode === "create"
                                        ? "bg-emerald-600 text-white shadow-2xs"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                                    title="Create as a new separate product with separate slug"
                                  >
                                    ➕ Create New
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold px-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                <span>✨ New Catalog Item</span>
                              </div>
                            )}

                            {row.sourceUrl && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate px-1 mt-0.5">
                                <a
                                  href={row.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-blue-500 hover:underline flex items-center gap-0.5 truncate"
                                >
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{row.sourceUrl}</span>
                                </a>
                              </div>
                            )}
                          </td>

                          {/* Brand Cell */}
                          <td className="py-2 px-2.5 align-middle">
                            <input
                              type="text"
                              value={row.brand}
                              onChange={(e) => handleUpdateRowField(row.id, "brand", e.target.value)}
                              disabled={isSaved || isSaving}
                              placeholder="Brand"
                              className="w-full px-2 py-1.5 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 rounded text-xs text-slate-800 dark:text-slate-200"
                            />
                          </td>

                          {/* Category Cell */}
                          <td className="py-2 px-2.5 align-middle">
                            <input
                              type="text"
                              value={row.category}
                              onChange={(e) => handleUpdateRowField(row.id, "category", e.target.value)}
                              disabled={isSaved || isSaving}
                              placeholder="Category"
                              className="w-full px-2 py-1.5 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 rounded text-xs text-slate-800 dark:text-slate-200"
                            />
                          </td>

                          {/* SKU Cell */}
                          <td className="py-2 px-2.5 align-middle">
                            <input
                              type="text"
                              value={row.sku}
                              onChange={(e) => handleUpdateRowField(row.id, "sku", e.target.value)}
                              disabled={isSaved || isSaving}
                              placeholder="Auto SKU"
                              className="w-full px-2 py-1.5 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 rounded text-xs font-mono text-slate-700 dark:text-slate-300"
                            />
                          </td>

                          {/* Selling Price (₹) - Highlighted Excel Cell */}
                          <td className={`py-2 px-2.5 align-middle ${isUpdateMode ? "bg-amber-50/40 dark:bg-amber-950/20" : "bg-emerald-50/40 dark:bg-emerald-950/20"}`}>
                            <div className="relative">
                              <span className={`absolute left-2 top-1/2 -translate-y-1/2 font-bold text-xs ${isUpdateMode ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                ₹
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={row.price}
                                onChange={(e) =>
                                  handleUpdateRowField(
                                    row.id,
                                    "price",
                                    e.target.value === "" ? "" : parseFloat(e.target.value)
                                  )
                                }
                                disabled={isSaved || isSaving}
                                placeholder="Enter Price"
                                className={`w-full pl-6 pr-2 py-1.5 rounded text-xs font-bold transition-colors ${
                                  row.price !== "" && Number(row.price) > 0
                                    ? isUpdateMode
                                      ? "bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs"
                                      : "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs"
                                    : "bg-white dark:bg-slate-900 text-rose-600 border border-rose-300 dark:border-rose-800 placeholder:text-rose-400 animate-pulse"
                                } focus:outline-hidden focus:ring-1 focus:ring-emerald-500`}
                              />
                            </div>
                            {isUpdateMode && row.existingProduct && row.existingProduct.price > 0 && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 block px-1 mt-0.5 font-medium">
                                Current Price: ₹{row.existingProduct.price}
                              </span>
                            )}
                            {row.saveError && (
                              <span className="text-[10px] text-rose-500 block px-1 mt-0.5 font-medium">
                                {row.saveError}
                              </span>
                            )}
                          </td>

                          {/* MRP / Strikethrough Price */}
                          <td className="py-2 px-2.5 align-middle">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                                ₹
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={row.strikethroughPrice ?? ""}
                                onChange={(e) =>
                                  handleUpdateRowField(
                                    row.id,
                                    "strikethroughPrice",
                                    e.target.value === "" ? "" : parseFloat(e.target.value)
                                  )
                                }
                                disabled={isSaved || isSaving}
                                placeholder="Optional MRP"
                                className="w-full pl-5 pr-2 py-1.5 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 rounded text-xs text-slate-600 dark:text-slate-400"
                              />
                            </div>
                          </td>

                          {/* Specs & Data Details Pill */}
                          <td className="py-2 px-2.5 align-middle">
                            <button
                              type="button"
                              onClick={() => setExpandedRowId(isExpanded ? null : row.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              <span>
                                {row.featureHighlights?.length || 0} specs / {row.applications?.length || 0} apps
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          </td>

                          {/* Status Cell */}
                          <td className="py-2 px-2.5 align-middle">
                            <select
                              value={row.status}
                              onChange={(e) =>
                                handleUpdateRowField(row.id, "status", e.target.value as "ACTIVE" | "DRAFT")
                              }
                              disabled={isSaved || isSaving}
                              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="DRAFT">DRAFT</option>
                            </select>
                          </td>

                          {/* Actions */}
                          <td className="py-2 px-3 text-center align-middle whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {isSaved ? (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                                  row.savedMode === "updated"
                                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                                    : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                }`}>
                                  <Check className="w-3 h-3" />
                                  <span>{row.savedMode === "updated" ? "Updated" : "Created"}</span>
                                </span>
                              ) : isUpdateMode ? (
                                <button
                                  type="button"
                                  onClick={() => handleSaveSingleRow(row.id)}
                                  disabled={isSaving}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                                  title="Update existing product in store catalog"
                                >
                                  {isSaving ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="w-3 h-3" />
                                  )}
                                  <span>Update</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSaveSingleRow(row.id)}
                                  disabled={isSaving}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                                  title="Create as new product in store catalog"
                                >
                                  {isSaving ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Save className="w-3 h-3" />
                                  )}
                                  <span>Save New</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.id)}
                                disabled={isSaving}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                                title="Remove row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Expandable Editable Specs & Details Drawer for Active Row */}
              {expandedRowId && (
                <div className="border-t-2 border-emerald-500/30 dark:border-emerald-500/20 p-5 bg-slate-50 dark:bg-slate-900 animate-in fade-in duration-150 shadow-inner">
                  {(() => {
                    const row = rows.find((r) => r.id === expandedRowId);
                    if (!row) return null;
                    return (
                      <div className="space-y-4">
                        {/* Drawer Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>Edit All Details for:</span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-mono text-xs px-2 py-0.5 rounded bg-emerald-100/70 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800">
                                {row.name}
                              </span>
                            </h4>
                            {row.existingProduct && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                Matching Existing ID: {row.existingProduct.id}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                              Edits automatically update this row before saving
                            </span>
                            <button
                              type="button"
                              onClick={() => setExpandedRowId(null)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                            >
                              Done Editing Details
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                          {/* 1. Specifications Editor */}
                          <div className="p-4 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 shadow-2xs flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                                <span>Specifications & Parameters</span>
                                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  {row.featureHighlights?.length || 0}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddSpec(row.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-md text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3" /> Add Spec
                              </button>
                            </div>

                            <div className="flex-1 max-h-56 overflow-y-auto space-y-2 pr-1">
                              {row.featureHighlights && row.featureHighlights.length > 0 ? (
                                row.featureHighlights.map((f, i) => (
                                  <div key={i} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                                    <input
                                      type="text"
                                      value={f.label}
                                      onChange={(e) => handleUpdateSpec(row.id, i, "label", e.target.value)}
                                      placeholder="Parameter Name"
                                      className="w-1/2 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-blue-500 font-medium"
                                    />
                                    <input
                                      type="text"
                                      value={f.value}
                                      onChange={(e) => handleUpdateSpec(row.id, i, "value", e.target.value)}
                                      placeholder="Value (e.g. 10,000 km)"
                                      className="w-1/2 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSpec(row.id, i)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer shrink-0"
                                      title="Remove spec"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className="p-4 text-center text-slate-400 text-[11px] border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                                  No specifications. Click "+ Add Spec" to add technical parameters.
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 2. Target Applications Tag Editor */}
                          <div className="p-4 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 shadow-2xs flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                                <span>Target Applications</span>
                                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  {row.applications?.length || 0}
                                </span>
                              </div>
                            </div>

                            {/* Tag Input */}
                            <div className="flex items-center gap-1.5 mb-3">
                              <input
                                type="text"
                                value={newAppInput[row.id] || ""}
                                onChange={(e) => setNewAppInput((prev) => ({ ...prev, [row.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddApplication(row.id, newAppInput[row.id] || "");
                                    setNewAppInput((prev) => ({ ...prev, [row.id]: "" }));
                                  }
                                }}
                                placeholder="Type application & press Enter"
                                className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  handleAddApplication(row.id, newAppInput[row.id] || "");
                                  setNewAppInput((prev) => ({ ...prev, [row.id]: "" }));
                                }}
                                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Tag Badges with Remove */}
                            <div className="flex-1 max-h-44 overflow-y-auto pr-1">
                              {row.applications && row.applications.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {row.applications.map((app, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-[11px] rounded-lg font-medium group/tag"
                                    >
                                      <span>{app}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveApplication(row.id, i)}
                                        className="p-0.5 text-blue-400 hover:text-rose-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-colors cursor-pointer"
                                        title="Remove tag"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-4 text-center text-slate-400 text-[11px] border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                                  No application tags added yet.
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 3. Technical Documents & Links Editor */}
                          <div className="p-4 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 shadow-2xs flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                                <Link2 className="w-3.5 h-3.5 text-blue-500" />
                                <span>Technical Document Links</span>
                                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  {row.technicalSupportLinks?.length || 0} docs
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddTechLink(row.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-md text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3" /> Add Doc
                              </button>
                            </div>

                            {/* Documents List */}
                            <div className="flex-1 max-h-56 overflow-y-auto space-y-2 pr-1">
                              {row.technicalSupportLinks && row.technicalSupportLinks.length > 0 ? (
                                row.technicalSupportLinks.map((doc, i) => (
                                  <div key={i} className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        value={doc.title}
                                        onChange={(e) => handleUpdateTechLink(row.id, i, "title", e.target.value)}
                                        placeholder="Document Title (e.g. Full Specs PDF)"
                                        className="flex-1 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
                                      />
                                      {doc.url && (
                                        <a
                                          href={doc.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1 text-blue-500 hover:text-blue-700"
                                          title="Open link in new tab"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveTechLink(row.id, i)}
                                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                        title="Remove document"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      value={doc.url}
                                      onChange={(e) => handleUpdateTechLink(row.id, i, "url", e.target.value)}
                                      placeholder="https://... (PDF, CAD or spec sheet URL)"
                                      className="w-full px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono text-slate-600 dark:text-slate-400 focus:outline-hidden"
                                    />
                                  </div>
                                ))
                              ) : (
                                <div className="p-4 text-center text-slate-400 text-[11px] border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                                  No documents attached. Click "+ Add Doc" to add PDF specs or CAD downloads.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 4. Multiple Product Images Gallery */}
                        <div className="p-4 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 shadow-2xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <ImageIcon className="w-4 h-4 text-emerald-500" />
                              <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                Product Images Gallery ({row.images?.length || (row.imageUrl ? 1 : 0)})
                              </h5>

                              {row.existingProduct && row.saveMode === "update" ? (
                                <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                                  💾 Reusing previously uploaded images from database (No re-upload)
                                </span>
                              ) : row.cloudinaryUploaded ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                                  ☁️ Cloudinary Storage Synced
                                </span>
                              ) : null}
                            </div>

                            {/* Add image input & Cloudinary selector */}
                            <div className="flex items-center gap-1.5 w-full sm:w-auto">
                              <input
                                type="url"
                                value={newImageInput[row.id] || ""}
                                onChange={(e) => setNewImageInput((prev) => ({ ...prev, [row.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddImageClick(row.id);
                                  }
                                }}
                                placeholder="Paste URL or click Add to upload/browse..."
                                className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden w-64"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddImageClick(row.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
                                title={
                                  (newImageInput[row.id] || "").trim()
                                    ? "Add typed image URL"
                                    : "Open Cloudinary media library to select or upload from local"
                                }
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Image</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setActiveMediaRowId(row.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
                                title="Open Cloudinary Media Manager (select existing or upload from local)"
                              >
                                <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
                                <span>Media Library</span>
                              </button>
                            </div>
                          </div>

                          {/* Images Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {row.images && row.images.length > 0 ? (
                              row.images.map((img, i) => (
                                <div
                                  key={i}
                                  className={`relative p-2.5 rounded-xl border transition-all ${
                                    img.isPrimary
                                      ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-500/20"
                                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
                                  }`}
                                >
                                  {/* Thumbnail Preview */}
                                  <div className="relative w-full h-32 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden mb-2">
                                    <Image
                                      src={img.url}
                                      alt={img.altText || row.name}
                                      fill
                                      unoptimized
                                      sizes="200px"
                                      className="object-contain p-2"
                                    />

                                    {/* Primary Badge or Set Primary Button */}
                                    <div className="absolute top-1.5 left-1.5">
                                      {img.isPrimary ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                                          <Star className="w-2.5 h-2.5 fill-current" /> Primary
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleSetPrimaryImage(row.id, i)}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-[10px] font-semibold transition-colors cursor-pointer"
                                        >
                                          Set Primary
                                        </button>
                                      )}
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImage(row.id, i)}
                                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                                      title="Remove image"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Editable URL Input */}
                                  <input
                                    type="text"
                                    value={img.url}
                                    onChange={(e) => handleUpdateImage(row.id, i, e.target.value)}
                                    placeholder="Image URL"
                                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono text-slate-700 dark:text-slate-300 focus:outline-hidden"
                                  />
                                </div>
                              ))
                            ) : (
                              <div className="col-span-full p-4 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                                No images found. Use "+ Add Image" above to attach product photos.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 4. Product Description / Overview Editor */}
                        <div className="p-4 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 shadow-2xs">
                          <div className="flex items-center justify-between mb-2">
                            <label className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                              <span>Product Overview / Description</span>
                            </label>
                            <span className="text-[10px] text-slate-400">
                              HTML or plain text supported
                            </span>
                          </div>
                          <textarea
                            rows={3}
                            value={row.description}
                            onChange={(e) => handleUpdateRowField(row.id, "description", e.target.value)}
                            placeholder="Detailed description of the industrial product..."
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500 leading-relaxed font-sans"
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Total Rows: <strong className="text-slate-800 dark:text-slate-200">{rows.length}</strong>
            </span>
            <span>•</span>
            <span>
              Updates: <strong className="text-amber-600 dark:text-amber-400">{updateCount}</strong>
            </span>
            <span>•</span>
            <span>
              New Items: <strong className="text-blue-600 dark:text-blue-400">{createCount}</strong>
            </span>
            <span>•</span>
            <span>
              Saved: <strong className="text-emerald-600 dark:text-emerald-400">{savedCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {rows.length > 0 && (
              <button
                type="button"
                onClick={() => setRows([])}
                disabled={isBulkSaving}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium cursor-pointer"
              >
                Clear Grid
              </button>
            )}

            {unsavedCount > 0 && (
              <button
                type="button"
                onClick={handleSaveAllUnsaved}
                disabled={isBulkSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {isBulkSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving / Updating All Rows...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save & Update All Unsaved ({unsavedCount})</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>

      {/* Cloudinary Media Library & Local File Uploader Modal */}
      {activeMediaRowId && (
        <ProductMediaManagerModal
          isOpen={Boolean(activeMediaRowId)}
          onClose={() => setActiveMediaRowId(null)}
          onAddImages={(urls) => {
            if (activeMediaRowId && urls.length > 0) {
              handleAddMultipleImages(activeMediaRowId, urls);
            }
            setActiveMediaRowId(null);
          }}
          maxSelectable={10}
        />
      )}
    </div>
  );
}
