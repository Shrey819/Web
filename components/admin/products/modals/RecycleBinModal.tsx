"use client";

import { useState, useEffect } from "react";
import {
  X,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Package,
  Calendar,
  ShieldAlert,
} from "lucide-react";
import {
  getRecycleBinProducts,
  restoreProduct,
  permanentlyDeleteProduct,
  RecycleBinProductItem,
} from "@/app/actions/product";
import { useToastStore } from "@/store/useToastStore";
import { formatCurrency } from "@/lib/utils";

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsChanged?: () => void;
}

export function RecycleBinModal({ isOpen, onClose, onProductsChanged }: RecycleBinModalProps) {
  const { addToast } = useToastStore();

  const [products, setProducts] = useState<RecycleBinProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Actions state
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Permanent Delete Modal state
  const [targetProduct, setTargetProduct] = useState<RecycleBinProductItem | null>(null);
  const [securityPassword, setSecurityPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // Live countdown timer for rate limit lockout (5 trials per minute)
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setDeleteError("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const items = await getRecycleBinProducts();
      setProducts(items);
    } catch {
      addToast("error", "Error", "Failed to load recycle bin products.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen]);

  const handleRestore = async (p: RecycleBinProductItem) => {
    setRestoringId(p.id);
    try {
      const res = await restoreProduct(p.id);
      if (res.success) {
        setProducts((prev) => prev.filter((item) => item.id !== p.id));
        addToast("success", "Product Restored", `"${p.name}" has been restored to active products.`);
        if (onProductsChanged) onProductsChanged();
      } else {
        addToast("error", "Restore Failed", res.error || "Could not restore product.");
      }
    } catch {
      addToast("error", "Error", "An unexpected error occurred while restoring product.");
    } finally {
      setRestoringId(null);
    }
  };

  const openPermanentDeleteDialog = (p: RecycleBinProductItem) => {
    setTargetProduct(p);
    setSecurityPassword("");
    if (cooldownSeconds === 0) {
      setDeleteError("");
    }
    setShowPassword(false);
  };

  const handleConfirmPermanentDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProduct || cooldownSeconds > 0) return;

    if (!securityPassword.trim()) {
      setDeleteError("Please enter the security password.");
      return;
    }

    setIsDeletingPermanently(true);
    setDeleteError("");

    try {
      const res = await permanentlyDeleteProduct(targetProduct.id, securityPassword);
      if (res.success) {
        setProducts((prev) => prev.filter((item) => item.id !== targetProduct.id));
        addToast("info", "Permanently Deleted", `"${targetProduct.name}" was permanently removed.`);
        setTargetProduct(null);
        setCooldownSeconds(0);
        if (onProductsChanged) onProductsChanged();
      } else {
        setDeleteError(res.error || "Incorrect password. Permanent deletion was blocked.");
        if (res.locked && res.retryAfter) {
          setCooldownSeconds(res.retryAfter);
        }
      }
    } catch {
      setDeleteError("An unexpected error occurred during permanent deletion.");
    } finally {
      setIsDeletingPermanently(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-white animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Product Recycle Bin</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-500/30">
                  {products.length} {products.length === 1 ? "Product" : "Products"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deleted products are hidden from the storefront. Restore them anytime or permanently delete with password authorization.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
              <span className="text-xs font-mono font-medium">Loading Recycle Bin items...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                <Package className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Recycle Bin is Empty</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                No products are currently in the Recycle Bin. When products are deleted, they will appear here safely.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              {products.map((p) => {
                const isRestoring = restoringId === p.id;

                return (
                  <div
                    key={p.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Product Thumbnail & Details */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://res.cloudinary.com/hecyltpu/image/upload/v1788819936/products/v86fzl3rk6h4o0psjucv.jpg";
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {p.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 font-mono text-[10px] font-bold border border-rose-200 dark:border-rose-500/20">
                            DELETED
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap font-mono">
                          <span>SKU: {p.sku}</span>
                          <span>•</span>
                          <span className="font-extrabold text-[#00a651] dark:text-emerald-400">
                            {formatCurrency(p.priceNumber)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Calendar className="w-3 h-3" />
                            Deleted: {new Date(p.deletedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 justify-end shrink-0">
                      {/* Restore Button */}
                      <button
                        type="button"
                        onClick={() => handleRestore(p)}
                        disabled={isRestoring}
                        className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Restore product to store"
                      >
                        {isRestoring ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        <span>Restore</span>
                      </button>

                      {/* Permanent Delete Button */}
                      <button
                        type="button"
                        onClick={() => openPermanentDeleteDialog(p)}
                        className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Permanently delete from database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Permanently</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Security password required to permanently delete.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Security Password Confirmation Sub-Modal */}
      {targetProduct && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Permanently Delete
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  This action is permanent and completely irreversible.
                </p>
              </div>
            </div>

            {/* Warning notice */}
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-rose-800 dark:text-rose-300 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>Target Product: &quot;{targetProduct.name}&quot;</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-400">
                All component media, variants, specifications, and related options will be completely purged from the PostgreSQL database.
              </p>
            </div>

            {/* Password Form */}
            <form onSubmit={handleConfirmPermanentDelete} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                  <span>Permanently Delete</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isDeletingPermanently || cooldownSeconds > 0}
                    placeholder={cooldownSeconds > 0 ? `Locked: wait ${cooldownSeconds}s` : "Enter security password"}
                    value={securityPassword}
                    onChange={(e) => {
                      setSecurityPassword(e.target.value);
                      if (deleteError) setDeleteError("");
                    }}
                    autoFocus
                    className="w-full pl-4 pr-11 py-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 font-mono disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {deleteError && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{deleteError}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setTargetProduct(null)}
                  disabled={isDeletingPermanently}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeletingPermanently || cooldownSeconds > 0}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDeletingPermanently ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : cooldownSeconds > 0 ? (
                    <span>Locked ({cooldownSeconds}s)</span>
                  ) : (
                    <span>Confirm Delete</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
