"use client";

import Link from "next/link";
import { PRODUCTS } from "@/data/products";
import { ArrowRight, ArrowUpDown, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { SpecCompareConfig, DEFAULT_SPEC_COMPARE } from "@/lib/homepage";

export function SpecComparePreview({ config }: { config?: SpecCompareConfig }) {
  const currentConfig = config || DEFAULT_SPEC_COMPARE;
  const compareItems = [PRODUCTS[0], PRODUCTS[6], PRODUCTS[12]]; // 1 Sensor, 1 PLC, 1 Drive

  return (
    <section className="py-20 bg-[#faf9f5] border-b border-slate-200">
      <div className="content-shell">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 type-label text-sky-600 mb-2">
              <ArrowUpDown className="w-4 h-4" />
              <span>{currentConfig.eyebrow || "Specification Benchmarking"}</span>
            </div>
            <h2 className="type-display-section text-slate-900">
              {currentConfig.title || "Technical Specification Matrix Preview"}
            </h2>
          </div>

          <Link
            href={currentConfig.ctaUrl || "/compare"}
            className="inline-flex items-center gap-2 type-button text-sky-600 hover:text-sky-700 transition-colors"
          >
            <span>{currentConfig.ctaText || "Launch Full Side-by-Side Comparison Tool"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-4 font-mono font-bold uppercase text-slate-500 min-w-[160px]">
                  Spec Parameter
                </th>
                {compareItems.map((item) => (
                  <th key={item.id} className="p-4 font-bold text-slate-900 min-w-[220px]">
                    <div className="text-[10px] font-mono uppercase text-sky-600">
                      {item.brand}
                    </div>
                    <div className="line-clamp-1">{item.name}</div>
                    <div className="font-mono type-body-small text-slate-500 font-normal">
                      SKU: {item.sku}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              <tr>
                <td className="p-4 font-bold text-slate-900 bg-slate-50/50">Price</td>
                {compareItems.map((item) => (
                  <td key={item.id} className="p-4 font-bold text-sky-700 text-sm">
                    {formatCurrency(item.basePrice)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 bg-slate-50/50">Domain Category</td>
                {compareItems.map((item) => (
                  <td key={item.id} className="p-4">{item.categoryId}</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 bg-slate-50/50">Operating Voltage</td>
                {compareItems.map((item) => {
                  const group = item.specifications?.find(g => g.groupName === 'Technical Specifications' || g.groupName === 'Electrical');
                  const spec = group?.attributes?.find(s => s.label.toLowerCase().includes('voltage'));
                  return <td key={item.id} className="p-4">{spec?.value || "24V DC"}</td>;
                })}
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 bg-slate-50/50">Protocol Interface</td>
                {compareItems.map((item) => {
                  const group = item.specifications?.find(g => g.groupName === 'Technical Specifications' || g.groupName === 'Features');
                  const spec = group?.attributes?.find(s => s.label.toLowerCase().includes('protocol'));
                  return <td key={item.id} className="p-4">{spec?.value || "IO-Link / Discrete"}</td>;
                })}
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 bg-slate-50/50">Ingress Protection</td>
                {compareItems.map((item) => {
                  const group = item.specifications?.find(g => g.groupName === 'Technical Specifications' || g.groupName === 'Mechanical');
                  const spec = group?.attributes?.find(s => s.label.toLowerCase().includes('ip rating') || s.label.toLowerCase().includes('protection'));
                  return <td key={item.id} className="p-4 font-bold text-emerald-600">{spec?.value || "IP67"}</td>;
                })}
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 bg-slate-50/50">Warranty Period</td>
                {compareItems.map((item) => (
                  <td key={item.id} className="p-4">1 Years Factory</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
