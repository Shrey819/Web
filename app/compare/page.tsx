"use client";

import Link from "next/link";
import Image from "next/image";
import { useCompareStore } from "@/store/useCompareStore";
import { useCartStore } from "@/store/useCartStore";
import { useToastStore } from "@/store/useToastStore";
import { ArrowUpDown, ChevronRight, X, Trash2, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types";

export default function ComparePage() {
  const { items, removeItem, clearCompare } = useCompareStore();
  const { addItem } = useCartStore();
  const { addToast } = useToastStore();

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    addToast("success", "Added to Cart", `${product.name} added to cart.`);
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">Side-by-Side Spec Matrix</span>
        </nav>

        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-mono font-extrabold text-slate-900">
              Technical Comparison Matrix ({items.length}/4)
            </h1>
            <p className="type-body-small text-slate-500 mt-1">
              Compare voltages, protocols, ingress ratings, and prices side-by-side.
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearCompare}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" /> Clear Matrix
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center mx-auto text-sky-500">
              <ArrowUpDown className="w-8 h-8" />
            </div>
            <h3 className="type-card-title text-slate-900">No components in comparison matrix</h3>
            <p className="type-body-small text-slate-500">
              Add up to 4 components from product cards or detail pages to compare parameters side-by-side.
            </p>
            <Link
              href="/products"
              className="inline-block px-8 py-3 rounded-full bg-slate-900 text-white type-button shadow-md"
            >
              Browse Hardware Catalog
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-4 font-mono font-bold uppercase text-slate-500 min-w-[160px]">
                    Hardware Item
                  </th>
                  {items.map((product) => (
                    <th key={product.id} className="p-4 min-w-[240px] relative">
                      <button
                        onClick={() => removeItem(product.id)}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-500"
                        title="Remove from compare"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="w-20 h-20 relative rounded-xl overflow-hidden bg-slate-950 border border-slate-200 mb-2">
                        <Image src={product.images[0]?.url || "/placeholder.png"} alt="" fill className="object-cover" unoptimized />
                      </div>

                      <div className="text-[10px] font-mono uppercase font-bold text-sky-600">
                        {product.brand}
                      </div>
                      <div className="font-bold text-slate-900 line-clamp-1">{product.name}</div>
                      <div className="font-mono type-body-small text-slate-500 font-normal">
                        SKU: {product.sku}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/60">Unit Price</td>
                  {items.map((p) => (
                    <td key={p.id} className="p-4 font-bold text-sky-700 text-base">
                      {formatCurrency(p.basePrice)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/60">Stock Availability</td>
                  {items.map((p) => (
                    <td key={p.id} className="p-4 font-semibold text-emerald-600">
                      {p.stockStatus === 'in-stock' ? `In Stock` : "Backorder"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/60">Category Domain</td>
                  {items.map((p) => (
                    <td key={p.id} className="p-4">{p.categoryId}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/60">Voltage Specification</td>
                  {items.map((p) => {
                    const group = p.specifications?.find(g => g.groupName === 'Technical Specifications' || g.groupName === 'Electrical');
                    const spec = group?.attributes?.find(s => s.label.toLowerCase().includes('voltage'));
                    return <td key={p.id} className="p-4">{spec?.value || "24V DC"}</td>;
                  })}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/60">Communication Protocol</td>
                  {items.map((p) => {
                    const group = p.specifications?.find(g => g.groupName === 'Technical Specifications' || g.groupName === 'Features');
                    const spec = group?.attributes?.find(s => s.label.toLowerCase().includes('protocol'));
                    return <td key={p.id} className="p-4">{spec?.value || "IO-Link / Discrete"}</td>;
                  })}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/60">Ingress Rating</td>
                  {items.map((p) => {
                    const group = p.specifications?.find(g => g.groupName === 'Technical Specifications' || g.groupName === 'Mechanical');
                    const spec = group?.attributes?.find(s => s.label.toLowerCase().includes('ip rating') || s.label.toLowerCase().includes('protection'));
                    return <td key={p.id} className="p-4 font-bold text-emerald-600">{spec?.value || "IP67"}</td>;
                  })}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/60">Warranty Period</td>
                  {items.map((p) => (
                    <td key={p.id} className="p-4">1 Years Factory</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/60">Action</td>
                  {items.map((p) => (
                    <td key={p.id} className="p-4">
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="py-2 px-4 rounded-full bg-slate-900 hover:bg-sky-600 text-white type-button flex items-center gap-1.5 shadow-md"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
                        <span>Add to Cart</span>
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
