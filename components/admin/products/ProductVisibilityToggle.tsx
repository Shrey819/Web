"use client";

import { useState } from "react";
import { toggleProductVisibility } from "@/app/actions/product";
import { useToastStore } from "@/store/useToastStore";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface ProductVisibilityToggleProps {
  productId: string;
  initialStatus: string;
  productName: string;
}

export function ProductVisibilityToggle({ productId, initialStatus, productName }: ProductVisibilityToggleProps) {
  const { addToast } = useToastStore();
  const [status, setStatus] = useState(initialStatus);
  const [isPending, setIsPending] = useState(false);

  const isVisible = status === "ACTIVE";

  const handleToggle = async () => {
    setIsPending(true);
    try {
      const res = await toggleProductVisibility(productId, status);
      if (res.success && res.newStatus) {
        setStatus(res.newStatus);
        if (res.newStatus === "ACTIVE") {
          addToast("success", "Product Visible", `"${productName}" is now VISIBLE to normal users.`);
        } else {
          addToast("warning", "Product Hidden", `"${productName}" is now HIDDEN from normal users.`);
        }
      } else {
        addToast("error", "Toggle Failed", res.error || "Could not change visibility.");
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`p-2 rounded-xl border transition-all flex items-center gap-1 text-xs font-semibold ${
        isVisible
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
          : "bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700/80 hover:text-slate-300"
      }`}
      title={isVisible ? "Visible to normal users (Click to hide)" : "Hidden from normal users (Click to show)"}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      ) : isVisible ? (
        <>
          <Eye className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Visible</span>
        </>
      ) : (
        <>
          <EyeOff className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">Hidden</span>
        </>
      )}
    </button>
  );
}
