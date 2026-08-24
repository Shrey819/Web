"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Check,
  Upload,
  FileText,
  RotateCw,
  X,
  Loader2,
  CheckCircle2,
  Download,
  ArrowRight,
} from "lucide-react";
import {
  downloadImportSampleTemplate,
  previewProductsImportAction,
  importProductsAction,
  type RowStatusInfo,
  type PreviewImportResult,
} from "@/app/actions/productImport";
import { useToastStore } from "@/store/useToastStore";
import { ExportProductsModal } from "../modals/ExportProductsModal";
import { ImportSpreadsheetGrid } from "./ImportSpreadsheetGrid";

export function ImportProductsClient() {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview & Grid data state
  const [previewData, setPreviewData] = useState<{
    headers: string[];
    rows: string[][];
    rowStatuses: RowStatusInfo[];
    stats: {
      totalRows: number;
      totalProducts: number;
      newCount: number;
      updateCount: number;
      newCategories: string[];
      newBrands: string[];
      errorCount: number;
    };
  } | null>(null);

  // Import processing state
  const [isImporting, setIsImporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    createdCount: number;
    updatedCount: number;
    totalProcessed: number;
    errors: string[];
  } | null>(null);

  // Template downloading state
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Handle Download Template (CSV or Excel)
  const handleDownloadTemplate = async (fmt: "csv" | "xlsx" = "csv") => {
    setIsDownloadingTemplate(true);
    try {
      const res = await downloadImportSampleTemplate(fmt);
      if (!res.success) {
        addToast("error", "Failed", res.error || "Could not generate template.");
        return;
      }

      if (fmt === "xlsx" && res.xlsxBase64) {
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
        link.setAttribute("download", res.filename || "products_import_template.xlsx");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addToast("success", "Template Downloaded", "Sample Excel template downloaded.");
      } else if (res.csvContent) {
        const blob = new Blob(["\ufeff" + res.csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", res.filename || "products_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addToast("success", "Template Downloaded", "Sample CSV template downloaded.");
      }
    } catch {
      addToast("error", "Error", "Failed to download template.");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // Handle File Drop & Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Parse File and Open Step 3: Review & Edit
  const handleProceedToReview = async () => {
    if (!selectedFile) return;

    setIsPreviewLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(",")[1];
        const res = await previewProductsImportAction({
          fileBase64: base64Data,
          filename: selectedFile.name,
        });

        setIsPreviewLoading(false);
        if (res.success && res.headers && res.rows && res.rowStatuses && res.stats) {
          setPreviewData({
            headers: res.headers,
            rows: res.rows,
            rowStatuses: res.rowStatuses,
            stats: res.stats,
          });
          setCurrentStep(3);
        } else {
          addToast("error", "Preview Failed", res.error || "Failed to read spreadsheet rows.");
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      setIsPreviewLoading(false);
      addToast("error", "Error", err.message || "Failed to load spreadsheet preview.");
    }
  };

  // Revalidate Grid after edits
  const handleRevalidateGrid = async (headers: string[], rows: string[][]) => {
    setIsValidating(true);
    try {
      const res = await previewProductsImportAction({
        rawGridHeaders: headers,
        rawGridRows: rows,
      });
      if (res.success && res.headers && res.rows && res.rowStatuses && res.stats) {
        setPreviewData({
          headers: res.headers,
          rows: res.rows,
          rowStatuses: res.rowStatuses,
          stats: res.stats,
        });
      }
    } catch (err) {
      console.error("Revalidation error:", err);
    } finally {
      setIsValidating(false);
    }
  };

  // Final Commit Import from Edited Grid
  const handleCommitImport = async (headers: string[], rows: string[][]) => {
    setCurrentStep(4);
    setIsImporting(true);

    try {
      const res = await importProductsAction({
        rawGridHeaders: headers,
        rawGridRows: rows,
      });

      setIsImporting(false);
      if (res.success) {
        setImportResult({
          success: true,
          createdCount: res.createdCount || 0,
          updatedCount: res.updatedCount || 0,
          totalProcessed: res.totalProcessed || 0,
          errors: res.errors || [],
        });
        addToast("success", "Import Successful", `Processed ${res.totalProcessed} products.`);
      } else {
        addToast("error", "Import Failed", res.error || "Failed to commit products.");
        setCurrentStep(3);
      }
    } catch (err: any) {
      setIsImporting(false);
      addToast("error", "Import Error", err.message || "An unexpected error occurred.");
      setCurrentStep(3);
    }
  };

  const handleResetWizard = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setImportResult(null);
    setCurrentStep(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
          <Link href="/admin/products" className="hover:text-blue-600 transition-colors">
            Products
          </Link>
          <span>&gt;</span>
          <span className="text-slate-600">Import</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            className="p-1 hover:bg-slate-100 rounded-lg text-blue-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Import products</h1>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Step Wizard Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs font-semibold">
            {/* Step 1 */}
            <div
              className={`flex items-center gap-1.5 ${
                currentStep >= 1 ? "text-blue-600" : "text-slate-400"
              }`}
            >
              {currentStep > 1 && <Check className="w-3.5 h-3.5" />}
              <span>{currentStep === 1 ? "1. Prepare" : "Prepare"}</span>
            </div>
            <span className="text-slate-300">&gt;</span>

            {/* Step 2 */}
            <div
              className={`flex items-center gap-1.5 ${
                currentStep >= 2 ? "text-blue-600" : "text-slate-400"
              }`}
            >
              {currentStep > 2 && <Check className="w-3.5 h-3.5" />}
              <span>{currentStep === 2 ? "2. Upload" : "Upload"}</span>
            </div>
            <span className="text-slate-300">&gt;</span>

            {/* Step 3 */}
            <div
              className={`flex items-center gap-1.5 ${
                currentStep >= 3 ? "text-blue-600" : "text-slate-400"
              }`}
            >
              {currentStep > 3 && <Check className="w-3.5 h-3.5" />}
              <span>{currentStep === 3 ? "3. Review & Edit" : "Review & Edit"}</span>
            </div>
            <span className="text-slate-300">&gt;</span>

            {/* Step 4 */}
            <div
              className={`flex items-center gap-1.5 ${
                currentStep === 4 ? "text-blue-600" : "text-slate-400"
              }`}
            >
              {importResult && <Check className="w-3.5 h-3.5" />}
              <span>{importResult ? "Complete" : "4. Import"}</span>
            </div>
          </div>

          {/* Action Button at Top Right of Wizard */}
          <div>
            {currentStep === 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Continue
              </button>
            )}

            {currentStep === 2 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-blue-600 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleProceedToReview}
                  disabled={!selectedFile || isPreviewLoading}
                  className={`flex items-center gap-1 px-5 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-colors ${
                    selectedFile && !isPreviewLoading
                      ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                      : "bg-slate-300 text-white cursor-not-allowed"
                  }`}
                >
                  {isPreviewLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Reading file...</span>
                    </>
                  ) : (
                    <>
                      <span>Review & Edit</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            )}

            {currentStep === 4 && isImporting && (
              <button
                type="button"
                disabled
                className="px-5 py-1.5 bg-slate-400 text-white rounded-full text-xs font-semibold cursor-not-allowed"
              >
                Importing...
              </button>
            )}

            {currentStep === 4 && importResult && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetWizard}
                  className="flex items-center gap-1.5 px-4 py-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50/50 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Import Another File</span>
                </button>
                <Link
                  href="/admin/products"
                  className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  View Products
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-8">
          {/* STEP 1: PREPARE */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-slate-900">
                Prepare CSV file for import
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                The import tool lets you create or update physical products in your store.
                To get started, prepare a CSV or Excel file compatible with our template.
              </p>

              <ul className="space-y-3.5 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>
                    To import new products, download our template:{" "}
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate("csv")}
                      disabled={isDownloadingTemplate}
                      className="text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer inline-flex items-center gap-1"
                    >
                      Download CSV Template
                    </button>
                    <span className="text-slate-400 mx-1">or</span>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate("xlsx")}
                      disabled={isDownloadingTemplate}
                      className="text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer inline-flex items-center gap-1"
                    >
                      Download Excel (.xlsx) Template
                    </button>
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>
                    To update existing products, export your products.{" "}
                    <button
                      type="button"
                      onClick={() => setIsExportModalOpen(true)}
                      className="text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                    >
                      Export Products
                    </button>
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>
                    Fill in the file with your product details. Each file can have up to 10,000 rows
                    and weigh up to 40 MB.
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>Come back here and continue to upload your file.</span>
                </li>
              </ul>

              <div className="pt-8 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Need help creating your file? Use our{" "}
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate("csv")}
                    className="text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    step-by-step guide
                  </button>
                  .
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: UPLOAD */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-slate-900">Upload your CSV file</h2>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-blue-500 bg-blue-50/50"
                      : "border-blue-300 hover:border-blue-500 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-blue-600 mb-1">Upload File</div>
                  <p className="text-xs text-slate-500">
                    Drag & drop Excel (.xlsx) or CSV file here or upload from your computer
                  </p>
                </div>
              ) : (
                <div className="p-4 border border-slate-200 rounded-xl bg-white flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full border border-blue-200 transition-colors cursor-pointer"
                      title="Replace file"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full border border-slate-200 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-8 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Need help creating your file? Use our{" "}
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate("csv")}
                    className="text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    step-by-step guide
                  </button>
                  .
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & EDIT (IN-BROWSER SPREADSHEET GRID) */}
          {currentStep === 3 && previewData && (
            <ImportSpreadsheetGrid
              initialHeaders={previewData.headers}
              initialRows={previewData.rows}
              initialRowStatuses={previewData.rowStatuses}
              initialStats={previewData.stats}
              onBack={() => setCurrentStep(2)}
              onProceedToImport={handleCommitImport}
              onRevalidate={handleRevalidateGrid}
              isValidating={isValidating}
            />
          )}

          {/* STEP 4: IMPORTING / COMPLETE */}
          {currentStep === 4 && (
            <div>
              {isImporting ? (
                <div className="py-16 text-center space-y-4 flex flex-col items-center justify-center animate-in fade-in duration-200">
                  <h2 className="text-base font-bold text-slate-900">
                    Importing your products
                  </h2>
                  <div className="py-4">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Writing changes to database...</p>
                </div>
              ) : (
                importResult && (
                  <div className="py-4 space-y-4 animate-in fade-in duration-200">
                    <h2 className="text-base font-bold text-slate-900">Import complete</h2>

                    <div className="flex items-center gap-2.5 text-xs text-slate-800 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>
                        {importResult.totalProcessed} product
                        {importResult.totalProcessed === 1 ? "" : "s"} were processed (
                        {importResult.createdCount} added, {importResult.updatedCount} updated).
                      </span>
                    </div>

                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                        <div className="font-bold">Warnings:</div>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {importResult.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Export Modal trigger from step 1 */}
      <ExportProductsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        totalProductsCount={0}
        filteredCount={0}
        selectedIds={[]}
      />
    </div>
  );
}
