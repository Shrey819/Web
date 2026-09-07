"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, ShoppingBag, Headset } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[System Exception Caught by ErrorBoundary]:", error);
  }, [error]);

  return (
    <div className="bg-[#faf9f5] min-h-[70vh] flex items-center justify-center py-16 px-4 border-b border-slate-200">
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Visual Badge Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto shadow-xs border border-amber-500/20">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Error Code Digest */}
        <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          <span>STATUS: UNEXPECTED-EXCEPTION</span>
          {error.digest && (
            <span className="text-amber-900 border-l border-amber-300 pl-2">
              DIGEST: {error.digest.slice(0, 10)}
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 tracking-tight">
            System Interruption Encountered
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            Our automated monitoring system caught an unexpected execution error. Your active cart and session data remain securely preserved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-sky-400" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-2xs"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>Go to Homepage</span>
          </Link>

          <Link
            href="/products"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-slate-500" />
            <span>Catalog</span>
          </Link>
        </div>

        {/* Support Help */}
        <div className="pt-6 border-t border-slate-200/80 text-xs text-slate-500 flex items-center justify-center gap-2">
          <Headset className="w-3.5 h-3.5 text-slate-400" />
          <span>Need immediate assistance?</span>
          <Link href="/contact" className="text-blue-600 hover:underline font-semibold">
            Contact Engineering Support
          </Link>
        </div>
      </div>
    </div>
  );
}
