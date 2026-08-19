"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CldUploadButton } from "next-cloudinary";
import { saveHomepageConfigAction } from "@/app/actions/homepage";
import { HomepageData, HeroSlide, CategoryShowcaseConfig } from "@/lib/homepage";
import { useToastStore } from "@/store/useToastStore";
import { MediaLibraryModal } from "./MediaLibraryModal";
import { Save, Upload, Image as ImageIcon, Sliders, FileImage } from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface HomepageManagementFormProps {
  initialData: HomepageData;
  categories: CategoryOption[];
}

export function HomepageManagementForm({ initialData, categories }: HomepageManagementFormProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [isSaving, setIsSaving] = useState(false);

  const [promoTicker, setPromoTicker] = useState(initialData.promoTicker);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() => {
    if (initialData.heroSlides && initialData.heroSlides.length >= 3) {
      return initialData.heroSlides.slice(0, 3);
    }
    const base = [...(initialData.heroSlides || [])];
    while (base.length < 3) {
      base.push({
        id: `slide-${base.length + 1}`,
        desktopImage: "",
        mobileImage: "",
        title: `Hero Slide ${base.length + 1}`,
        subtitle: "Promotional Banner Subtitle",
        ctaText: "Shop Now",
        ctaUrl: "/products",
        isActive: true,
        sortOrder: base.length + 1,
      });
    }
    return base;
  });

  const [categoryShowcases, setCategoryShowcases] = useState<CategoryShowcaseConfig[]>(() => {
    if (initialData.categoryShowcases && initialData.categoryShowcases.length >= 3) {
      return initialData.categoryShowcases.slice(0, 3);
    }
    const base = [...(initialData.categoryShowcases || [])];
    while (base.length < 3) {
      base.push({
        id: `showcase-${base.length + 1}`,
        categoryId: categories[base.length]?.id || categories[0]?.id || "",
        heroImage: "",
        isActive: true,
        sortOrder: base.length + 1,
      });
    }
    return base;
  });

  // Media Library Target state
  const [activeMediaTarget, setActiveMediaTarget] = useState<{
    type: "slideDesktop" | "slideMobile" | "showcaseHero";
    index: number;
  } | null>(null);

  // Slide Handlers
  const handleSlideChange = (index: number, field: keyof HeroSlide, value: any) => {
    setHeroSlides((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Showcase Handlers
  const handleShowcaseChange = (index: number, field: keyof CategoryShowcaseConfig, value: any) => {
    setCategoryShowcases((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSelectMediaImage = (url: string) => {
    if (!activeMediaTarget) return;
    const { type, index } = activeMediaTarget;

    if (type === "slideDesktop") {
      handleSlideChange(index, "desktopImage", url);
    } else if (type === "slideMobile") {
      handleSlideChange(index, "mobileImage", url);
    } else if (type === "showcaseHero") {
      handleShowcaseChange(index, "heroImage", url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (let i = 0; i < heroSlides.length; i++) {
      if (heroSlides[i].isActive && !heroSlides[i].desktopImage) {
        addToast("error", "Validation Error", `Hero Slide ${i + 1} requires a Desktop Image.`);
        return;
      }
    }

    for (let i = 0; i < categoryShowcases.length; i++) {
      if (categoryShowcases[i].isActive && !categoryShowcases[i].categoryId) {
        addToast("error", "Validation Error", `Category Showcase ${i + 1} requires a selected Category.`);
        return;
      }
    }

    setIsSaving(true);

    try {
      const res = await saveHomepageConfigAction({
        promoTicker,
        heroSlides,
        categoryShowcases,
      });

      if (res.success) {
        addToast("success", "Homepage Updated", "Homepage UI configuration saved successfully!");
        router.refresh();
      } else {
        addToast("error", "Save Failed", res.error || "Failed to update homepage settings.");
      }
    } catch (err: any) {
      addToast("error", "Error", err.message || "An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2 font-mono">
            <Sliders className="w-6 h-6 text-pink-400" />
            Homepage Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Redesign & customize homepage promotional ticker, hero slider, and category showcases in real-time.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shrink-0 font-mono"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Saving..." : "Save All Changes"}</span>
        </button>
      </div>

      {/* 1. Promotional Ticker */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          1. Top Promotional Announcement Ticker
        </h2>
        <p className="text-xs text-slate-400">
          This promotional text continuously moves horizontally in an infinite seamless loop at the top of the homepage.
        </p>

        <div>
          <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Ticker Announcement Text
          </label>
          <textarea
            rows={2}
            value={promoTicker}
            onChange={(e) => setPromoTicker(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
            placeholder="🎁 BUY ANY 2 PRODUCTS & GET 1 PREMIUM GOGGLE FREE • FREE SHIPPING • CASH ON DELIVERY • SHOP NOW"
          />
        </div>
      </section>

      {/* 2. Full-Width Hero Slider */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            2. Hero Image Slider (Exactly 3 Slides)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Desktop & Mobile images are independently uploadable. You can pick from previously uploaded images or upload new ones.
          </p>
        </div>

        <div className="space-y-6">
          {heroSlides.map((slide, idx) => (
            <div
              key={slide.id || idx}
              className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-mono text-sm font-bold text-amber-400">
                  Hero Slide {idx + 1}
                </span>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={slide.isActive}
                      onChange={(e) => handleSlideChange(idx, "isActive", e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Active Slide</span>
                  </label>
                </div>
              </div>

              {/* Images Grid: Desktop & Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Desktop Image */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase">
                    Desktop Image URL (Required)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={slide.desktopImage}
                      onChange={(e) => handleSlideChange(idx, "desktopImage", e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                    />

                    <button
                      type="button"
                      onClick={() => setActiveMediaTarget({ type: "slideDesktop", index: idx })}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-400/30 hover:border-amber-400 rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 font-mono"
                      title="Select from previously uploaded media library"
                    >
                      <FileImage className="w-3.5 h-3.5" />
                      <span>Library</span>
                    </button>

                    <CldUploadButton
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
                      onSuccess={(res: any) => {
                        if (res?.info?.secure_url) {
                          handleSlideChange(idx, "desktopImage", res.info.secure_url);
                        }
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 font-mono"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </CldUploadButton>
                  </div>
                  {slide.desktopImage && (
                    <div className="relative h-24 rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                      <img src={slide.desktopImage} alt="Desktop Preview" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono">Desktop Preview</span>
                    </div>
                  )}
                </div>

                {/* Mobile Image */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase">
                    Mobile Image URL (Optional - Fallback to Desktop)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={slide.mobileImage}
                      onChange={(e) => handleSlideChange(idx, "mobileImage", e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                    />

                    <button
                      type="button"
                      onClick={() => setActiveMediaTarget({ type: "slideMobile", index: idx })}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-400/30 hover:border-amber-400 rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 font-mono"
                      title="Select from previously uploaded media library"
                    >
                      <FileImage className="w-3.5 h-3.5" />
                      <span>Library</span>
                    </button>

                    <CldUploadButton
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
                      onSuccess={(res: any) => {
                        if (res?.info?.secure_url) {
                          handleSlideChange(idx, "mobileImage", res.info.secure_url);
                        }
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 font-mono"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </CldUploadButton>
                  </div>
                  {slide.mobileImage && (
                    <div className="relative h-24 rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                      <img src={slide.mobileImage} alt="Mobile Preview" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono">Mobile Preview</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 uppercase mb-1">
                    Heading Title
                  </label>
                  <input
                    type="text"
                    value={slide.title || ""}
                    onChange={(e) => handleSlideChange(idx, "title", e.target.value)}
                    placeholder="e.g. NEXT-GEN INDUSTRIAL AUTOMATION"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 uppercase mb-1">
                    Subtitle Description
                  </label>
                  <input
                    type="text"
                    value={slide.subtitle || ""}
                    onChange={(e) => handleSlideChange(idx, "subtitle", e.target.value)}
                    placeholder="e.g. Precision PLCs, VFDs & Sensors"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 uppercase mb-1">
                    CTA Button Label
                  </label>
                  <input
                    type="text"
                    value={slide.ctaText || ""}
                    onChange={(e) => handleSlideChange(idx, "ctaText", e.target.value)}
                    placeholder="e.g. Explore Catalog"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 uppercase mb-1">
                    CTA Button Target Link
                  </label>
                  <input
                    type="text"
                    value={slide.ctaUrl || ""}
                    onChange={(e) => handleSlideChange(idx, "ctaUrl", e.target.value)}
                    placeholder="e.g. /products"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Homepage Category Showcase Sections */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            3. Homepage Category Showcase Sections (Select 3 Categories)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose 3 categories from your PostgreSQL catalog. Products from each category will dynamically render in horizontal carousels on the homepage.
          </p>
        </div>

        <div className="space-y-6">
          {categoryShowcases.map((showcase, idx) => (
            <div
              key={showcase.id || idx}
              className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-mono text-sm font-bold text-emerald-400">
                  Category Showcase Section {idx + 1}
                </span>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={showcase.isActive}
                    onChange={(e) => handleShowcaseChange(idx, "isActive", e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Active Section</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select Category Dropdown */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-2">
                    Select Database Category
                  </label>
                  <select
                    value={showcase.categoryId}
                    onChange={(e) => handleShowcaseChange(idx, "categoryId", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.slug})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Hero Cover Image */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase">
                    Category Hero Banner Image
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={showcase.heroImage || ""}
                      onChange={(e) => handleShowcaseChange(idx, "heroImage", e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                    />

                    <button
                      type="button"
                      onClick={() => setActiveMediaTarget({ type: "showcaseHero", index: idx })}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-400/30 hover:border-amber-400 rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 font-mono"
                      title="Select from previously uploaded media library"
                    >
                      <FileImage className="w-3.5 h-3.5" />
                      <span>Library</span>
                    </button>

                    <CldUploadButton
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
                      onSuccess={(res: any) => {
                        if (res?.info?.secure_url) {
                          handleShowcaseChange(idx, "heroImage", res.info.secure_url);
                        }
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 font-mono"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </CldUploadButton>
                  </div>
                  {showcase.heroImage && (
                    <div className="relative h-20 rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                      <img src={showcase.heroImage} alt="Category Banner Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 font-mono"
        >
          <Save className="w-5 h-5" />
          <span>{isSaving ? "Saving Settings..." : "Save All Homepage Settings"}</span>
        </button>
      </div>

      {/* Media Library Picker Modal */}
      <MediaLibraryModal
        isOpen={Boolean(activeMediaTarget)}
        onClose={() => setActiveMediaTarget(null)}
        onSelectImage={handleSelectMediaImage}
      />
    </form>
  );
}
