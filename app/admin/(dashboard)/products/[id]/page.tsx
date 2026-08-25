import { getProductForEdit } from "@/app/actions/product";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Box, Tag, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

interface ProductDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { id } = await params;
  const product = (await getProductForEdit(id)) as Record<string, any> | null;

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{product.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">SKU: {product.sku} | Code: {product.productCode || "N/A"}</p>
          </div>
        </div>

        <Link
          href={`/admin/products/${product.id}/edit`}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          <Edit2 className="w-4 h-4" /> Edit Product
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Overview</h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{product.description || "No full description provided."}</p>
          </div>

          {product.specifications && product.specifications.length > 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Specifications</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.specifications.map((s: { groupName: string; name: string; value: string }, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{s.groupName} - {s.name}</p>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</h3>
            <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
              product.status === 'ACTIVE' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}>
              {product.status}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pricing</h3>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">₹{(product.basePrice / 100).toLocaleString('en-IN')}</p>
            {product.salePrice && (
              <p className="text-xs text-slate-500 dark:text-slate-400">Sale: ₹{(product.salePrice / 100).toLocaleString('en-IN')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
