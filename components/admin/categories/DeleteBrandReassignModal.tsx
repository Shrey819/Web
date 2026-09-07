"use client";

import { useState } from "react";
import { deleteBrandWithReassignment, createBrand, type BrandItem } from "@/app/actions/productManagement";
import { useToastStore } from "@/store/useToastStore";
import { X, AlertTriangle, Plus, Building2, ArrowRight, Loader2, Check, Tag } from "lucide-react";

interface DeleteBrandReassignModalProps {
  brandToDelete: BrandItem;
  brands: BrandItem[];
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteBrandReassignModal({
  brandToDelete,
  brands,
  onClose,
  onSuccess,
}: DeleteBrandReassignModalProps) {
  const { addToast } = useToastStore();
  const availableBrands = brands.filter((b) => b.id !== brandToDelete.id);

  const [reassignMode, setReassignMode] = useState<"reassign" | "unbrand">("reassign");
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    availableBrands[0]?.id || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Inline New Brand State
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleCreateNewBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    setIsCreatingNew(true);
    try {
      const res = await createBrand(newBrandName.trim());
      if (res.success && res.id) {
        addToast("success", "Brand Created", `Brand "${newBrandName.trim()}" created.`);
        setSelectedTargetId(res.id);
        setNewBrandName("");
        setShowCreateNew(false);
        onSuccess(); // Refresh parent brands list
      } else {
        addToast("error", "Creation Failed", res.error || "Could not create brand.");
      }
    } finally {
      setIsCreatingNew(false);
    }
  };

  const handleDeleteWithReassign = async () => {
    if (reassignMode === "reassign" && !selectedTargetId) {
      addToast("error", "Target Brand Required", "Please select a brand to reassign products to, or choose 'Make Non-Branded'.");
      return;
    }

    setIsSubmitting(true);
    try {
      const targetId = reassignMode === "reassign" ? selectedTargetId : null;
      const res = await deleteBrandWithReassignment(brandToDelete.id, targetId);
      if (res.success) {
        if (reassignMode === "reassign") {
          const targetBrand = brands.find((b) => b.id === selectedTargetId);
          addToast(
            "success",
            "Brand Deleted & Products Reassigned",
            `Reassigned ${brandToDelete.productCount || 0} product(s) to "${targetBrand?.name || 'new brand'}" and deleted "${brandToDelete.name}".`
          );
        } else {
          addToast(
            "success",
            "Brand Deleted",
            `${brandToDelete.productCount || 0} product(s) moved to Non-Branded and deleted "${brandToDelete.name}".`
          );
        }
        onSuccess();
        onClose();
      } else {
        addToast("error", "Delete Failed", res.error || "Could not reassign products or delete brand.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const productCount = brandToDelete.productCount || 0;

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
              <p className="text-xs text-slate-500 dark:text-slate-400">No products will be deleted from store</p>
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
          {/* Brand Info Banner */}
          <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3">
            <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                You are about to delete brand &ldquo;{brandToDelete.name}&rdquo;
              </p>
              <p className="text-amber-700 dark:text-amber-400 mt-1">
                This brand currently has{" "}
                <strong className="underline font-bold text-amber-900 dark:text-amber-200">
                  {productCount} linked product(s)
                </strong>
                . Choose how you want to handle these products:
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {/* Option 1: Reassign to another brand */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                reassignMode === "reassign"
                  ? "border-[#00a651] bg-emerald-50/20 dark:bg-emerald-500/5 ring-1 ring-[#00a651]"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <input
                type="radio"
                name="reassignMode"
                value="reassign"
                checked={reassignMode === "reassign"}
                onChange={() => setReassignMode("reassign")}
                className="mt-1 text-[#00a651] focus:ring-[#00a651]"
              />
              <div className="flex-1 text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Move products to another brand
                </span>
                <span className="text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Reassign all {productCount} product(s) to another manufacturer brand.
                </span>

                {reassignMode === "reassign" && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        Target Brand:
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCreateNew(!showCreateNew)}
                        className="text-[11px] text-[#00a651] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        {showCreateNew ? "Cancel" : "Create New Brand"}
                      </button>
                    </div>

                    {showCreateNew ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="New brand name..."
                          value={newBrandName}
                          onChange={(e) => setNewBrandName(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#00a651]"
                        />
                        <button
                          type="button"
                          disabled={isCreatingNew || !newBrandName.trim()}
                          onClick={handleCreateNewBrand}
                          className="px-3 py-1.5 bg-[#00a651] hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                        >
                          {isCreatingNew ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Create
                        </button>
                      </div>
                    ) : (
                      <select
                        value={selectedTargetId}
                        onChange={(e) => setSelectedTargetId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#00a651] cursor-pointer"
                      >
                        {availableBrands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.productCount || 0} products)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            </label>

            {/* Option 2: Make Non-Branded (Remove Brand) */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                reassignMode === "unbrand"
                  ? "border-[#00a651] bg-emerald-50/20 dark:bg-emerald-500/5 ring-1 ring-[#00a651]"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <input
                type="radio"
                name="reassignMode"
                value="unbrand"
                checked={reassignMode === "unbrand"}
                onChange={() => setReassignMode("unbrand")}
                className="mt-1 text-[#00a651] focus:ring-[#00a651]"
              />
              <div className="flex-1 text-xs">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  Make products Non-Branded (No Brand)
                </span>
                <span className="text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Remove brand association. Products will appear in the &ldquo;Non-Branded Products&rdquo; list where you can assign them to other brands anytime.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteWithReassign}
            disabled={isSubmitting || (reassignMode === "reassign" && !selectedTargetId)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <span>Confirm &amp; Delete Brand</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
