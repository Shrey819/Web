"use client";

import { useState, useEffect } from "react";
import { Search, X, Edit2, Trash2, Plus, Check, Loader2, Building2 } from "lucide-react";
import { getGlobalBrands, createBrand, renameBrand, deleteBrand, type BrandItem } from "@/app/actions/productManagement";
import { useToastStore } from "@/store/useToastStore";

interface ManageBrandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBrandsUpdated?: () => void;
}

export function ManageBrandsModal({
  isOpen,
  onClose,
  onBrandsUpdated,
}: ManageBrandsModalProps) {
  const { addToast } = useToastStore();
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingOldName, setEditingOldName] = useState("");
  const [showCreateRow, setShowCreateRow] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBrands = async () => {
    setIsLoading(true);
    const res = await getGlobalBrands();
    if (res.success) {
      setBrands(res.brands || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadBrands();
      setEditingId(null);
      setShowCreateRow(false);
      setSearch("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartEdit = (b: BrandItem) => {
    setEditingId(b.id);
    setEditingText(b.name);
    setEditingOldName(b.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingText.trim()) return;
    setIsSubmitting(true);
    const res = await renameBrand(id, editingText.trim(), editingOldName);
    setIsSubmitting(false);
    if (res.success) {
      setBrands((prev) =>
        prev.map((b) => (b.id === id ? { ...b, name: editingText.trim() } : b))
      );
      setEditingId(null);
      addToast("success", "Brand Renamed", `Updated to "${editingText.trim()}".`);
      onBrandsUpdated?.();
    } else {
      addToast("error", "Failed", res.error || "Could not rename brand.");
    }
  };

  const handleDelete = async (b: BrandItem) => {
    if (!confirm(`Are you sure you want to delete brand "${b.name}"?`)) return;
    const res = await deleteBrand(b.id, b.name);
    if (res.success) {
      setBrands((prev) => prev.filter((item) => item.id !== b.id));
      addToast("info", "Brand Deleted", `Removed "${b.name}".`);
      onBrandsUpdated?.();
    } else {
      addToast("error", "Failed", res.error || "Could not delete brand.");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setIsSubmitting(true);
    const res = await createBrand(newBrandName.trim());
    setIsSubmitting(false);
    if (res.success) {
      addToast("success", "Brand Created", `Added brand "${newBrandName.trim()}".`);
      setNewBrandName("");
      setShowCreateRow(false);
      loadBrands();
      onBrandsUpdated?.();
    } else {
      addToast("error", "Failed", res.error || "Could not create brand.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Manage Global Brands</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add, rename, and delete manufacturer & brand names.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowCreateRow(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Brand
          </button>
        </div>

        {/* Create Brand Row */}
        {showCreateRow && (
          <form onSubmit={handleCreate} className="p-4 bg-blue-50/50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/40 flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter new brand name..."
              value={newBrandName}
              maxLength={50}
              autoFocus
              onChange={(e) => setNewBrandName(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-medium"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newBrandName.trim()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateRow(false);
                setNewBrandName("");
              }}
              className="px-2.5 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Brands List */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800 space-y-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="text-xs">Loading brands...</span>
            </div>
          ) : filteredBrands.length > 0 ? (
            filteredBrands.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                {editingId === b.id ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      value={editingText}
                      maxLength={50}
                      autoFocus
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(b.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-500/40 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(b.id)}
                      disabled={isSubmitting}
                      className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{b.name}</span>
                    {b.productCount != null && b.productCount > 0 && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-normal">
                        {b.productCount} {b.productCount === 1 ? "product" : "products"}
                      </span>
                    )}
                  </div>
                )}

                {editingId !== b.id && (
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(b)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                      title="Rename brand"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(b)}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                      title="Delete brand"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
              No brands found matching your search.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Total: {brands.length} {brands.length === 1 ? "brand" : "brands"}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
