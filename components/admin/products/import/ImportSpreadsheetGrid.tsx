"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Search,
  ArrowLeft,
  ArrowRight,
  Info,
  Check,
  Building2,
  FolderTree,
  Columns,
  X,
  ArrowDown,
  Copy,
  Clipboard,
  Scissors,
} from "lucide-react";
import type { RowStatusInfo } from "@/app/actions/productImport";
import { cleanVal } from "@/lib/importHelpers";

interface ImportSpreadsheetGridProps {
  initialHeaders: string[];
  initialRows: string[][];
  initialRowStatuses: RowStatusInfo[];
  initialStats: {
    totalRows: number;
    totalProducts: number;
    newCount: number;
    updateCount: number;
    newCategories: string[];
    newBrands: string[];
    errorCount: number;
  };
  onBack: () => void;
  onProceedToImport: (headers: string[], rows: string[][]) => void;
  onRevalidate: (headers: string[], rows: string[][]) => Promise<void>;
  isValidating?: boolean;
}

export function ImportSpreadsheetGrid({
  initialHeaders,
  initialRows,
  initialRowStatuses,
  initialStats,
  onBack,
  onProceedToImport,
  onRevalidate,
  isValidating = false,
}: ImportSpreadsheetGridProps) {
  const [headers, setHeaders] = useState<string[]>(initialHeaders);
  const [rows, setRows] = useState<string[][]>(initialRows);
  const [rowStatuses, setRowStatuses] = useState<RowStatusInfo[]>(initialRowStatuses);
  const [stats, setStats] = useState(initialStats);

  // Active cursor/selected cell: { rowIdx, colIdx }
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  // Multi-cell selection range: { start: { r, c }, end: { r, c } }
  const [selectionRange, setSelectionRange] = useState<{
    start: { r: number; c: number };
    end: { r: number; c: number };
  } | null>(null);
  const [isMouseDownSelecting, setIsMouseDownSelecting] = useState(false);
  const [copiedBounds, setCopiedBounds] = useState<{
    minR: number;
    maxR: number;
    minC: number;
    maxC: number;
  } | null>(null);

  // Scroll container ref for auto-scrolling during drag
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const autoScrollAnimationRef = useRef<number | null>(null);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);

  // Active editing cell: { rowIdx, colIdx }
  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null);
  const [cellDraftValue, setCellDraftValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Add Column modal state
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "NEW" | "UPDATE" | "ERROR">("ALL");

  // Keep internal state updated if props refresh from revalidate
  useEffect(() => {
    setHeaders(initialHeaders);
    setRows(initialRows);
    setRowStatuses(initialRowStatuses);
    setStats(initialStats);
  }, [initialHeaders, initialRows, initialRowStatuses, initialStats]);

  // Auto-scroll loop while dragging selection near container edges
  useEffect(() => {
    if (!isMouseDownSelecting) {
      if (autoScrollAnimationRef.current) {
        cancelAnimationFrame(autoScrollAnimationRef.current);
        autoScrollAnimationRef.current = null;
      }
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove);

    const EDGE_THRESHOLD = 70; // px distance from container edge to trigger scrolling
    const MAX_SPEED = 28;

    const autoScrollLoop = () => {
      if (!isMouseDownSelecting) return;

      const container = gridScrollRef.current;
      const mouse = mousePosRef.current;

      if (container && mouse) {
        const rect = container.getBoundingClientRect();
        let vx = 0;
        let vy = 0;

        // Right edge
        if (mouse.x > rect.right - EDGE_THRESHOLD) {
          const dist = mouse.x - (rect.right - EDGE_THRESHOLD);
          vx = Math.min(MAX_SPEED, Math.max(5, (dist / EDGE_THRESHOLD) * MAX_SPEED));
        }
        // Left edge
        else if (mouse.x < rect.left + EDGE_THRESHOLD) {
          const dist = (rect.left + EDGE_THRESHOLD) - mouse.x;
          vx = -Math.min(MAX_SPEED, Math.max(5, (dist / EDGE_THRESHOLD) * MAX_SPEED));
        }

        // Bottom edge
        if (mouse.y > rect.bottom - EDGE_THRESHOLD) {
          const dist = mouse.y - (rect.bottom - EDGE_THRESHOLD);
          vy = Math.min(MAX_SPEED, Math.max(5, (dist / EDGE_THRESHOLD) * MAX_SPEED));
        }
        // Top edge
        else if (mouse.y < rect.top + EDGE_THRESHOLD) {
          const dist = (rect.top + EDGE_THRESHOLD) - mouse.y;
          vy = -Math.min(MAX_SPEED, Math.max(5, (dist / EDGE_THRESHOLD) * MAX_SPEED));
        }

        if (vx !== 0 || vy !== 0) {
          container.scrollLeft += vx;
          container.scrollTop += vy;

          // Probe for cell element at current edge position
          const probeX = Math.min(Math.max(mouse.x, rect.left + 15), rect.right - 15);
          const probeY = Math.min(Math.max(mouse.y, rect.top + 15), rect.bottom - 15);
          const targetEl = document.elementFromPoint(probeX, probeY);
          const cellEl = targetEl?.closest("[data-row-idx][data-col-idx]") as HTMLElement | null;

          if (cellEl) {
            const r = parseInt(cellEl.getAttribute("data-row-idx") || "-1", 10);
            const c = parseInt(cellEl.getAttribute("data-col-idx") || "-1", 10);
            if (r >= 0 && c >= 0) {
              setSelectionRange((prev) => (prev ? { start: prev.start, end: { r, c } } : null));
            }
          }
        }
      }

      autoScrollAnimationRef.current = requestAnimationFrame(autoScrollLoop);
    };

    autoScrollAnimationRef.current = requestAnimationFrame(autoScrollLoop);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (autoScrollAnimationRef.current) {
        cancelAnimationFrame(autoScrollAnimationRef.current);
        autoScrollAnimationRef.current = null;
      }
    };
  }, [isMouseDownSelecting]);

  // Focus input on edit
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Selected bounding box
  const selectedBounds = useMemo(() => {
    if (selectionRange) {
      return {
        minR: Math.min(selectionRange.start.r, selectionRange.end.r),
        maxR: Math.max(selectionRange.start.r, selectionRange.end.r),
        minC: Math.min(selectionRange.start.c, selectionRange.end.c),
        maxC: Math.max(selectionRange.start.c, selectionRange.end.c),
      };
    }
    if (selectedCell !== null && selectedCell.r >= 0 && selectedCell.c >= 0) {
      return {
        minR: selectedCell.r,
        maxR: selectedCell.r,
        minC: selectedCell.c,
        maxC: selectedCell.c,
      };
    }
    return null;
  }, [selectionRange, selectedCell]);

  const selectedCellCount = useMemo(() => {
    if (!selectedBounds) return 0;
    return (
      (selectedBounds.maxR - selectedBounds.minR + 1) *
      (selectedBounds.maxC - selectedBounds.minC + 1)
    );
  }, [selectedBounds]);

  // Start editing a cell
  const handleStartEdit = (r: number, c: number) => {
    setSelectedCell({ r, c });
    setSelectionRange({ start: { r, c }, end: { r, c } });
    setEditingCell({ r, c });
    setCellDraftValue(rows[r]?.[c] ?? "");
  };

  // Commit cell edit
  const handleCommitEdit = async () => {
    if (!editingCell) return;
    const { r, c } = editingCell;
    const updatedRows = rows.map((row, rIdx) => {
      if (rIdx === r) {
        const newRow = [...row];
        newRow[c] = cellDraftValue;
        return newRow;
      }
      return row;
    });

    setRows(updatedRows);
    setEditingCell(null);

    // Trigger fast revalidation
    await onRevalidate(headers, updatedRows);
  };

  const handleCommitDirectValue = async (r: number, c: number, newVal: string) => {
    const updatedRows = rows.map((row, rIdx) => {
      if (rIdx === r) {
        const newRow = [...row];
        newRow[c] = newVal;
        return newRow;
      }
      return row;
    });

    setRows(updatedRows);
    setEditingCell(null);
    await onRevalidate(headers, updatedRows);
  };

  // Copy selection to clipboard (TSV format compatible with Excel & Google Sheets)
  const handleCopy = async () => {
    if (!selectedBounds) return;
    const { minR, maxR, minC, maxC } = selectedBounds;
    const lines: string[] = [];

    for (let r = minR; r <= maxR; r++) {
      const rowVals: string[] = [];
      for (let c = minC; c <= maxC; c++) {
        rowVals.push(rows[r]?.[c] ?? "");
      }
      lines.push(rowVals.join("\t"));
    }

    const text = lines.join("\r\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBounds(selectedBounds);
      showToast(`Copied ${selectedCellCount} cell${selectedCellCount > 1 ? "s" : ""} to clipboard`);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  // Paste into grid starting from top-left of selection
  const handlePaste = async (pastedText?: string) => {
    try {
      let text = pastedText;
      if (text === undefined) {
        text = await navigator.clipboard.readText();
      }
      if (!text) return;

      const targetR = selectedBounds ? selectedBounds.minR : selectedCell?.r ?? 0;
      const targetC = selectedBounds ? selectedBounds.minC : selectedCell?.c ?? 0;

      // Parse TSV/CSV rows
      const rawLines = text.split(/\r\n|\r|\n/);
      if (rawLines.length > 1 && rawLines[rawLines.length - 1].trim() === "") {
        rawLines.pop();
      }
      if (rawLines.length === 0) return;

      const matrix = rawLines.map((line) => {
        if (line.includes("\t")) {
          return line.split("\t");
        }
        return [line];
      });

      const pasteRowsCount = matrix.length;
      const pasteColsCount = Math.max(...matrix.map((m) => m.length));

      let updatedRows = rows.map((r) => [...r]);

      // Expand rows if paste extends beyond existing table rows
      const neededRows = targetR + pasteRowsCount;
      while (updatedRows.length < neededRows) {
        updatedRows.push(headers.map(() => ""));
      }

      for (let rIdx = 0; rIdx < pasteRowsCount; rIdx++) {
        const destR = targetR + rIdx;
        if (destR >= updatedRows.length) break;

        for (let cIdx = 0; cIdx < matrix[rIdx].length; cIdx++) {
          const destC = targetC + cIdx;
          if (destC < headers.length) {
            updatedRows[destR][destC] = cleanVal(matrix[rIdx][cIdx]);
          }
        }
      }

      setRows(updatedRows);
      const endR = Math.min(targetR + pasteRowsCount - 1, updatedRows.length - 1);
      const endC = Math.min(targetC + pasteColsCount - 1, headers.length - 1);
      setSelectionRange({
        start: { r: targetR, c: targetC },
        end: { r: endR, c: endC },
      });
      setSelectedCell({ r: targetR, c: targetC });
      showToast(
        `Pasted ${pasteRowsCount * pasteColsCount} cell${
          pasteRowsCount * pasteColsCount > 1 ? "s" : ""
        }`
      );
      await onRevalidate(headers, updatedRows);
    } catch (err) {
      console.error("Paste failed:", err);
    }
  };

  // Cut selection
  const handleCut = async () => {
    if (!selectedBounds) return;
    await handleCopy();
    handleClearSelection();
  };

  // Clear selection
  const handleClearSelection = async () => {
    if (!selectedBounds) return;
    const { minR, maxR, minC, maxC } = selectedBounds;
    const updatedRows = rows.map((row, rIdx) => {
      if (rIdx >= minR && rIdx <= maxR) {
        const newRow = [...row];
        for (let c = minC; c <= maxC; c++) {
          newRow[c] = "";
        }
        return newRow;
      }
      return row;
    });

    setRows(updatedRows);
    showToast(`Cleared ${selectedCellCount} cell${selectedCellCount > 1 ? "s" : ""}`);
    await onRevalidate(headers, updatedRows);
  };

  // Global Keyboard & Paste Shortcuts
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsMouseDownSelecting(false);
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        handlePaste();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
        e.preventDefault();
        handleCut();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (!editingCell && selectedBounds) {
          e.preventDefault();
          handleClearSelection();
        }
      } else if (e.key === "Enter" && selectedCell && !editingCell) {
        e.preventDefault();
        handleStartEdit(selectedCell.r, selectedCell.c);
      } else if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key) &&
        !editingCell
      ) {
        e.preventDefault();

        const curR = selectedCell?.r ?? 0;
        const curC = selectedCell?.c ?? 0;
        const maxR = Math.max(0, rows.length - 1);
        const maxC = Math.max(0, headers.length - 1);

        if (e.shiftKey && e.key !== "Tab") {
          // Shift + Arrow: Expand selection
          const startR = selectionRange?.start.r ?? curR;
          const startC = selectionRange?.start.c ?? curC;
          let endR = selectionRange?.end.r ?? curR;
          let endC = selectionRange?.end.c ?? curC;

          if (e.key === "ArrowUp") endR = Math.max(0, endR - 1);
          if (e.key === "ArrowDown") endR = Math.min(maxR, endR + 1);
          if (e.key === "ArrowLeft") endC = Math.max(0, endC - 1);
          if (e.key === "ArrowRight") endC = Math.min(maxC, endC + 1);

          setSelectionRange({ start: { r: startR, c: startC }, end: { r: endR, c: endC } });

          // Scroll active target into view
          const targetEl = gridScrollRef.current?.querySelector(
            `[data-row-idx="${endR}"][data-col-idx="${endC}"]`
          ) as HTMLElement | null;
          targetEl?.scrollIntoView({ block: "nearest", inline: "nearest" });
        } else {
          // Normal Arrow key / Tab: Move cell
          let nextR = curR;
          let nextC = curC;

          if (e.key === "ArrowUp") nextR = Math.max(0, curR - 1);
          if (e.key === "ArrowDown") nextR = Math.min(maxR, curR + 1);
          if (e.key === "ArrowLeft") nextC = Math.max(0, curC - 1);
          if (e.key === "ArrowRight") nextC = Math.min(maxC, curC + 1);
          if (e.key === "Tab") {
            if (e.shiftKey) {
              if (nextC > 0) nextC--;
              else if (nextR > 0) {
                nextR--;
                nextC = maxC;
              }
            } else {
              if (nextC < maxC) nextC++;
              else if (nextR < maxR) {
                nextR++;
                nextC = 0;
              }
            }
          }

          setSelectedCell({ r: nextR, c: nextC });
          setSelectionRange({ start: { r: nextR, c: nextC }, end: { r: nextR, c: nextC } });

          // Scroll target cell into view
          const targetEl = gridScrollRef.current?.querySelector(
            `[data-row-idx="${nextR}"][data-col-idx="${nextC}"]`
          ) as HTMLElement | null;
          targetEl?.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      }
    };

    const handleWindowPaste = (e: ClipboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") {
        return;
      }
      const text = e.clipboardData?.getData("text");
      if (text) {
        e.preventDefault();
        handlePaste(text);
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener("paste", handleWindowPaste);

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("paste", handleWindowPaste);
    };
  }, [selectedBounds, selectedCell, selectionRange, editingCell, rows, headers, selectedCellCount]);

  // Cancel edit on Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCommitEdit();
      if (selectedCell && selectedCell.r < rows.length - 1) {
        setSelectedCell({ r: selectedCell.r + 1, c: selectedCell.c });
        setSelectionRange({
          start: { r: selectedCell.r + 1, c: selectedCell.c },
          end: { r: selectedCell.r + 1, c: selectedCell.c },
        });
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      handleCommitEdit();
      if (selectedCell && selectedCell.c < headers.length - 1) {
        setSelectedCell({ r: selectedCell.r, c: selectedCell.c + 1 });
        setSelectionRange({
          start: { r: selectedCell.r, c: selectedCell.c + 1 },
          end: { r: selectedCell.r, c: selectedCell.c + 1 },
        });
      }
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  // Add Row down to current cursor/selected cell
  const handleAddRow = () => {
    const insertIdx = selectedCell !== null && selectedCell.r >= 0 ? selectedCell.r + 1 : rows.length;
    const newEmptyRow = headers.map(() => "");
    const updated = [
      ...rows.slice(0, insertIdx),
      newEmptyRow,
      ...rows.slice(insertIdx),
    ];
    setRows(updated);
    setStatusFilter("ALL");
    setSelectedCell({ r: insertIdx, c: selectedCell?.c ?? 0 });
    onRevalidate(headers, updated);
  };

  // Delete Row
  const handleDeleteRow = (rIdx: number) => {
    const updated = rows.filter((_, idx) => idx !== rIdx);
    setRows(updated);
    if (selectedCell?.r === rIdx) setSelectedCell(null);
    onRevalidate(headers, updated);
  };

  // Add Column to the right of current cursor/selected cell
  const handleOpenAddColumn = (targetColIdx?: number) => {
    if (targetColIdx !== undefined) {
      setSelectedCell((prev) => ({ r: prev?.r ?? 0, c: targetColIdx }));
    }
    setNewColumnName("");
    setIsAddColumnModalOpen(true);
  };

  const handleConfirmAddColumn = (colName?: string) => {
    const finalName = (colName || newColumnName).trim() || `Column ${headers.length + 1}`;
    const insertIdx = selectedCell !== null && selectedCell.c >= 0 ? selectedCell.c + 1 : headers.length;

    const newHeaders = [
      ...headers.slice(0, insertIdx),
      finalName,
      ...headers.slice(insertIdx),
    ];

    const newRows = rows.map((r) => [
      ...r.slice(0, insertIdx),
      "",
      ...r.slice(insertIdx),
    ]);

    setHeaders(newHeaders);
    setRows(newRows);
    setSelectedCell({ r: selectedCell?.r ?? 0, c: insertIdx });
    setIsAddColumnModalOpen(false);
    setNewColumnName("");
    onRevalidate(newHeaders, newRows);
  };

  // Delete Column
  const handleDeleteColumn = (cIdx: number) => {
    if (headers.length <= 1) return;
    const newHeaders = headers.filter((_, idx) => idx !== cIdx);
    const newRows = rows.map((r) => r.filter((_, idx) => idx !== cIdx));
    setHeaders(newHeaders);
    setRows(newRows);
    if (selectedCell?.c === cIdx) setSelectedCell(null);
    onRevalidate(newHeaders, newRows);
  };

  // Filtered rows for table view
  const visibleRowIndices = useMemo(() => {
    const indices: number[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const status = rowStatuses[i]?.status || "NEW";

      if (statusFilter === "NEW" && status !== "NEW") continue;
      if (statusFilter === "UPDATE" && status !== "UPDATE") continue;
      if (statusFilter === "ERROR" && status !== "ERROR") continue;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hasMatch = row.some((cell) => String(cell).toLowerCase().includes(q));
        if (!hasMatch) continue;
      }

      indices.push(i);
    }
    return indices;
  }, [rows, rowStatuses, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. TOP METRICS & STATS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* New Products */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-900">{stats.newCount}</div>
            <div className="text-xs text-emerald-700 font-medium">New Products to Add</div>
          </div>
        </div>

        {/* Existing Updates */}
        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">{stats.updateCount}</div>
            <div className="text-xs text-blue-700 font-medium">Existing Products to Update</div>
          </div>
        </div>

        {/* New Categories & Brands */}
        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
            <FolderTree className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-purple-900 truncate">
              {stats.newCategories.length} Categories, {stats.newBrands.length} Brands
            </div>
            <div className="text-[11px] text-purple-700 font-medium truncate">
              Will be auto-created in database
            </div>
          </div>
        </div>

        {/* Errors & Validation */}
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 ${
            stats.errorCount > 0
              ? "bg-rose-50/80 border-rose-200"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <div
            className={`p-2 rounded-lg ${
              stats.errorCount > 0
                ? "bg-rose-100 text-rose-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {stats.errorCount > 0 ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div
              className={`text-lg font-bold ${
                stats.errorCount > 0 ? "text-rose-900" : "text-slate-800"
              }`}
            >
              {stats.errorCount > 0 ? stats.errorCount : "0 Errors"}
            </div>
            <div
              className={`text-xs font-medium ${
                stats.errorCount > 0 ? "text-rose-700" : "text-emerald-700"
              }`}
            >
              {stats.errorCount > 0
                ? "Fix cells before importing"
                : "All product rows valid"}
            </div>
          </div>
        </div>
      </div>

      {/* Discovered New Categories & Brands Pill summary (if any) */}
      {(stats.newCategories.length > 0 || stats.newBrands.length > 0) && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center gap-4 flex-wrap text-slate-700">
          {stats.newCategories.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-purple-700">New Categories:</span>
              <span className="text-slate-600">{stats.newCategories.join(", ")}</span>
            </div>
          )}
          {stats.newBrands.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-purple-700">New Brands:</span>
              <span className="text-slate-600">{stats.newBrands.join(", ")}</span>
            </div>
          )}
        </div>
      )}

      {/* 2. TABLE TOOLBAR & CONTROLS */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "hover:text-slate-900"
            }`}
          >
            All ({rows.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("NEW")}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              statusFilter === "NEW"
                ? "bg-white text-emerald-700 shadow-2xs font-bold"
                : "hover:text-slate-900"
            }`}
          >
            New ({stats.newCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("UPDATE")}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              statusFilter === "UPDATE"
                ? "bg-white text-blue-700 shadow-2xs font-bold"
                : "hover:text-slate-900"
            }`}
          >
            Updates ({stats.updateCount})
          </button>
          {stats.errorCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter("ERROR")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === "ERROR"
                  ? "bg-white text-rose-700 shadow-2xs font-bold"
                  : "text-rose-600 hover:text-rose-800"
              }`}
            >
              Errors ({stats.errorCount})
            </button>
          )}
        </div>

        {/* Search & Action Buttons */}
        {/* Search & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search in table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-44"
            />
          </div>

          {/* Copy / Cut / Paste Actions */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!selectedBounds}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="Copy selection (Ctrl+C)"
            >
              <Copy className="w-3.5 h-3.5 text-slate-600" />
              <span>Copy</span>
            </button>

            <button
              type="button"
              onClick={handleCut}
              disabled={!selectedBounds}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="Cut selection (Ctrl+X)"
            >
              <Scissors className="w-3.5 h-3.5 text-slate-600" />
              <span>Cut</span>
            </button>

            <button
              type="button"
              onClick={() => handlePaste()}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Paste from clipboard (Ctrl+V)"
            >
              <Clipboard className="w-3.5 h-3.5 text-slate-600" />
              <span>Paste</span>
            </button>
          </div>

          {/* Selection indicator pill */}
          {selectedBounds && selectedCellCount > 1 && (
            <div className="px-2 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-[11px] font-bold">
              {selectedBounds.maxR - selectedBounds.minR + 1} × {selectedBounds.maxC - selectedBounds.minC + 1} ({selectedCellCount} cells)
            </div>
          )}

          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title={selectedCell ? `Insert new row directly below Row #${selectedCell.r + 1}` : "Add new row at bottom"}
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Add Row</span>
            {selectedCell !== null && selectedCell.r >= 0 && (
              <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-mono font-bold">
                ↓ #{selectedCell.r + 1}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddColumn()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title={selectedCell ? `Insert new column directly to the right of ${headers[selectedCell.c] || "Col"}` : "Add new column at far right"}
          >
            <Columns className="w-3.5 h-3.5 text-indigo-600" />
            <span>Add Column</span>
            {selectedCell !== null && selectedCell.c >= 0 && headers[selectedCell.c] && (
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-mono font-bold truncate max-w-[90px]">
                → {headers[selectedCell.c]}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={async () => {
              const { autoAlignSpreadsheetOptions } = await import("@/lib/importHelpers");
              const result = autoAlignSpreadsheetOptions(headers, rows);
              setRows(result.rows);
              await onRevalidate(headers, result.rows);
            }}
            disabled={isValidating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Automatically detect choices, fill missing option names, and align option slots"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Auto-Align</span>
          </button>

          <button
            type="button"
            onClick={() => onRevalidate(headers, rows)}
            disabled={isValidating}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Re-run validation"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isValidating ? "animate-spin" : ""}`} />
            <span>Validate</span>
          </button>
        </div>
      </div>

      {/* 3. SPREADSHEET DATA GRID */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden">
        <div ref={gridScrollRef} className="max-h-[500px] overflow-auto relative select-none">
          <table className="w-full text-left text-xs border-collapse font-sans">
            {/* Table Header */}
            <thead className="bg-slate-100/90 sticky top-0 z-10 border-b border-slate-200 backdrop-blur-xs">
              <tr>
                {/* Row Indicator Header */}
                <th className="p-2.5 px-3 font-bold text-slate-500 text-[11px] uppercase tracking-wider w-24 border-r border-slate-200 bg-slate-100">
                  # Status
                </th>

                {/* Column Headers */}
                {headers.map((h, colIdx) => {
                  const isColSelected =
                    selectedBounds &&
                    colIdx >= selectedBounds.minC &&
                    colIdx <= selectedBounds.maxC &&
                    selectedBounds.minR === 0 &&
                    selectedBounds.maxR === rows.length - 1;

                  return (
                    <th
                      key={colIdx}
                      onMouseDown={(e) => {
                        setIsMouseDownSelecting(true);
                        setSelectedCell({ r: 0, c: colIdx });
                        setSelectionRange({
                          start: { r: 0, c: colIdx },
                          end: { r: Math.max(0, rows.length - 1), c: colIdx },
                        });
                      }}
                      onMouseEnter={() => {
                        if (isMouseDownSelecting && selectionRange) {
                          setSelectionRange((prev) =>
                            prev
                              ? {
                                  start: { r: 0, c: prev.start.c },
                                  end: { r: Math.max(0, rows.length - 1), c: colIdx },
                                }
                              : null
                          );
                        }
                      }}
                      className={`p-2 px-2.5 font-bold border-r border-slate-200 min-w-[140px] whitespace-nowrap transition-colors cursor-pointer select-none group/th ${
                        isColSelected
                          ? "bg-blue-200/90 text-blue-950 ring-2 ring-blue-500 ring-inset"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate max-w-[150px]" title={h}>{h}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] text-slate-400 font-mono font-normal">
                            {String.fromCharCode(65 + (colIdx % 26))}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAddColumn(colIdx);
                            }}
                            className="opacity-0 group-hover/th:opacity-100 p-0.5 hover:bg-blue-200 text-blue-700 rounded transition-opacity cursor-pointer"
                            title={`Insert column to the right of "${h}"`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          {headers.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteColumn(colIdx);
                              }}
                              className="opacity-0 group-hover/th:opacity-100 p-0.5 hover:bg-rose-200 text-rose-600 rounded transition-opacity cursor-pointer"
                              title={`Delete column "${h}"`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100">
              {visibleRowIndices.map((rIdx) => {
                const row = rows[rIdx] || [];
                const rowInfo = rowStatuses[rIdx];
                const isVariant = rowInfo?.itemType === "Variant";
                const isError = rowInfo?.status === "ERROR";
                const isNew = rowInfo?.status === "NEW";
                const isUpdate = rowInfo?.status === "UPDATE";

                const isRowSelected =
                  selectedBounds &&
                  rIdx >= selectedBounds.minR &&
                  rIdx <= selectedBounds.maxR &&
                  selectedBounds.minC === 0 &&
                  selectedBounds.maxC === headers.length - 1;

                return (
                  <tr
                    key={rIdx}
                    className={`transition-colors hover:bg-blue-50/40 group ${
                      isError
                        ? "bg-rose-50/40"
                        : isVariant
                        ? "bg-slate-50/50"
                        : "bg-white"
                    }`}
                  >
                    {/* Row Status Badge & Controls (Click & Drag Row Selector) */}
                    <td
                      onMouseDown={(e) => {
                        setIsMouseDownSelecting(true);
                        setSelectedCell({ r: rIdx, c: 0 });
                        setSelectionRange({
                          start: { r: rIdx, c: 0 },
                          end: { r: rIdx, c: Math.max(0, headers.length - 1) },
                        });
                      }}
                      onMouseEnter={() => {
                        if (isMouseDownSelecting && selectionRange) {
                          setSelectionRange((prev) =>
                            prev
                              ? {
                                  start: { r: prev.start.r, c: 0 },
                                  end: { r: rIdx, c: Math.max(0, headers.length - 1) },
                                }
                              : null
                          );
                        }
                      }}
                      className={`p-2 border-r border-slate-200 sticky left-0 z-5 bg-inherit whitespace-nowrap cursor-pointer transition-colors ${
                        isRowSelected ? "bg-blue-100 font-bold" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {rIdx + 1}
                          </span>
                          {isError && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 flex items-center gap-0.5">
                              <AlertCircle className="w-2.5 h-2.5" /> ERR
                            </span>
                          )}
                          {!isError && isNew && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                              + NEW
                            </span>
                          )}
                          {!isError && isUpdate && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                              ↻ UPDATE
                            </span>
                          )}
                          {isVariant && (
                            <span className="text-[9px] text-slate-400 font-medium ml-0.5">
                              ↳ VAR
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRow(rIdx);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity cursor-pointer"
                          title="Delete row"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Data Cells */}
                    {headers.map((_, cIdx) => {
                      const cellVal = row[cIdx] ?? "";
                      const isEditing = editingCell?.r === rIdx && editingCell?.c === cIdx;
                      const cellError = rowInfo?.errors?.[`col_${cIdx}`];

                      const inSelection = Boolean(
                        selectedBounds &&
                          rIdx >= selectedBounds.minR &&
                          rIdx <= selectedBounds.maxR &&
                          cIdx >= selectedBounds.minC &&
                          cIdx <= selectedBounds.maxC
                      );

                      const isTopEdge = inSelection && selectedBounds && rIdx === selectedBounds.minR;
                      const isBottomEdge = inSelection && selectedBounds && rIdx === selectedBounds.maxR;
                      const isLeftEdge = inSelection && selectedBounds && cIdx === selectedBounds.minC;
                      const isRightEdge = inSelection && selectedBounds && cIdx === selectedBounds.maxC;

                      const isCopied = Boolean(
                        copiedBounds &&
                          rIdx >= copiedBounds.minR &&
                          rIdx <= copiedBounds.maxR &&
                          cIdx >= copiedBounds.minC &&
                          cIdx <= copiedBounds.maxC
                      );

                      return (
                        <td
                          key={cIdx}
                          data-row-idx={rIdx}
                          data-col-idx={cIdx}
                          onMouseDown={(e) => {
                            if (isEditing) return;
                            if (e.shiftKey && selectedCell) {
                              setSelectionRange({ start: selectedCell, end: { r: rIdx, c: cIdx } });
                            } else {
                              setIsMouseDownSelecting(true);
                              setSelectedCell({ r: rIdx, c: cIdx });
                              setSelectionRange({ start: { r: rIdx, c: cIdx }, end: { r: rIdx, c: cIdx } });
                            }
                          }}
                          onMouseEnter={() => {
                            if (isMouseDownSelecting && selectionRange) {
                              setSelectionRange((prev) => (prev ? { start: prev.start, end: { r: rIdx, c: cIdx } } : null));
                            }
                          }}
                          onDoubleClick={() => handleStartEdit(rIdx, cIdx)}
                          className={`p-1 px-2 min-w-[140px] max-w-[240px] truncate cursor-pointer transition-all select-none relative ${
                            isEditing
                              ? "p-0 ring-2 ring-blue-500 bg-white z-10"
                              : cellError
                              ? "bg-rose-50/80 border-rose-300 ring-1 ring-rose-400"
                              : inSelection
                              ? "bg-blue-100/60"
                              : "hover:bg-blue-50/40"
                          } ${
                            isTopEdge ? "border-t-2 border-t-blue-600" : "border-t border-slate-100"
                          } ${
                            isBottomEdge ? "border-b-2 border-b-blue-600" : "border-b border-slate-100"
                          } ${
                            isLeftEdge ? "border-l-2 border-l-blue-600" : "border-l border-slate-100"
                          } ${
                            isRightEdge ? "border-r-2 border-r-blue-600" : "border-r border-slate-100"
                          } ${
                            isCopied ? "outline-2 outline-dashed outline-blue-500 -outline-offset-2" : ""
                          }`}
                          title={cellError ? `⚠️ Error: ${cellError}` : String(cellVal)}
                        >
                          {isEditing ? (
                            (() => {
                              const headerName = (headers[cIdx] || "").toLowerCase().trim();
                              const isUnitCol = headerName.includes("unit unit") || headerName === "price per unit unit";
                              const isBoolCol = headerName.includes("visible") || headerName.includes("visibility");
                              const isItemTypeCol = headerName === "item type" || headerName === "type";

                              if (isUnitCol) {
                                return (
                                  <select
                                    autoFocus
                                    value={cellDraftValue}
                                    onChange={(e) => {
                                      setCellDraftValue(e.target.value);
                                      handleCommitDirectValue(rIdx, cIdx, e.target.value);
                                    }}
                                    onBlur={handleCommitEdit}
                                    className="w-full h-8 px-2 py-1 text-xs text-slate-900 bg-white border-0 focus:outline-hidden font-medium cursor-pointer"
                                  >
                                    <option value="">— Select Unit —</option>
                                    <option value="piece">piece</option>
                                    <option value="unit">unit</option>
                                    <option value="item">item</option>
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                    <option value="l">l</option>
                                    <option value="ml">ml</option>
                                    <option value="m">m</option>
                                    <option value="cm">cm</option>
                                    <option value="pack">pack</option>
                                    <option value="box">box</option>
                                    <option value="set">set</option>
                                  </select>
                                );
                              }

                              if (isBoolCol) {
                                return (
                                  <select
                                    autoFocus
                                    value={cellDraftValue}
                                    onChange={(e) => {
                                      setCellDraftValue(e.target.value);
                                      handleCommitDirectValue(rIdx, cIdx, e.target.value);
                                    }}
                                    onBlur={handleCommitEdit}
                                    className="w-full h-8 px-2 py-1 text-xs text-slate-900 bg-white border-0 focus:outline-hidden font-medium cursor-pointer"
                                  >
                                    <option value="true">true</option>
                                    <option value="false">false</option>
                                    <option value="">— blank —</option>
                                  </select>
                                );
                              }

                              if (isItemTypeCol) {
                                return (
                                  <select
                                    autoFocus
                                    value={cellDraftValue}
                                    onChange={(e) => {
                                      setCellDraftValue(e.target.value);
                                      handleCommitDirectValue(rIdx, cIdx, e.target.value);
                                    }}
                                    onBlur={handleCommitEdit}
                                    className="w-full h-8 px-2 py-1 text-xs text-slate-900 bg-white border-0 focus:outline-hidden font-medium cursor-pointer"
                                  >
                                    <option value="Product">Product</option>
                                    <option value="Variant">Variant</option>
                                  </select>
                                );
                              }

                              return (
                                <input
                                  ref={inputRef}
                                  type="text"
                                  value={cellDraftValue}
                                  onChange={(e) => setCellDraftValue(e.target.value)}
                                  onBlur={handleCommitEdit}
                                  onKeyDown={handleKeyDown}
                                  className="w-full h-8 px-2 py-1 text-xs text-slate-900 bg-white border-0 focus:outline-hidden font-medium"
                                />
                              );
                            })()
                          ) : (
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`block truncate text-xs ${
                                  cellError
                                    ? "text-rose-900 font-semibold"
                                    : !cellVal
                                    ? "text-slate-300 italic"
                                    : "text-slate-800"
                                }`}
                              >
                                {cellVal || "—"}
                              </span>
                              {cellError && (
                                <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Click any cell to edit directly. Press Enter to save edits.</span>
          </div>
          <div>
            Showing {visibleRowIndices.length} of {rows.length} rows
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ACTION BAR */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-white text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Upload</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600">
            Ready to commit <strong>{stats.totalProducts} products</strong> (
            <span className="text-emerald-700 font-semibold">{stats.newCount} new</span>,{" "}
            <span className="text-blue-700 font-semibold">{stats.updateCount} updates</span>)
          </span>

          <button
            type="button"
            onClick={() => onProceedToImport(headers, rows)}
            disabled={stats.errorCount > 0}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold shadow-xs transition-colors ${
              stats.errorCount > 0
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            }`}
          >
            <span>Proceed to Import</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5. ADD COLUMN MODAL */}
      {isAddColumnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add New Column</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedCell !== null && selectedCell.c >= 0 && headers[selectedCell.c] ? (
                    <span>
                      Inserting directly to the right of:{" "}
                      <strong className="text-indigo-600">{headers[selectedCell.c]}</strong>
                    </span>
                  ) : (
                    <span>Adding new column at the far right</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddColumnModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Column Header Name</label>
              <input
                autoFocus
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmAddColumn();
                  if (e.key === "Escape") setIsAddColumnModalOpen(false);
                }}
                placeholder="e.g. Option 4 Name, Tags, Ribbon, etc."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
              />
            </div>

            {/* Quick Suggestions / Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Quick Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Option 4 Name",
                  "Option 4 Value",
                  "Option 5 Name",
                  "Option 5 Value",
                  "Option 6 Name",
                  "Option 6 Value",
                  "Ribbon",
                  "Tags",
                  "Brand",
                  "section 4 Title",
                  "section 4 Name",
                  "section 5 Title",
                  "section 5 Name",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleConfirmAddColumn(preset)}
                    className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-md transition-colors cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddColumnModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmAddColumn()}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Add Column
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
