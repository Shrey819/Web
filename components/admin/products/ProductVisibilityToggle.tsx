"use client";

import { useState } from "react";
import { toggleProductVisibility } from "@/app/actions/product";
import { useToastStore } from "@/store/useToastStore";
import { Loader2 } from "lucide-react";

interface ProductVisibilityToggleProps {
  productId: string;
  initialVisible: boolean;
  productName: string;
}

export function ProductVisibilityToggle({ productId, initialVisible, productName }: ProductVisibilityToggleProps) {
  const { addToast } = useToastStore();
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    setIsPending(true);
    try {
      const res = await toggleProductVisibility(productId, isVisible);
      if (res.success && res.visible !== undefined) {
        setIsVisible(res.visible);
        if (res.visible) {
          addToast("success", "Product Visible", `"${productName}" is now visible in online store.`);
        } else {
          addToast("warning", "Product Hidden", `"${productName}" is now hidden from store.`);
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
          isVisible ? "bg-blue-600" : "bg-slate-300"
        }`}
        title={isVisible ? "Visible in store (Click to hide)" : "Hidden (Click to show)"}
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
          ? "text-blue-600 font-bold" 
          : "text-slate-400"
      }`}>
        {isVisible ? "Visible" : "Hidden"}
      </span>
    </div>
  );
}
