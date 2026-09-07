"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[Fatal Root Error Caught by GlobalError]:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#faf9f5] min-h-screen flex items-center justify-center p-4 font-sans text-slate-900 antialiased">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              Critical System Error
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              A fatal application exception occurred. Please try reloading the application.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span>Reload Application</span>
            </button>

            <a
              href="/"
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              Go to Home
            </a>
          </div>

          {error.digest && (
            <p className="text-[10px] font-mono text-slate-400">
              Error Digest: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
