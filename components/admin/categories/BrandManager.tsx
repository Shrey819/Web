"use client";

import { useState, useRef } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Building2,
  Loader2,
  Save,
  X,
  Package,
  ExternalLink,
  Search,
  Upload,
  Image as ImageIcon,
  Globe,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createBrand,
  updateBrand,
  deleteBrand,
  deleteBrandWithReassignment,
  getGlobalBrands,
  type BrandItem,
} from "@/app/actions/productManagement";
import { useToastStore } from "@/store/useToastStore";
import { BrandProductsModal } from "./BrandProductsModal";
import { DeleteBrandReassignModal } from "./DeleteBrandReassignModal";
import { UnbrandedProductsModal } from "./UnbrandedProductsModal";
import { BrandLogo } from "@/components/brands/BrandLogos";

interface BrandManagerProps {
  brands: BrandItem[];
  unbrandedCount?: number;
}

export function BrandManager({ brands: initialBrands, unbrandedCount: initialUnbrandedCount = 0 }: BrandManagerProps) {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [brands, setBrands] = useState<BrandItem[]>(initialBrands);
  const [unbrandedCount, setUnbrandedCount] = useState<number>(initialUnbrandedCount);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<BrandItem | null>(null);
  const [showUnbrandedModal, setShowUnbrandedModal] = useState(false);

  const refreshBrands = async () => {
    const res = await getGlobalBrands();
    if (res.success) {
      setBrands(res.brands);
      setUnbrandedCount(res.unbrandedCount);
    }
    router.refresh();
  };

  // Form Fields
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [country, setCountry] = useState("");
  const [tagline, setTagline] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [customLogoUrlInput, setCustomLogoUrlInput] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrandForProducts, setSelectedBrandForProducts] = useState<BrandItem | null>(null);

  const resetForm = () => {
    setName("");
    setLogo("");
    setCountry("");
    setTagline("");
    setWebsiteUrl("");
    setCustomLogoUrlInput("");
    setIsCreating(false);
    setEditingId(null);
  };

  const handleStartEdit = (b: BrandItem) => {
    setEditingId(b.id);
    setName(b.name);
    setLogo(b.logo || "");
    setCountry(b.country || "");
    setTagline(b.tagline || "");
    setWebsiteUrl(b.websiteUrl || "");
    setCustomLogoUrlInput("");
    setIsCreating(false);
  };

  // Direct file upload to /api/upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingLogo(true);
    const file = files[0];

    try {
      const formData = new FormData();
      formData.append("files", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.urls) && data.urls.length > 0) {
        setLogo(data.urls[0]);
        addToast("success", "Logo Uploaded", "Brand logo uploaded successfully.");
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: any) {
      console.warn("Direct upload failed, using local preview fallback:", err);
      // Fallback: convert to base64 Data URL so user is never blocked
      try {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setLogo(reader.result);
            addToast("info", "Logo Attached", "Loaded local logo preview.");
          }
        };
        reader.readAsDataURL(file);
      } catch {
        addToast("error", "Upload Error", err.message || "Failed to process logo file.");
      }
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleApplyLogoUrl = () => {
    const trimmed = customLogoUrlInput.trim();
    if (!trimmed) return;
    setLogo(trimmed);
    setCustomLogoUrlInput("");
    addToast("info", "Logo URL Applied", "Updated brand logo image URL.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        const oldBrand = brands.find((b) => b.id === editingId);
        const res = await updateBrand(
          editingId,
          trimmed,
          logo || null,
          country || null,
          tagline || null,
          websiteUrl || null,
          oldBrand?.name
        );
        if (res.success) {
          addToast("success", "Brand Updated", `Brand "${trimmed}" updated successfully.`);
          setBrands((prev) =>
            prev.map((b) =>
              b.id === editingId
                ? {
                    ...b,
                    name: trimmed,
                    slug: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    logo: logo || null,
                    country: country || null,
                    tagline: tagline || null,
                    websiteUrl: websiteUrl || null,
                  }
                : b
            )
          );
          resetForm();
          router.refresh();
        } else {
          addToast("error", "Update Failed", res.error || "Could not update brand.");
        }
      } else {
        const res = await createBrand(
          trimmed,
          logo || null,
          country || null,
          tagline || null,
          websiteUrl || null
        );
        if (res.success) {
          addToast("success", "Brand Created", `Brand "${trimmed}" created successfully.`);
          const newBrand: BrandItem = {
            id: res.id || `brand_${Date.now()}`,
            name: trimmed,
            slug: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            logo: logo || null,
            country: country || null,
            tagline: tagline || null,
            websiteUrl: websiteUrl || null,
            productCount: 0,
          };
          setBrands((prev) => [...prev, newBrand].sort((a, b) => a.name.localeCompare(b.name)));
          resetForm();
          router.refresh();
        } else {
          addToast("error", "Creation Failed", res.error || "Could not create brand.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (b: BrandItem) => {
    const prodCount = b.productCount || 0;
    if (prodCount > 0) {
      setDeletingBrand(b);
    } else {
      if (!confirm(`Are you sure you want to delete brand "${b.name}"?`)) return;

      setIsSubmitting(true);
      try {
        const res = await deleteBrandWithReassignment(b.id, null);
        if (res.success) {
          addToast("info", "Brand Deleted", `Brand "${b.name}" was removed.`);
          setBrands((prev) => prev.filter((item) => item.id !== b.id));
          refreshBrands();
        } else {
          addToast("error", "Delete Failed", res.error || "Could not delete brand.");
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const filteredBrands = brands.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      b.name.toLowerCase().includes(q) ||
      (b.slug && b.slug.toLowerCase().includes(q)) ||
      (b.country && b.country.toLowerCase().includes(q))
    );
  });

  const totalLinkedProducts = brands.reduce((sum, b) => sum + (b.productCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Brand Management</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-[#00a651] text-xs font-semibold border border-emerald-200 dark:border-emerald-500/20">
              {brands.length} Brands • {totalLinkedProducts} Products Linked
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage manufacturer brand logos, names, country of origin, and view linked storefront products.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isCreating && !editingId && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsCreating(true);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-[#00a651] dark:hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Brand</span>
            </button>
          )}
        </div>
      </div>

      {/* Non-Branded Products Banner / Manager */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Non-Branded Products</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/30">
                {unbrandedCount} Products
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Products without an assigned brand. Click to view, search, and assign them to any brand in bulk or individually.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowUnbrandedModal(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs"
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Manage Non-Branded Products</span>
        </button>
      </div>

      {/* Create / Edit Form Card with Logo Uploader */}
      {(isCreating || editingId) && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-5 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#00a651]" />
              <span>{editingId ? "Edit Brand Details & Logo" : "Create New Brand"}</span>
            </h2>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Brand Name */}
            <div>
              <label htmlFor="brand-name-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Brand Name *
              </label>
              <input
                id="brand-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., HIWIN, THK, Rexroth, Miki Pulley"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00a651] focus:ring-2 focus:ring-[#00a651]/20"
              />
              {editingId && (
                <p className="text-[11px] text-amber-600 mt-1">
                  Renaming this brand will automatically update all existing products currently assigned to this brand.
                </p>
              )}
            </div>

            {/* Country */}
            <div>
              <label htmlFor="brand-country-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Country of Origin (Optional)
              </label>
              <input
                id="brand-country-input"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g., Taiwan, Germany, Japan, India"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00a651] focus:ring-2 focus:ring-[#00a651]/20"
              />
            </div>
          </div>

          {/* Logo Upload Section */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#00a651]" />
              <span>Brand Logo (Shown on /brands and product pages)</span>
            </label>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Logo Preview or Upload Controls */}
            {logo ? (
              <div className="flex items-center gap-4 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="w-24 h-16 rounded-lg border border-slate-200 bg-white p-2 flex items-center justify-center overflow-hidden shrink-0">
                  <img src={logo} alt={name || "Brand logo"} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Logo active</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{logo.slice(0, 60)}...</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogo("")}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove logo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    disabled={isUploadingLogo}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-[#00a651] dark:hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs"
                  >
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Logo from Computer</span>
                      </>
                    )}
                  </button>

                  <span className="text-xs text-slate-400">or</span>

                  <div className="flex-1 flex gap-2 w-full">
                    <input
                      type="url"
                      value={customLogoUrlInput}
                      onChange={(e) => setCustomLogoUrlInput(e.target.value)}
                      placeholder="Paste image URL (https://...)"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00a651]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyLogoUrl}
                      disabled={!customLogoUrlInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-40 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Set URL
                    </button>
                  </div>
                </div>

                {/* Built-in Brand SVG Preview Notice */}
                <p className="text-[11px] text-slate-500">
                  Tip: If no image is uploaded, the system automatically uses a verified high-resolution SVG logo for recognized brands (HIWIN, Miki Pulley, Liming, K.H, STÖBER, Atlanta, Elesa+Ganter, Aadarsh, THK, Siemens, etc.).
                </p>
              </div>
            )}
          </div>

          {/* Tagline / Specialties */}
          <div>
            <label htmlFor="brand-tagline-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tagline / Product Specialties (Optional)
            </label>
            <input
              id="brand-tagline-input"
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g., Linear motion guideways, ballscrews & industrial positioning"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00a651] focus:ring-2 focus:ring-[#00a651]/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 text-xs font-semibold bg-[#00a651] hover:bg-emerald-600 disabled:bg-slate-400 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingId ? "Update Brand" : "Save Brand"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Brands Table & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Search Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search brands by name, country, or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a651]"
            />
          </div>
          <span className="text-xs text-slate-400">
            Showing {filteredBrands.length} of {brands.length} brands
          </span>
        </div>

        {filteredBrands.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No brands found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery ? `No brands matching "${searchQuery}".` : "No brands added yet. Click 'Add Brand' above."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50/75 dark:bg-slate-950/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3 w-16">Logo</th>
                  <th className="px-5 py-3">Brand Name</th>
                  <th className="px-5 py-3">Origin / Country</th>
                  <th className="px-5 py-3">Identifier / Slug</th>
                  <th className="px-5 py-3">Linked Products</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBrands.map((b) => {
                  const count = b.productCount || 0;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Logo Thumbnail Column */}
                      <td className="px-5 py-3.5">
                        <div className="w-12 h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                          <BrandLogo
                            name={b.name}
                            slug={b.slug || b.name}
                            logoUrl={b.logo}
                            size="sm"
                            className="max-h-8 max-w-10 object-contain"
                          />
                        </div>
                      </td>

                      {/* Brand Name */}
                      <td className="px-5 py-3.5">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-sm block">{b.name}</span>
                          {b.tagline && (
                            <span className="text-[11px] text-slate-400 block truncate max-w-xs">{b.tagline}</span>
                          )}
                        </div>
                      </td>

                      {/* Country */}
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                        {b.country ? (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Globe className="w-3 h-3 text-slate-400" />
                            <span>{b.country}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Slug */}
                      <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-slate-400">
                        {b.slug || b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                      </td>

                      {/* Linked Products Count (Clickable!) */}
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => setSelectedBrandForProducts(b)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors cursor-pointer"
                          title={`Click to view all ${count} products linked to ${b.name}`}
                        >
                          <Package className="w-3.5 h-3.5 text-blue-600" />
                          <span>{count} {count === 1 ? "Product" : "Products"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedBrandForProducts(b)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="View all linked products"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>View Products</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(b)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                            title="Edit Brand & Logo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(b)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Delete Brand"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Linked Products Modal */}
      {selectedBrandForProducts && (
        <BrandProductsModal
          brand={selectedBrandForProducts}
          brands={brands}
          onClose={() => setSelectedBrandForProducts(null)}
          onBrandsUpdated={refreshBrands}
        />
      )}

      {/* Delete Brand with Reassignment Modal */}
      {deletingBrand && (
        <DeleteBrandReassignModal
          brandToDelete={deletingBrand}
          brands={brands}
          onClose={() => setDeletingBrand(null)}
          onSuccess={refreshBrands}
        />
      )}

      {/* Non-Branded Products Management Modal */}
      {showUnbrandedModal && (
        <UnbrandedProductsModal
          brands={brands}
          onClose={() => setShowUnbrandedModal(false)}
          onBrandsUpdated={refreshBrands}
        />
      )}
    </div>
  );
}
