"use client";

import { useState } from "react";
import { toggleProductVisibility } from "@/app/actions/product";
import { useToastStore } from "@/store/useToastStore";
import { useAdminThemeStore } from "@/store/useAdminThemeStore";
import { Loader2 } from "lucide-react";

interface ProductVisibilityToggleProps {
  productId: string;
  initialStatus: string;
  productName: string;
}

export function ProductVisibilityToggle({ productId, initialStatus, productName }: ProductVisibilityToggleProps) {
  const { addToast } = useToastStore();
  const { theme } = useAdminThemeStore();
  const isLight = theme === "light";
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
          addToast("success", "Product Visible", `"${productName}" is now active in store.`);
        } else {
          addToast("warning", "Product Hidden", `"${productName}" is now hidden as draft.`);
        }
      } else {
        addToast("error", "Toggle Failed", res.error || "Could not change visibility.");
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer disabled:opacity-50 ${
          isVisible ? "bg-blue-600" : isLight ? "bg-slate-300" : "bg-slate-700"
        }`}
        title={isVisible ? "Active in store (Click to hide)" : "Hidden/Draft (Click to show)"}
      >
        {isPending ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-3 h-3 text-white animate-spin" />
          </div>
        ) : (
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform ${
              isVisible ? "translate-x-4" : "translate-x-0"
            }`}
          />
        )}
      </button>
      <span className={`text-[11px] font-semibold ${
        isVisible 
          ? "text-blue-600 dark:text-blue-400 font-bold" 
          : isLight ? "text-slate-400" : "text-slate-500"
      }`}>
        {isVisible ? "Active" : "Draft"}
      </span>
    </div>
  );
}
