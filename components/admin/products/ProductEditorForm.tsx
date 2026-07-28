"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema, type ProductFormValues } from "@/lib/validations/product";
import { createProduct, updateProduct, duplicateProduct, archiveProduct, deleteProduct } from "@/app/actions/product";
import { useToastStore } from "@/store/useToastStore";
import { 
  Save, Copy, Archive, Trash2, ArrowLeft, Loader2, Image as ImageIcon, 
  FileText, ShieldCheck, Tag, Box, DollarSign, Search, Layers
} from "lucide-react";
import Link from "next/link";
import { CldUploadButton } from "next-cloudinary";

interface ProductEditorFormProps {
  initialData?: Partial<ProductFormValues> & { id?: string };
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  isEdit?: boolean;
}

type TabType = "basic" | "media" | "pricing" | "inventory" | "shipping" | "specs" | "docs" | "seo";

export function ProductEditorForm({ initialData, categories, brands, isEdit = false }: ProductEditorFormProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState("");

  const defaultValues: Partial<ProductFormValues> = {
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    sku: initialData?.sku || "",
    productCode: initialData?.productCode || "",
    barcode: initialData?.barcode || "",
    mpn: initialData?.mpn || "",
    manufacturer: initialData?.manufacturer || "",
    shortDescription: initialData?.shortDescription || "",
    description: initialData?.description || "",
    categoryId: initialData?.categoryId || (categories[0]?.id || "sensors"),
    brandId: initialData?.brandId || (brands[0]?.id || "default-brand"),
    status: initialData?.status || "DRAFT",
    featured: initialData?.featured || false,
    bestSeller: initialData?.bestSeller || false,
    newArrival: initialData?.newArrival || false,
    quoteOnly: initialData?.quoteOnly || false,
    basePrice: initialData?.basePrice || 0,
    salePrice: initialData?.salePrice || null,
    compareAtPrice: initialData?.compareAtPrice || null,
    costPrice: initialData?.costPrice || null,
    gstRate: initialData?.gstRate || 18.0,
    priceIncTax: initialData?.priceIncTax || false,
    stockQuantity: initialData?.stockQuantity || 100,
    lowStockThreshold: initialData?.lowStockThreshold || 10,
    isPhysical: initialData?.isPhysical ?? true,
    weight: initialData?.weight || 0.5,
    seoTitle: initialData?.seoTitle || "",
    seoDesc: initialData?.seoDesc || "",
    images: initialData?.images || [],
    documents: initialData?.documents || [],
    specifications: initialData?.specifications || [
      { groupName: "General Specs", name: "Operating Voltage", value: "24 V DC", unit: "", sortOrder: 0 },
      { groupName: "General Specs", name: "IP Rating", value: "IP67", unit: "", sortOrder: 1 }
    ],
    variants: initialData?.variants || []
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<ProductFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productFormSchema) as any,
    defaultValues
  });

  const formValues = watch();

  const handleSaveProduct = async (data: ProductFormValues, targetStatus?: "DRAFT" | "ACTIVE") => {
    setIsSubmitting(true);
    if (targetStatus) {
      setValue("status", targetStatus);
      data.status = targetStatus;
    }

    try {
      if (isEdit && initialData?.id) {
        const res = await updateProduct(initialData.id, data);
        if (res.success) {
          addToast("success", "Product Saved", "Product information updated successfully.");
          router.refresh();
        } else {
          addToast("error", "Update Failed", res.error || "Could not save product changes.");
        }
      } else {
        const res = await createProduct(data);
        if (res.success) {
          addToast("success", "Product Created", `Product created with code ${res.productCode}`);
          router.push(`/admin/products/${res.id}/edit`);
        } else {
          addToast("error", "Creation Failed", res.error || "Could not create product.");
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      addToast("error", "Error", message);
    } finally {
      setIsSubmitting(false);
      setActiveAction(null);
    }
  };

  const handleDuplicate = async () => {
    if (!initialData?.id) return;
    setIsSubmitting(true);
    setActiveAction("duplicate");
    try {
      const res = await duplicateProduct(initialData.id);
      if (res.success) {
        addToast("success", "Product Duplicated", "New draft copy created successfully.");
        router.push(`/admin/products/${res.id}/edit`);
      } else {
        addToast("error", "Duplicate Failed", res.error || "Could not duplicate product.");
      }
    } finally {
      setIsSubmitting(false);
      setActiveAction(null);
    }
  };

  const handleArchive = async () => {
    if (!initialData?.id) return;
    if (!confirm("Are you sure you want to archive this product? It will be hidden from the storefront.")) return;
    setIsSubmitting(true);
    setActiveAction("archive");
    try {
      const res = await archiveProduct(initialData.id);
      if (res.success) {
        addToast("warning", "Product Archived", "Product status changed to ARCHIVED.");
        router.push("/admin/products");
      } else {
        addToast("error", "Archive Failed", res.error || "Could not archive product.");
      }
    } finally {
      setIsSubmitting(false);
      setActiveAction(null);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!confirm("Are you sure you want to permanently delete this product? This action cannot be undone.")) return;
    setIsSubmitting(true);
    setActiveAction("delete");
    try {
      const res = await deleteProduct(initialData.id);
      if (res.success) {
        addToast("info", "Product Deleted", "Product removed permanently.");
        router.push("/admin/products");
      } else {
        addToast("error", "Delete Failed", res.error || "Could not delete product.");
      }
    } finally {
      setIsSubmitting(false);
      setActiveAction(null);
    }
  };

  // Image Upload Handler
  const handleCldImageUpload = (result: unknown) => {
    const resObj = result as { event?: string; info?: { secure_url?: string } };
    if (resObj && resObj.event === "success" && resObj.info?.secure_url) {
      const newImage = {
        url: resObj.info.secure_url,
        altText: formValues.name || "Product Image",
        caption: "",
        isPrimary: (formValues.images || []).length === 0,
        sortOrder: (formValues.images || []).length
      };
      const updatedImages = [...(formValues.images || []), newImage];
      setValue("images", updatedImages, { shouldDirty: true });
      addToast("success", "Media Uploaded", "Image added to media gallery.");
    }
  };

  const handleAddCustomImageUrl = () => {
    if (!customImageUrl.trim()) return;
    const newImage = {
      url: customImageUrl.trim(),
      altText: formValues.name || "Product Image",
      caption: "",
      isPrimary: (formValues.images || []).length === 0,
      sortOrder: (formValues.images || []).length
    };
    const updatedImages = [...(formValues.images || []), newImage];
    setValue("images", updatedImages, { shouldDirty: true });
    setCustomImageUrl("");
    addToast("success", "Image Added", "Direct image URL added to media gallery.");
  };

  return (
    <form onSubmit={handleSubmit((data) => handleSaveProduct(data))} className="space-y-6">
      {/* Sticky Action Bar */}
      <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white truncate max-w-xs sm:max-w-md">
                {isEdit ? (formValues.name || "Edit Product") : "New Product"}
              </h1>
              {isDirty && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Unsaved Changes
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {isEdit ? `ID: ${initialData?.id}` : "Shopify/Wix Industrial Catalog Workflow"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEdit && (
            <>
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={isSubmitting}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {activeAction === "duplicate" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                Duplicate
              </button>
              <button
                type="button"
                onClick={handleArchive}
                disabled={isSubmitting}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Archive className="w-3.5 h-3.5" />
                Archive
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="p-2 text-xs font-semibold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all disabled:opacity-50"
                title="Delete Product"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleSubmit((data) => handleSaveProduct(data, "DRAFT"))}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-all disabled:opacity-50"
          >
            Save Draft
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            onClick={() => setValue("status", "ACTIVE")}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? "Update & Publish" : "Publish Product"}
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Primary Form Panel */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
            {[
              { id: "basic" as TabType, label: "Basic Info", icon: FileText },
              { id: "media" as TabType, label: "Media Gallery", icon: ImageIcon },
              { id: "pricing" as TabType, label: "Pricing & Tax", icon: DollarSign },
              { id: "inventory" as TabType, label: "Inventory", icon: Box },
              { id: "shipping" as TabType, label: "Shipping", icon: Layers },
              { id: "specs" as TabType, label: "Specifications", icon: Tag },
              { id: "docs" as TabType, label: "Industrial Docs", icon: ShieldCheck },
              { id: "seo" as TabType, label: "SEO & Social", icon: Search },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: BASIC INFO */}
          {activeTab === "basic" && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" /> Basic Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    {...register("name")}
                    placeholder="e.g. Omron E2E-X5ME1 Inductive Proximity Sensor 24V"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                  />
                  {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      SKU (Stock Keeping Unit) *
                    </label>
                    <input
                      type="text"
                      {...register("sku")}
                      placeholder="OMRON-E2E-X5ME1"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm uppercase font-mono"
                    />
                    {errors.sku && <p className="text-xs text-rose-400 mt-1">{errors.sku.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      {...register("slug")}
                      placeholder="omron-e2e-x5me1-sensor"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm font-mono text-slate-300"
                    />
                    {errors.slug && <p className="text-xs text-rose-400 mt-1">{errors.slug.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Short Summary / Subtitle
                  </label>
                  <input
                    type="text"
                    {...register("shortDescription")}
                    placeholder="High precision M12 inductive sensor with IP67 rating"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Full Description (HTML / Technical Details)
                  </label>
                  <textarea
                    rows={6}
                    {...register("description")}
                    placeholder="Detailed industrial component description, wiring diagrams, operational specifications..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEDIA GALLERY */}
          {activeTab === "media" && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-cyan-400" /> Media & Image Gallery
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Upload photos or paste direct CDN image links</p>
                </div>
                <div className="flex items-center gap-2">
                  <CldUploadButton
                    signatureEndpoint="/api/cloudinary/sign"
                    onSuccess={handleCldImageUpload}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all cursor-pointer"
                  >
                    + Cloudinary Upload
                  </CldUploadButton>
                </div>
              </div>

              {/* Direct URL Input */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Add Image via Direct URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or https://res.cloudinary.com/..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomImageUrl}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(formValues.images || []).map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                    <img src={img.url} alt={img.altText || "Product"} className="w-full h-32 object-contain p-2" />
                    {img.isPrimary && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-slate-950">
                        Primary
                      </span>
                    )}
                    <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all p-2">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formValues.images?.map((im, i) => ({ ...im, isPrimary: i === idx }));
                            setValue("images", updated, { shouldDirty: true });
                          }}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-blue-600 text-white"
                        >
                          Make Primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formValues.images?.filter((_, i) => i !== idx);
                          setValue("images", updated, { shouldDirty: true });
                        }}
                        className="p-1 rounded-lg bg-rose-600 text-white"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {(formValues.images || []).length === 0 && (
                  <div className="col-span-full p-8 rounded-2xl border-2 border-dashed border-slate-800 text-center">
                    <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No images uploaded yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PRICING & TAX */}
          {activeTab === "pricing" && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-cyan-400" /> Pricing & B2B Commercials
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Base Retail Price (₹ Paise) *
                  </label>
                  <input
                    type="number"
                    {...register("basePrice", { valueAsNumber: true })}
                    placeholder="450000 (i.e. ₹4,500.00)"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm"
                  />
                  {errors.basePrice && <p className="text-xs text-rose-400 mt-1">{errors.basePrice.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Sale Discounted Price (₹ Paise)
                  </label>
                  <input
                    type="number"
                    {...register("salePrice", { valueAsNumber: true })}
                    placeholder="399000"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Compare-at MRP Price (₹ Paise)
                  </label>
                  <input
                    type="number"
                    {...register("compareAtPrice", { valueAsNumber: true })}
                    placeholder="520000"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Cost Price per Unit (Internal Only)
                  </label>
                  <input
                    type="number"
                    {...register("costPrice", { valueAsNumber: true })}
                    placeholder="280000"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    GST Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...register("gstRate", { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="priceIncTax"
                    {...register("priceIncTax")}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                  />
                  <label htmlFor="priceIncTax" className="text-xs text-slate-300 font-medium">
                    Price includes GST / Tax
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INVENTORY */}
          {activeTab === "inventory" && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Box className="w-4 h-4 text-cyan-400" /> Stock & Warehouse Inventory
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    {...register("stockQuantity", { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    {...register("lowStockThreshold", { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Warehouse Location
                  </label>
                  <input
                    type="text"
                    {...register("warehouse")}
                    placeholder="Rack B4, Sector 2"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="allowBackorders"
                    {...register("allowBackorders")}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600"
                  />
                  <label htmlFor="allowBackorders" className="text-xs text-slate-300 font-medium">
                    Allow backorders when out of stock
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SPECIFICATIONS */}
          {activeTab === "specs" && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-cyan-400" /> Technical Specifications Table
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    const current = formValues.specifications || [];
                    setValue("specifications", [...current, { groupName: "Electrical", name: "Voltage", value: "24V", unit: "DC", sortOrder: current.length }], { shouldDirty: true });
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
                >
                  + Add Spec Row
                </button>
              </div>

              <div className="space-y-3">
                {(formValues.specifications || []).map((spec, idx) => (
                  <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <input
                      type="text"
                      value={spec.groupName}
                      onChange={(e) => {
                        const updated = [...(formValues.specifications || [])];
                        updated[idx].groupName = e.target.value;
                        setValue("specifications", updated, { shouldDirty: true });
                      }}
                      placeholder="Group (e.g. Electrical)"
                      className="w-full sm:w-1/4 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={spec.name}
                      onChange={(e) => {
                        const updated = [...(formValues.specifications || [])];
                        updated[idx].name = e.target.value;
                        setValue("specifications", updated, { shouldDirty: true });
                      }}
                      placeholder="Spec Name"
                      className="w-full sm:w-1/4 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => {
                        const updated = [...(formValues.specifications || [])];
                        updated[idx].value = e.target.value;
                        setValue("specifications", updated, { shouldDirty: true });
                      }}
                      placeholder="Value"
                      className="w-full sm:w-1/3 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formValues.specifications?.filter((_, i) => i !== idx);
                        setValue("specifications", updated, { shouldDirty: true });
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SEO */}
          {activeTab === "seo" && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" /> Search Engine Optimization (SEO)
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Meta Title ({formValues.seoTitle?.length || 0} / 60 chars)
                  </label>
                  <input
                    type="text"
                    {...register("seoTitle")}
                    placeholder="Omron Industrial Sensor | Official Distributor"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Meta Description ({formValues.seoDesc?.length || 0} / 160 chars)
                  </label>
                  <textarea
                    rows={3}
                    {...register("seoDesc")}
                    placeholder="Buy high-precision Omron E2E proximity sensors at factory prices. Fast shipping across India."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                  />
                </div>

                {/* Google Search Live Preview */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Result Preview</p>
                  <p className="text-sm font-semibold text-blue-400 truncate">{formValues.seoTitle || formValues.name || "Product Title"}</p>
                  <p className="text-xs text-emerald-400 font-mono">https://automationstore.com/product/{formValues.slug || "product-slug"}</p>
                  <p className="text-xs text-slate-400 line-clamp-2">{formValues.seoDesc || formValues.shortDescription || "No description provided."}</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Organization & Settings Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Status & Channel */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Product Status</h3>
            <select
              {...register("status")}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="DRAFT">DRAFT (Hidden)</option>
              <option value="ACTIVE">ACTIVE (Published)</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="OUT_OF_STOCK">OUT OF STOCK</option>
              <option value="DISCONTINUED">DISCONTINUED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          {/* Organization: Category & Brand */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Organization</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Category *</label>
              <select
                {...register("categoryId")}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Brand Partner</label>
              <select
                {...register("brandId")}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Badges & Flags */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Badges & Highlights</h3>
            {[
              { id: "featured", label: "Featured Product" },
              { id: "bestSeller", label: "Best Seller Highlight" },
              { id: "newArrival", label: "New Arrival Badge" },
              { id: "quoteOnly", label: "Quote Request Only (B2B)" },
            ].map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={item.id}
                  {...register(item.id as keyof ProductFormValues)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600"
                />
                <label htmlFor={item.id} className="text-xs text-slate-300 font-medium">
                  {item.label}
                </label>
              </div>
            ))}
          </div>

        </div>

      </div>
    </form>
  );
}
