"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  Upload, 
  FileSpreadsheet, 
  Images, 
  FolderOpen,
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Loader2, 
  ArrowRight,
  Sparkles,
  FileCheck
} from "lucide-react";
import { getCloudinarySignature } from "@/app/actions/cloudinary";
import { bulkCreateProducts, type BulkProductRowInput, type BulkImageInput } from "@/app/actions/bulkProduct";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedProductRow {
  productCode: string;
  name: string;
  description: string;
  imageRule: string;
  originalPrice: number;
  currentPrice: number;
  categoryName: string;
  visibility: boolean;
  matchedFiles: File[];
}

export function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [resultSummary, setResultSummary] = useState<{
    createdCount: number;
    failedCount: number;
    errors: string[];
  } | null>(null);

  const excelInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Download Demo Excel Template
  const handleDownloadDemoTemplate = () => {
    const templateData = [
      {
        "Sr No / Code": "P0001",
        "Product Name": "Siemens S7-1200 CPU 1214C PLC",
        "Description": "Compact high-performance PLC controller with built-in PROFINET ports.",
        "Image Match Rule": "AUTO",
        "Original Price": 35000,
        "Current Price": 29999,
        "Category Name": "PLC & Controllers; Demo category; Sensors & Switches; Motors & Servo Drives",
        "Visibility": "TRUE",
      },
      {
        "Sr No / Code": "P0002",
        "Product Name": "Schneider Electric ATV320 VFD 5.5kW",
        "Description": "Variable speed drive for industrial 3-phase asynchronous motors.",
        "Image Match Rule": "vfd_images/p0002",
        "Original Price": 48000,
        "Current Price": 42500,
        "Category Name": "Drives & VFDs; Motors & Servo Drives",
        "Visibility": "TRUE",
      },
      {
        "Sr No / Code": "P0003",
        "Product Name": "Omron E2E Proximity Sensor M12",
        "Description": "Inductive proximity sensor for heavy industrial position detection.",
        "Image Match Rule": "AUTO",
        "Original Price": 4500,
        "Current Price": 3800,
        "Category Name": "Sensors & Switches; Demo category",
        "Visibility": "TRUE",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 35 },
      { wch: 50 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 22 },
      { wch: 12 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bulk Products");
    XLSX.writeFile(workbook, "Demo_Bulk_Products_Template.xlsx");
  };

  // 2. Parse Excel file & Match Local Images (Supporting custom folder paths in Col D)
  const processFiles = async (file: File, selectedImages: File[]) => {
    setIsParsing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

      const parsed: ParsedProductRow[] = rawRows.map((row) => {
        const code = String(
          row["Sr No / Code"] || row["Code"] || row["Sr No"] || row["productCode"] || ""
        ).trim();

        const name = String(row["Product Name"] || row["Name"] || row["Title"] || "").trim();
        const desc = String(row["Description"] || row["desc"] || "").trim();
        const imgRule = String(row["Image Match Rule"] || row["Images"] || row["Path"] || "AUTO").trim();
        const origPrice = Number(row["Original Price"] || row["Base Price"] || row["Price"] || 0);
        const currPrice = Number(row["Current Price"] || row["Sale Price"] || 0);
        const catName = String(row["Category Name"] || row["Category"] || "General").trim();
        const visStr = String(row["Visibility"] || "TRUE").trim().toUpperCase();
        const visibility = visStr === "TRUE" || visStr === "1" || visStr === "YES";

        // Clean target path from Col D (normalize slashes)
        const targetFolder = imgRule !== "AUTO" ? imgRule.toLowerCase().replace(/\\/g, "/").replace(/\/$/, "") : "";

        // Find matching local images
        let matchedFiles: File[] = [];

        matchedFiles = selectedImages.filter((imgFile) => {
          // webkitRelativePath contains "RootFolder/SubFolder/filename.jpg"
          const relPath = (imgFile.webkitRelativePath || imgFile.name).toLowerCase().replace(/\\/g, "/");
          const fileName = imgFile.name.toLowerCase();

          // 1. If user specified a particular folder/path in Col D
          if (targetFolder && targetFolder !== "auto") {
            const matchesFolder = relPath.includes(`/${targetFolder}/`) || relPath.startsWith(`${targetFolder}/`) || relPath.endsWith(`/${targetFolder}`) || relPath.includes(targetFolder);
            if (!matchesFolder) return false;
          }

          // 2. Match by Product Code prefix (p0001-xxxx, p0001_xxxx, p0001.jpg, or inside a folder named p0001)
          if (code) {
            const lowerCode = code.toLowerCase();
            const matchesCodePrefix = (
              fileName.startsWith(`${lowerCode}-`) ||
              fileName.startsWith(`${lowerCode}_`) ||
              fileName.startsWith(`${lowerCode}.`) ||
              relPath.includes(`/${lowerCode}/`)
            );
            if (!matchesCodePrefix && !targetFolder) return false;
          }

          return true;
        });

        // Sort naturally so p0001-0001 comes before p0001-0002
        matchedFiles.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
        );

        return {
          productCode: code,
          name,
          description: desc,
          imageRule: imgRule,
          originalPrice: origPrice,
          currentPrice: currPrice,
          categoryName: catName,
          visibility,
          matchedFiles,
        };
      });

      setParsedRows(parsed.filter((r) => r.name.length > 0));
    } catch (err) {
      console.error("Failed to parse Excel file:", err);
      alert("Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv document.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setExcelFile(selected);
      processFiles(selected, imageFiles);
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImageFiles(filesArray);
      if (excelFile) {
        processFiles(excelFile, filesArray);
      }
    }
  };

  // 3. Upload Image to Cloudinary
  const uploadImageToCloudinary = async (
    file: File,
    cloudName: string,
    apiKey: string,
    timestamp: number,
    signature: string
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", "propel_products");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Cloudinary upload failed: ${res.statusText}`);
    }

    const data = await res.json();
    return data.secure_url;
  };

  // 4. Start Bulk Import Workflow
  const handleStartImport = async () => {
    if (parsedRows.length === 0) return;

    setIsUploading(true);
    setUploadProgress(5);
    setUploadStatusText("Initializing Cloudinary authorization...");

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "895521971714478";
      
      const { timestamp, signature } = await getCloudinarySignature();

      const bulkItemsToCreate: BulkProductRowInput[] = [];
      const totalImagesToUpload = parsedRows.reduce((acc, row) => acc + row.matchedFiles.length, 0);
      let uploadedImagesCount = 0;

      for (let i = 0; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        setUploadStatusText(`Uploading images for Product ${i + 1}/${parsedRows.length}: "${row.name}"...`);

        const uploadedImages: BulkImageInput[] = [];

        for (let imgIdx = 0; imgIdx < row.matchedFiles.length; imgIdx++) {
          const imgFile = row.matchedFiles[imgIdx];
          try {
            const url = await uploadImageToCloudinary(
              imgFile,
              cloudName || "demo",
              apiKey,
              timestamp,
              signature
            );

            uploadedImages.push({
              url,
              isPrimary: imgIdx === 0,
              order: imgIdx,
              alt: row.name,
            });
          } catch (err) {
            console.warn(`Failed to upload ${imgFile.name}:`, err);
          }

          uploadedImagesCount++;
          const progressPercent = Math.round(10 + (uploadedImagesCount / Math.max(totalImagesToUpload, 1)) * 70);
          setUploadProgress(progressPercent);
        }

        bulkItemsToCreate.push({
          productCode: row.productCode,
          name: row.name,
          description: row.description,
          originalPrice: row.originalPrice,
          currentPrice: row.currentPrice,
          categoryName: row.categoryName,
          visibility: row.visibility,
          images: uploadedImages,
        });
      }

      setUploadProgress(85);
      setUploadStatusText("Saving product catalog records to database...");

      const res = await bulkCreateProducts(bulkItemsToCreate);

      setUploadProgress(100);
      setResultSummary({
        createdCount: res.createdCount,
        failedCount: res.failedCount,
        errors: res.errors,
      });

      if (res.success && onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      console.error("Bulk upload process error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Bulk upload failed: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Bulk Excel Product Import
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                  Cloudinary Auto-Sync
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Upload products via Excel spreadsheet & local image folders</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Result Summary Notification */}
          {resultSummary && (
            <div className={`p-4 rounded-xl border ${resultSummary.failedCount === 0 ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300" : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300"}`}>
              <div className="flex items-center gap-3 font-semibold text-sm">
                {resultSummary.failedCount === 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                Import Completed: {resultSummary.createdCount} products created successfully!
                {resultSummary.failedCount > 0 && ` (${resultSummary.failedCount} failed)`}
              </div>
              {resultSummary.errors.length > 0 && (
                <ul className="mt-2 text-xs space-y-1 pl-8 list-disc text-amber-900/80 dark:text-amber-300/80 max-h-32 overflow-y-auto">
                  {resultSummary.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Action Step 1: Demo Download */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">1. Download Sample Excel Sheet</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Specify <code className="text-blue-600 dark:text-blue-400 font-mono">AUTO</code> or subfolder paths (e.g. <code className="text-blue-600 dark:text-blue-400 font-mono">folder_a/p0001</code>) in Col D.</p>
              </div>
            </div>
            <button
              onClick={handleDownloadDemoTemplate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Demo Template (.xlsx)
            </button>
          </div>

          {/* Action Step 2: Upload Excel & Local Images / Folder */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Excel Picker */}
            <div
              onClick={() => excelInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all ${
                excelFile ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/60 dark:bg-slate-950/60"
              }`}
            >
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelChange}
                className="hidden"
              />
              <FileSpreadsheet className={`w-7 h-7 mb-2 ${excelFile ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
              <span className="text-xs font-semibold text-slate-900 dark:text-white text-center">
                {excelFile ? excelFile.name : "Select Excel File"}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">.xlsx or .csv sheet</span>
            </div>

            {/* Select Folder Picker (webkitdirectory) */}
            <div
              onClick={() => folderInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all ${
                imageFiles.length > 0 ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/60 dark:bg-slate-950/60"
              }`}
            >
              <input
                ref={folderInputRef}
                type="file"
                // @ts-expect-error webkitdirectory is a non-standard attribute supported by modern browsers
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleImagesChange}
                className="hidden"
              />
              <FolderOpen className={`w-7 h-7 mb-2 ${imageFiles.length > 0 ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
              <span className="text-xs font-semibold text-slate-900 dark:text-white text-center">
                Select Local Folder
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Scans folder & all subfolders</span>
            </div>

            {/* Select Individual Files */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all ${
                imageFiles.length > 0 ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/60 dark:bg-slate-950/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImagesChange}
                className="hidden"
              />
              <Images className={`w-7 h-7 mb-2 ${imageFiles.length > 0 ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
              <span className="text-xs font-semibold text-slate-900 dark:text-white text-center">
                {imageFiles.length > 0 ? `${imageFiles.length} Images Loaded` : "Select Files Directly"}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Multi-select image files</span>
            </div>
          </div>

          {/* Step 3: Parsed Product Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Parsed Catalog Preview ({parsedRows.length} Products Found)
                </h4>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Total Images Matched:{" "}
                  <strong className="text-blue-600 dark:text-blue-400">
                    {parsedRows.reduce((a, b) => a + b.matchedFiles.length, 0)}
                  </strong>
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Folder Rule (Col D)</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price</th>
                      <th className="p-3 text-right">Matched Images</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-mono font-medium text-blue-600 dark:text-blue-400">{row.productCode || `-`}</td>
                        <td className="p-3 font-medium text-slate-900 dark:text-white max-w-[180px] truncate">{row.name}</td>
                        <td className="p-3 font-mono text-[11px] text-amber-700 dark:text-amber-400">{row.imageRule}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{row.categoryName}</td>
                        <td className="p-3 font-mono text-emerald-700 dark:text-emerald-400">₹{(row.currentPrice || row.originalPrice).toLocaleString()}</td>
                        <td className="p-3 text-right">
                          {row.matchedFiles.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-500/30">
                              <Images className="w-3 h-3" />
                              {row.matchedFiles.length} files
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-[11px]">No images matched</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  {uploadStatusText}
                </span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleStartImport}
            disabled={parsedRows.length === 0 || isUploading || isParsing}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Upload...
              </>
            ) : (
              <>
                Start Bulk Upload
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
