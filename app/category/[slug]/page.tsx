import { notFound } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/data/categories";
import { PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { ChevronRight, Layers, ArrowLeft } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);

  if (!category) {
    return notFound();
  }

  const categoryProducts = PRODUCTS.filter((p) => p.categoryId === category.id);

  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/products" className="hover:text-slate-900">
            Products
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">{category.name}</span>
        </nav>

        {/* Hero Banner for Category */}
        <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl mb-12 relative overflow-hidden">
          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="inline-flex items-center gap-2 type-label text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
              <Layers className="w-3.5 h-3.5" />
              {category.badge}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold font-mono text-white tracking-tight">
              {category.name}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {category.description}
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {category.subcategories.map((sub) => (
                <Link
                  key={sub}
                  href={`/products?category=${category.slug}&sub=${encodeURIComponent(sub)}`}
                  className="type-technical bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-full border border-slate-800 transition-colors"
                >
                  {sub}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="type-card-title text-slate-900 font-mono">
              In-Stock {category.name} Components ({categoryProducts.length})
            </h2>
            <Link
              href="/products"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> View All Hardware
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {categoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
