"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X,
  Search,
  Check,
  Plus,
  Edit2,
  Trash2,
  Layers,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import {
  getGlobalInfoSections,
  deleteInfoSection,
  GlobalInfoSectionItem,
} from "@/app/actions/productManagement";

export interface InfoSectionItem {
  id: string;
  internalName: string;
  title: string;
  content: string;
  productCount?: number;
}

interface SelectInfoSectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  initialSections: InfoSectionItem[];
  onApply: (selectedIds: string[], updatedSectionsList: InfoSectionItem[]) => void;
  onOpenCreateSection: () => void;
  onOpenEditSection: (section: InfoSectionItem) => void;
}

export function SelectInfoSectionsModal({
  isOpen,
  onClose,
  selectedIds,
  initialSections,
  onApply,
  onOpenCreateSection,
  onOpenEditSection,
}: SelectInfoSectionsModalProps) {
  const { addToast } = useToastStore();

  const [sections, setSections] = useState<InfoSectionItem[]>(initialSections || []);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedIds || []);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempSelectedIds(selectedIds || []);
      setSearch("");
      loadSections();
    }
  }, [isOpen, selectedIds]);

  const loadSections = async () => {
    setIsLoading(true);
    try {
      const res = await getGlobalInfoSections();
      if (res.success && res.sections) {
        setSections(res.sections as InfoSectionItem[]);
      }
    } catch (err: any) {
      console.error("Error loading info sections:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredSections = sections.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      s.internalName?.toLowerCase().includes(q) ||
      s.content?.toLowerCase().includes(q)
    );
  });

  const handleToggle = (id: string) => {
    setTempSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        if (prev.length >= 10) {
          addToast("warning", "Limit Reached", "You can assign up to 10 info sections per product.");
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    const allIds = filteredSections.map((s) => s.id).slice(0, 10);
    setTempSelectedIds(allIds);
  };

  const handleDeselectAll = () => {
    setTempSelectedIds([]);
  };

  const handleDeleteSection = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${title}" from the library? This will remove it from all products.`)) {
      return;
    }

    setIsDeletingId(id);
    try {
      const res = await deleteInfoSection(id);
      if (res.success) {
        setSections((prev) => prev.filter((s) => s.id !== id));
        setTempSelectedIds((prev) => prev.filter((item) => item !== id));
        addToast("success", "Section Deleted", `"${title}" was removed from the library.`);
      } else {
        addToast("error", "Delete Failed", res.error || "Could not delete section.");
      }
    } catch (err: any) {
      addToast("error", "Error", err.message || "Failed to delete section.");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleApply = () => {
    onApply(tempSelectedIds, sections);
    addToast(
      "success",
      "Sections Applied",
      `Assigned ${tempSelectedIds.length} info section(s) to this product.`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 text-slate-800 dark:text-slate-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Additional Info Sections Library
              </h2>
              <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full text-xs font-bold">
                {tempSelectedIds.length} / 10 Selected
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select predefined sections to display on this product, or create a new reusable section below.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Quick Controls Bar */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search info sections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Section List Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs">Loading info sections...</span>
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">No Info Sections Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {search ? "No sections match your search query." : "You haven't created any info sections yet."}
              </p>
            </div>
          ) : (
            filteredSections.map((sec) => {
              const isChecked = tempSelectedIds.includes(sec.id);
              const cleanSnippet = sec.content?.replace(/<[^>]*>?/gm, "").trim() || "No content...";

              return (
                <div
                  key={sec.id}
                  onClick={() => handleToggle(sec.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isChecked
                      ? "border-blue-500 bg-blue-50/40 dark:bg-blue-900/30 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Custom Checkbox */}
                    <div className="pt-0.5">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {sec.title}
                        </span>
                        {sec.internalName && sec.internalName !== sec.title && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                            / {sec.internalName}
                          </span>
                        )}
                        {sec.productCount != null && sec.productCount > 0 && (
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                            Used in {sec.productCount} {sec.productCount === 1 ? "product" : "products"}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-lg mt-0.5">
                        {cleanSnippet}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Edit / Delete */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onOpenEditSection(sec)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit global section"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingId === sec.id}
                      onClick={(e) => handleDeleteSection(e, sec.id, sec.title)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete from library"
                    >
                      {isDeletingId === sec.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Add Another Info Section Button inside popup */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenCreateSection}
              className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-900/60 hover:border-blue-400 dark:hover:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              Add Another Info Section
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {tempSelectedIds.length} of 10 maximum sections selected
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Apply Selected ({tempSelectedIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
