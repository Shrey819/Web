"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Download, FileSpreadsheet } from "lucide-react";
import { exportProductsToCSV } from "@/app/actions/productExport";
import { useToastStore } from "@/store/useToastStore";

interface ExportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalProductsCount: number;
  filteredCount: number;
  selectedIds: string[];
  filteredIds?: string[];
  currentSearch?: string;
  currentCategory?: string;
  currentStatus?: string;
}

export function ExportProductsModal({
  isOpen,
  onClose,
  totalProductsCount,
  filteredCount,
  selectedIds,
  filteredIds = [],
  currentSearch = "",
  currentCategory = "",
  currentStatus = "",
}: ExportProductsModalProps) {
  const { addToast } = useToastStore();
  const selectedCount = selectedIds.length;

  const [scope, setScope] = useState<"all" | "filtered" | "selected">("all");
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (selectedIds.length > 0) {
        setScope("selected");
      } else if (filteredCount < totalProductsCount) {
        setScope("filtered");
      } else {
        setScope("all");
      }
    }
  }, [isOpen, selectedIds.length, filteredCount, totalProductsCount]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const res = await exportProductsToCSV({
        scope,
        format,
        selectedIds,
        filteredIds,
        search: currentSearch,
        category: currentCategory,
        status: currentStatus,
        baseUrl,
      });

      if (!res.success) {
        addToast("error", "Export Failed", res.error || "Could not generate export.");
        setIsExporting(false);
        return;
      }

      if (res.format === "xlsx" && res.xlsxBase64) {
        // Trigger binary Excel download
        const byteCharacters = atob(res.xlsxBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", res.filename || "products_export.xlsx");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (res.csvContent) {
        // Trigger text CSV download
        const blob = new Blob(["\ufeff" + res.csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", res.filename || "products_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      addToast(
        "success",
        "Export Complete",
        `Successfully exported ${res.totalProducts} products to ${format.toUpperCase()}.`
      );
      onClose();
    } catch (err: any) {
      addToast("error", "Export Error", err.message || "An unexpected error occurred.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Which items do you want to export?
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="space-y-3">
            {/* Option 1: All */}
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <input
                type="radio"
                name="exportScope"
                value="all"
                checked={scope === "all"}
                onChange={() => setScope("all")}
                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                All
              </span>
            </label>

            {/* Option 2: Filtered */}
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <input
                type="radio"
                name="exportScope"
                value="filtered"
                checked={scope === "filtered"}
                onChange={() => setScope("filtered")}
                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                Filtered ({filteredCount})
              </span>
            </label>

            {/* Option 3: Selected */}
            <label
              className={`flex items-center gap-3 select-none ${
                selectedCount === 0
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer group"
              }`}
            >
              <input
                type="radio"
                name="exportScope"
                value="selected"
                disabled={selectedCount === 0}
                checked={scope === "selected"}
                onChange={() => setScope("selected")}
                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
              />
              <span
                className={`text-sm font-semibold ${
                  selectedCount === 0
                    ? "text-slate-400"
                    : "text-slate-800 group-hover:text-blue-600"
                } transition-colors`}
              >
                Selected ({selectedCount})
              </span>
            </label>
          </div>

          {/* Format Selector */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="text-xs font-bold text-slate-700 block">File Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat("xlsx")}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                  format === "xlsx"
                    ? "border-blue-500 bg-blue-50/50 text-blue-900 ring-2 ring-blue-100"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold leading-tight">Excel (.xlsx)</div>
                    <div className="text-[10px] text-slate-500 leading-tight">Bounded cell widths</div>
                  </div>
                </div>
                {format === "xlsx" && <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                  format === "csv"
                    ? "border-blue-500 bg-blue-50/50 text-blue-900 ring-2 ring-blue-100"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold leading-tight">CSV (.csv)</div>
                    <div className="text-[10px] text-slate-500 leading-tight">Plain CSV file</div>
                  </div>
                </div>
                {format === "csv" && <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Your items and all their data will be downloaded as an{" "}
            <strong className="text-slate-700">{format === "xlsx" ? "Excel (.xlsx)" : "CSV (.csv)"}</strong> file.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Exporting...
                </>
              ) : (
                "Export"
              )}
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            Note: Digital products are not exported.
          </p>
        </div>
      </div>
    </div>
  );
}
