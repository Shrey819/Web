import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="bg-[#faf9f5] min-h-screen flex items-center justify-center py-16 border-b border-slate-200">
      <div className="max-w-md w-full px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-slate-900 text-sky-400 flex items-center justify-center mx-auto shadow-md font-mono font-bold text-lg">
          404
        </div>
        <span className="inline-flex items-center gap-2 type-label text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" /> Error Code: SKU-NOT-FOUND
        </span>
        <h1 className="text-3xl font-mono font-extrabold text-slate-900">
          Industrial Component Not Located
        </h1>
        <p className="type-body-small text-slate-500 leading-relaxed">
          The specification sheet, resource whitepaper, or part category page you are looking for has been relocated or is obsolete.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
          <Link
            href="/products"
            className="px-6 py-3 rounded-full bg-slate-900 text-white type-button shadow-md flex items-center justify-center gap-1.5"
          >
            <span>Browse Full Catalog</span> <ArrowRight className="w-4 h-4 text-sky-400" />
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-full bg-slate-100 text-slate-800 type-button hover:bg-slate-200 flex items-center justify-center"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
