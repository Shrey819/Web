import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Product } from "@/types";
import { CategoryShowcaseConfig } from "@/lib/homepage";
import { CategoryProductCarousel } from "./CategoryProductCarousel";

interface HomepageCategoryShowcaseProps {
  showcase: CategoryShowcaseConfig;
  categoryName: string;
  categorySlug: string;
  products: Product[];
}

export function HomepageCategoryShowcase({
  showcase,
  categoryName,
  categorySlug,
  products,
}: HomepageCategoryShowcaseProps) {
  if (!showcase.isActive) return null;

  return (
    <section className="py-8 sm:py-12 border-b border-slate-200/60 last:border-b-0">
      <div className="content-shell space-y-6">
        {/* Category Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-sky-600 font-mono text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Collection</span>
            </div>
            <h2 className="type-section-title font-extrabold text-slate-900 tracking-tight">
              {categoryName}
            </h2>
          </div>

          <Link
            href={`/category/${categorySlug}`}
            className="inline-flex items-center gap-2 font-mono text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors group/link shrink-0"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Category Hero Image (Admin Controlled) */}
        {showcase.heroImage && (
          <div className="relative w-full h-40 sm:h-52 md:h-64 rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 group">
            <img
              src={showcase.heroImage}
              alt={`${categoryName} Banner`}
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent flex items-center p-6 sm:p-10">
              <div className="max-w-lg text-white space-y-2">
                <span className="bg-amber-400 text-slate-950 font-mono text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest shadow">
                  Featured Category
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow font-heading">
                  {categoryName}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 line-clamp-2">
                  Browse our certified, high-performance line of {categoryName} hardware components.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Product Carousel */}
        <CategoryProductCarousel products={products} />
      </div>
    </section>
  );
}
