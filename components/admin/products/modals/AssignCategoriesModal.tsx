"use client";

import { useState, useEffect } from "react";
import { Search, X, Plus, Folder, Loader2 } from "lucide-react";
import { createInlineCategory } from "@/app/actions/productManagement";
import { useToastStore } from "@/store/useToastStore";

interface CategoryItem {
  id: string;
  name: string;
  slug?: string;
  status?: string;
}

interface AssignCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  selectedCategoryIds: string[];
  primaryCategoryId?: string;
  onApply: (selectedIds: string[], primaryId: string) => void;
}

export function AssignCategoriesModal({
  isOpen,
  onClose,
  categories: initialCategories,
  selectedCategoryIds: initialSelected,
  primaryCategoryId: initialPrimary,
  onApply,
}: AssignCategoriesModalProps) {
  const { addToast } = useToastStore();
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);
  const [search, setSearch] = useState("");
  const [showCreateInline, setShowCreateInline] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(initialSelected || []);
      setCategories(initialCategories || []);
      setSearch("");
    }
  }, [isOpen, initialSelected, initialCategories]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1) {
        addToast("warning", "Required", "Product must belong to at least 1 category.");
        return;
      }
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsCreating(true);
    try {
      const res = await createInlineCategory(newCatName.trim());
      if (res.success && res.id) {
        const created = { id: res.id, name: res.name || newCatName.trim(), status: "active" };
        setCategories((prev) => [...prev, created]);
        setSelectedIds((prev) => [...prev, created.id]);
        setNewCatName("");
        setShowCreateInline(false);
        addToast("success", "Category Created", `"${created.name}" created & assigned.`);
      } else {
        addToast("error", "Failed", res.error || "Could not create category.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleApplyChanges = () => {
    const primary = selectedIds.includes(initialPrimary || "") ? initialPrimary || selectedIds[0] : selectedIds[0];
    onApply(selectedIds, primary);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 text-slate-800 dark:text-slate-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Assign product to categories</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {selectedIds.length} items selected (999 max)
          </div>
        </div>

        {/* Category List */}
        <div className="p-2 overflow-y-auto flex-1 divide-y divide-slate-50 dark:divide-slate-800/50 space-y-1">
          {filteredCategories.map((cat) => {
            const isSelected = selectedIds.includes(cat.id);
            return (
              <div
                key={cat.id}
                onClick={() => handleToggle(cat.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                  isSelected ? "bg-blue-50/60 dark:bg-blue-900/30" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // Handled by parent div
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="w-9 h-7 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                    <Folder className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{cat.name}</span>
                </div>
                {cat.status === "inactive" && (
                  <span className="text-xs text-slate-400 font-normal">Not active</span>
                )}
              </div>
            );
          })}

          {filteredCategories.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-400">
              No categories found.
            </div>
          )}
        </div>

        {/* Inline Create Category Form */}
        {showCreateInline && (
          <form onSubmit={handleCreateCategory} className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="New category name..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={isCreating || !newCatName.trim()}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
            >
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateInline(false)}
              className="px-2 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={() => setShowCreateInline(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create New
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyChanges}
              className="px-5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
