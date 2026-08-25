"use client";

import { useState } from "react";
import { deleteCategoryWithReassignment, createCategory } from "@/app/actions/category";
import { useToastStore } from "@/store/useToastStore";
import { X, AlertTriangle, Plus, FolderTree, ArrowRight, Loader2, Check } from "lucide-react";

interface DeleteCategoryReassignModalProps {
  categoryToDelete: {
    id: string;
    name: string;
    product_count: number;
  };
  categories: {
    id: string;
    name: string;
  }[];
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteCategoryReassignModal({
  categoryToDelete,
  categories,
  onClose,
  onSuccess,
}: DeleteCategoryReassignModalProps) {
  const { addToast } = useToastStore();
  const availableCategories = categories.filter((c) => c.id !== categoryToDelete.id);

  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    availableCategories[0]?.id || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Inline New Category State
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleCreateNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsCreatingNew(true);
    try {
      const res = await createCategory(newCatName.trim());
      if (res.success) {
        addToast("success", "Category Created", `Category "${newCatName.trim()}" created.`);
        setNewCatName("");
        setShowCreateNew(false);
        onSuccess(); // Refresh parent categories list
      } else {
        addToast("error", "Creation Failed", res.error || "Could not create category.");
      }
    } finally {
      setIsCreatingNew(false);
    }
  };

  const handleDeleteWithReassign = async () => {
    if (!selectedTargetId) {
      addToast("error", "Category Required", "Please select a category to reassign products to.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await deleteCategoryWithReassignment(categoryToDelete.id, selectedTargetId);
      if (res.success) {
        addToast(
          "success",
          "Category Deleted & Products Reassigned",
          `Reassigned ${categoryToDelete.product_count} product(s) and deleted "${categoryToDelete.name}".`
        );
        onSuccess();
        onClose();
      } else {
        addToast("error", "Delete Failed", res.error || "Could not reassign products.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Reassign Products Before Delete</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">No products will be deleted</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Warning Banner */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs leading-relaxed space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Category contains {categoryToDelete.product_count} product(s)
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              To keep your product catalog intact, choose another category to move these{" "}
              <strong className="text-slate-900 dark:text-white font-mono">{categoryToDelete.product_count}</strong> product(s) to before deleting{" "}
              <strong className="text-amber-900 dark:text-amber-400 font-mono">"{categoryToDelete.name}"</strong>.
            </p>
          </div>

          {/* Inline Create New Category Option */}
          {showCreateNew ? (
            <form onSubmit={handleCreateNewCategory} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-blue-200 dark:border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Create & Select New Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowCreateNew(false)}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Spare Parts & Accessories"
                  className="flex-1 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isCreatingNew}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isCreatingNew ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Create
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-900 dark:text-white">
                  Reassign {categoryToDelete.product_count} Product(s) To *
                </label>
                <button
                  type="button"
                  onClick={() => setShowCreateNew(true)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Create New Category
                </button>
              </div>

              {availableCategories.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 text-center">
                  No other categories exist yet. Please click "+ Create New Category" above first!
                </div>
              ) : (
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteWithReassign}
            disabled={isSubmitting || availableCategories.length === 0}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Reassign & Delete
          </button>
        </div>
      </div>
    </div>
  );
}
