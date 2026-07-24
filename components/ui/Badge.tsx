import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "stock" | "discount" | "category" | "neutral" | "warning";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  const styles = {
    stock: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 font-semibold",
    discount: "bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold",
    category: "bg-sky-500/10 text-sky-700 border-sky-500/20 font-medium",
    neutral: "bg-slate-100 text-slate-700 border-slate-200 font-medium",
    warning: "bg-amber-500/10 text-amber-700 border-amber-500/20 font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center text-xs px-2.5 py-0.5 rounded-full border tracking-wide uppercase font-mono",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
