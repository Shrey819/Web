"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema, type ProductFormValues } from "@/lib/validations/product";
import { createProduct, updateProduct, deleteProduct } from "@/app/actions/product";
import { useToastStore } from "@/store/useToastStore";
import { useAdminThemeStore } from "@/store/useAdminThemeStore";
import { 
  Save, Trash2, ArrowLeft, Loader2, Image as ImageIcon, 
  FileText, Tag, DollarSign, Plus, Sparkles, HelpCircle, 
  Bold, Italic, Underline, Link as LinkIcon, List, ListOrdered,
  Layers, Package, Check, ChevronRight, X, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { CldUploadButton } from "next-cloudinary";
import { createCategory } from "@/app/actions/category";

interface ProductEditorFormProps {
  initialData?: Partial<ProductFormValues> & { id?: string; categoryIds?: string[]; ribbon?: string; costPrice?: number; isFeatured?: boolean; showInPos?: boolean };
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  isEdit?: boolean;
}

export function ProductEditorForm({ initialData, categories, brands, isEdit = false }: ProductEditorFormProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const { theme } = useAdminThemeStore();
  const isLight = theme === "light";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Multi-Category state & inline category creation
  const [categoryList, setCategoryList] = useState<{ id: string; name: string }[]>(categories);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() => {
    const initial = (initialData as any)?.categoryIds || (initialData?.categoryId ? [initialData.categoryId] : []);
    return initial.length > 0 ? initial : [categories[0]?.id || "cat_sensors"];
  });

  const [showInlineNewCat, setShowInlineNewCat] = useState(false);
  const [inlineCatName, setInlineCatName] = useState("");
  const [isCreatingInlineCat, setIsCreatingInlineCat] = useState(false);

  // Toggles matching Wix
  const [showInOnlineStore, setShowInOnlineStore] = useState(initialData?.status !== "DRAFT");
  const [showInPos, setShowInPos] = useState(Boolean(initialData?.showInPos ?? true));
  const [showPricePerUnit, setShowPricePerUnit] = useState(false);
  const [ribbonText, setRibbonText] = useState((initialData as any)?.ribbon || "");

  const defaultValues: Partial<ProductFormValues> = {
    name: initialData?.name || "",
    description: initialData?.description || "",
    categoryId: initialData?.categoryId || (categories[0]?.id || ""),
    categoryIds: selectedCategoryIds,
    basePrice: initialData?.basePrice ? initialData.basePrice / 100 : 0,
    compareAtPrice: initialData?.compareAtPrice ? initialData.compareAtPrice / 100 : null,
    status: initialData?.status || "ACTIVE",
    images: initialData?.images || [],
    brandId: initialData?.brandId || (brands[0]?.id || "default-brand"),
    unit: "PIECE",
    packSize: 1,
    minOrderQuantity: 1,
    stockQuantity: initialData?.stockQuantity || 100,
    gstRate: 18.0,
  };

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors }
  } = useForm<ProductFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productFormSchema) as any,
    defaultValues
  });

  const formValues = watch();
  const productName = watch("name") || "";
  const basePrice = Number(watch("basePrice") || 0);
  const compareAtPrice = Number(watch("compareAtPrice") || 0);

  const handleToggleCategory = (catId: string) => {
    let updated: string[];
    if (selectedCategoryIds.includes(catId)) {
      if (selectedCategoryIds.length === 1) {
        addToast("warning", "Category Required", "A product must belong to at least 1 category.");
        return;
      }
      updated = selectedCategoryIds.filter(id => id !== catId);
    } else {
      updated = [...selectedCategoryIds, catId];
    }
    setSelectedCategoryIds(updated);
    setValue("categoryId", updated[0]);
    setValue("categoryIds", updated, { shouldDirty: true });
  };

  const handleCreateInlineCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineCatName.trim()) return;

    setIsCreatingInlineCat(true);
    try {
      const res = await createCategory(inlineCatName.trim());
      if (res.success) {
        const newCat = { id: "cat_" + Date.now(), name: inlineCatName.trim() };
        addToast("success", "Category Created", `Category "${inlineCatName.trim()}" added!`);
        setCategoryList(prev => [...prev, newCat]);
        const updated = [...selectedCategoryIds, newCat.id];
        setSelectedCategoryIds(updated);
        setValue("categoryId", updated[0]);
        setValue("categoryIds", updated, { shouldDirty: true });
        setInlineCatName("");
        setShowInlineNewCat(false);
        router.refresh();
      } else {
        addToast("error", "Failed", res.error || "Could not create category.");
      }
    } finally {
      setIsCreatingInlineCat(false);
    }
  };

  const handleGenerateAiText = () => {
    if (!productName.trim()) {
      addToast("warning", "Enter Product Name", "Please enter a product title first to generate AI description.");
      return;
    }
    setIsGeneratingAi(true);
    setTimeout(() => {
      const generated = `High-performance industrial ${productName.trim()} engineered for demanding automation, manufacturing, and process control applications. Features heavy-duty construction, high operational reliability, fast response time, and standardized mounting interfaces. Fully compliant with international industrial safety and quality standards.`;
      setValue("description", generated, { shouldDirty: true });
      setIsGeneratingAi(false);
      addToast("success", "AI Description Generated", "Generated professional product specification description.");
    }, 600);
  };

  const handleFormatText = (prefix: string, suffix: string = "") => {
    const current = getValues("description") || "";
    setValue("description", `${current}\n${prefix}Feature Highlight${suffix}`, { shouldDirty: true });
  };

  const handleSaveProduct = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    
    // Convert Rupees input to Paise for backend database storage
    const payload: ProductFormValues = {
      ...data,
      status: showInOnlineStore ? "ACTIVE" : "DRAFT",
      basePrice: Math.round(Number(data.basePrice || 0) * 100),
      compareAtPrice: data.compareAtPrice ? Math.round(Number(data.compareAtPrice) * 100) : null,
      categoryId: selectedCategoryIds[0] || (categories[0]?.id || "cat_sensors"),
      categoryIds: selectedCategoryIds,
      brandId: data.brandId || "default-brand",
    };

    try {
      if (isEdit && initialData?.id) {
        const res = await updateProduct(initialData.id, payload);
        if (res.success) {
          addToast("success", "Product Saved", "Product updated successfully.");
          router.push("/admin/products");
          router.refresh();
        } else {
          addToast("error", "Update Failed", res.error || "Could not save product changes.");
        }
      } else {
        const res = await createProduct(payload);
        if (res.success) {
          addToast("success", "Product Created", "Product uploaded successfully.");
          router.push("/admin/products");
          router.refresh();
        } else {
          addToast("error", "Creation Failed", res.error || "Could not create product.");
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      addToast("error", "Error", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!confirm("Are you sure you want to delete this product?")) return;
    setIsSubmitting(true);
    try {
      const res = await deleteProduct(initialData.id);
      if (res.success) {
        addToast("info", "Product Deleted", "Product removed.");
        router.push("/admin/products");
        router.refresh();
      } else {
        addToast("error", "Delete Failed", res.error || "Could not delete product.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCldImageUpload = (result: unknown) => {
    const resObj = result as { event?: string; info?: { secure_url?: string } };
    if (resObj && resObj.event === "success" && resObj.info?.secure_url) {
      const currentImages = getValues("images") || [];
      const newImage = {
        url: resObj.info.secure_url,
        altText: getValues("name") || "Product Image",
        caption: "",
        isPrimary: currentImages.length === 0,
        sortOrder: currentImages.length
      };
      const updatedImages = [...currentImages, newImage];
      setValue("images", updatedImages, { shouldDirty: true });
      addToast("success", "Image Uploaded", "Image added to product.");
    }
  };

  const handleAddCustomImageUrl = () => {
    if (!customImageUrl.trim()) return;
    const currentImages = getValues("images") || [];
    const newImage = {
      url: customImageUrl.trim(),
      altText: getValues("name") || "Product Image",
      caption: "",
      isPrimary: currentImages.length === 0,
      sortOrder: currentImages.length
    };
    const updatedImages = [...currentImages, newImage];
    setValue("images", updatedImages, { shouldDirty: true });
    setCustomImageUrl("");
    addToast("success", "Image Added", "Image URL added.");
  };

  return (
    <form onSubmit={handleSubmit(handleSaveProduct)} className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* 1. Wix Style Top Action Bar */}
      <div className={`sticky top-0 z-30 py-3 px-6 rounded-2xl border flex items-center justify-between gap-4 backdrop-blur-md transition-all shadow-sm ${
        isLight 
          ? "bg-white/90 border-slate-200" 
          : "bg-slate-900/90 border-slate-800"
      }`}>
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Link
            href="/admin/products"
            className={`transition-colors ${
              isLight ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-white"
            }`}
          >
            Products
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className={`font-bold truncate max-w-[200px] sm:max-w-xs ${
            isLight ? "text-slate-900" : "text-white"
          }`}>
            {productName || (isEdit ? "Edit Product" : "New Product")}
          </span>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className={`p-2 rounded-full border transition-colors ${
                isLight 
                  ? "border-slate-200 text-rose-600 hover:bg-rose-50" 
                  : "border-slate-800 text-rose-400 hover:bg-rose-500/10"
              }`}
              title="Delete Product"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <Link
            href="/admin/products"
            className={`px-5 py-2 text-xs font-bold rounded-full border transition-colors ${
              isLight
                ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
            }`}
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-7 py-2 text-xs font-bold rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isEdit ? "Save Changes" : "Save"}</span>
          </button>
        </div>
      </div>

      {/* 2. Wix Two-Column Layout (Left 68%, Right 32%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT MAIN COLUMN (8 cols) ================= */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* A. General Product Information Card */}
          <div className={`p-6 rounded-2xl border transition-all shadow-sm space-y-5 ${
            isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
          }`}>
            {/* Product Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold flex items-center gap-1.5 ${
                  isLight ? "text-slate-800" : "text-white"
                }`}>
                  <span>Name</span>
                  <span className="text-blue-600 font-bold">*</span>
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {productName.length}/120
                </span>
              </div>
              <input
                type="text"
                {...register("name")}
                placeholder="e.g. Omron Proximity Sensor E2E-X5ME1"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  isLight
                    ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600"
                    : "bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500"
                }`}
              />
              {errors.name && <p className="text-xs text-rose-500 font-medium">{errors.name.message}</p>}
            </div>

            {/* Description & Rich Text Formatting Toolbar */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold flex items-center gap-1.5 ${
                  isLight ? "text-slate-800" : "text-white"
                }`}>
                  <span>Description</span>
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                </label>

                {/* AI Text Generator CTA */}
                <button
                  type="button"
                  onClick={handleGenerateAiText}
                  disabled={isGeneratingAi}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingAi ? "Generating..." : "Generate AI Text"}</span>
                </button>
              </div>

              {/* Rich Text Toolbar (Wix Style) */}
              <div className={`rounded-xl border overflow-hidden ${
                isLight ? "border-slate-200" : "border-slate-800"
              }`}>
                <div className={`px-3 py-1.5 border-b flex items-center gap-1 text-xs ${
                  isLight ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-slate-950 border-slate-800 text-slate-400"
                }`}>
                  <button
                    type="button"
                    onClick={() => handleFormatText("**", "**")}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded font-bold"
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText("_", "_")}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded italic"
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText("<u>", "</u>")}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded underline"
                    title="Underline"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
                  <button
                    type="button"
                    onClick={() => handleFormatText("• ")}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                    title="Bullet list"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText("1. ")}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                    title="Numbered list"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText("[Link Text](", ")")}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                    title="Add link"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                <textarea
                  rows={6}
                  {...register("description")}
                  placeholder="Describe your product's industrial specifications, operational tolerances, and wiring..."
                  className={`w-full p-3 text-sm focus:outline-none leading-relaxed resize-y ${
                    isLight
                      ? "bg-white text-slate-900 placeholder-slate-400"
                      : "bg-slate-950 text-white placeholder-slate-500"
                  }`}
                />
              </div>
            </div>

            {/* Media / Product Images Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold flex items-center gap-1.5 ${
                  isLight ? "text-slate-800" : "text-white"
                }`}>
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Images & Media</span>
                </label>

                <CldUploadButton
                  signatureEndpoint="/api/cloudinary/sign"
                  onSuccess={handleCldImageUpload}
                  options={{ multiple: true, maxFiles: 10 }}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Upload Media
                </CldUploadButton>
              </div>

              {/* Direct URL input */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="Or paste direct image URL (https://...)"
                  className={`flex-1 px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isLight
                      ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                      : "bg-slate-950 border-slate-800 text-white placeholder-slate-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddCustomImageUrl}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                    isLight
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  }`}
                >
                  Add
                </button>
              </div>

              {/* Image Previews Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                {(formValues.images || []).map((img, idx) => (
                  <div
                    key={idx}
                    className={`relative group rounded-xl border overflow-hidden aspect-square flex items-center justify-center p-1.5 ${
                      isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.altText || "Product"}
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formValues.images?.filter((_, i) => i !== idx);
                        setValue("images", updated, { shouldDirty: true });
                      }}
                      className="absolute top-1 right-1 p-1 rounded-lg bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      title="Remove image"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* B. Pricing & Tax Card (Wix Pricing layout) */}
          <div className={`p-6 rounded-2xl border transition-all shadow-sm space-y-5 ${
            isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
          }`}>
            <div>
              <h3 className={`text-sm font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                Pricing
              </h3>
              <p className={`text-xs mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Set up the pricing details that are not managed per variant.
              </p>
            </div>

            {/* Price Per Unit Switch */}
            <div className="flex items-center gap-3 py-1">
              <button
                type="button"
                onClick={() => setShowPricePerUnit(!showPricePerUnit)}
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  showPricePerUnit ? "bg-blue-600" : isLight ? "bg-slate-300" : "bg-slate-700"
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  showPricePerUnit ? "translate-x-4" : "translate-x-0"
                }`} />
              </button>
              <span className={`text-xs font-semibold flex items-center gap-1 ${
                isLight ? "text-slate-700" : "text-slate-300"
              }`}>
                <span>Show price per unit</span>
                <HelpCircle className="w-3 h-3 text-slate-400" />
              </span>
            </div>

            {/* Pricing Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Selling Price */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold flex items-center gap-1 ${
                  isLight ? "text-slate-800" : "text-white"
                }`}>
                  <span>Price (Selling Price)</span>
                  <span className="text-blue-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    {...register("basePrice", { valueAsNumber: true })}
                    placeholder="400.00"
                    className={`w-full pl-7 pr-3 py-2 text-sm font-mono font-bold rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isLight
                        ? "bg-white border-slate-300 text-slate-900"
                        : "bg-slate-950 border-slate-800 text-white"
                    }`}
                  />
                </div>
                {errors.basePrice && <p className="text-xs text-rose-500">{errors.basePrice.message}</p>}
              </div>

              {/* Compare At Price (MRP) */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold flex items-center gap-1 ${
                  isLight ? "text-slate-700" : "text-slate-300"
                }`}>
                  <span>Compare-at Price (MRP)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    {...register("compareAtPrice", { valueAsNumber: true })}
                    placeholder="500.00"
                    className={`w-full pl-7 pr-3 py-2 text-sm font-mono rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isLight
                        ? "bg-white border-slate-300 text-slate-900"
                        : "bg-slate-950 border-slate-800 text-white"
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-400">Shows strikethrough original price</p>
              </div>
            </div>

            {/* Product Tax Group (GST) */}
            <div className="space-y-1.5 pt-2">
              <label className={`text-xs font-bold flex items-center gap-1 ${
                isLight ? "text-slate-800" : "text-white"
              }`}>
                <span>Product tax group</span>
                <HelpCircle className="w-3 h-3 text-slate-400" />
              </label>
              <select
                {...register("gstRate", { valueAsNumber: true })}
                className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                  isLight
                    ? "bg-white border-slate-300 text-slate-800"
                    : "bg-slate-950 border-slate-800 text-white"
                }`}
              >
                <option value={18.0}>Products (default standard 18% GST)</option>
                <option value={12.0}>Reduced Rate (12% GST)</option>
                <option value={5.0}>Concessional Rate (5% GST)</option>
                <option value={0.0}>Exempt / Zero Rated (0% GST)</option>
              </select>
            </div>
          </div>

          {/* C. Inventory & Warehouse Card */}
          <div className={`p-6 rounded-2xl border transition-all shadow-sm space-y-5 ${
            isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
          }`}>
            <div>
              <h3 className={`text-sm font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                Inventory & Specifications
              </h3>
              <p className={`text-xs mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Track stock availability and commercial identifiers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* SKU */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${isLight ? "text-slate-800" : "text-white"}`}>
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  {...register("sku")}
                  placeholder="e.g. OMR-E2E-X5ME1"
                  className={`w-full px-3 py-2 text-xs font-mono rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isLight
                      ? "bg-white border-slate-300 text-slate-900"
                      : "bg-slate-950 border-slate-800 text-white"
                  }`}
                />
              </div>

              {/* Stock Quantity */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${isLight ? "text-slate-800" : "text-white"}`}>
                  Stock In Hand
                </label>
                <input
                  type="number"
                  {...register("stockQuantity", { valueAsNumber: true })}
                  placeholder="100"
                  className={`w-full px-3 py-2 text-xs font-mono rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isLight
                      ? "bg-white border-slate-300 text-slate-900"
                      : "bg-slate-950 border-slate-800 text-white"
                  }`}
                />
              </div>

              {/* Unit of Measurement */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${isLight ? "text-slate-800" : "text-white"}`}>
                  Unit of Measure
                </label>
                <select
                  {...register("unit")}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                    isLight
                      ? "bg-white border-slate-300 text-slate-800"
                      : "bg-slate-950 border-slate-800 text-white"
                  }`}
                >
                  <option value="PIECE">PIECE (Pcs)</option>
                  <option value="SET">SET</option>
                  <option value="PACK">PACK</option>
                  <option value="METER">METER</option>
                  <option value="KG">KG</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* ================= RIGHT SIDEBAR COLUMN (4 cols) ================= */}
        <div className="lg:col-span-4 space-y-6">

          {/* 1. Visibility & Channels Card (Wix Style) */}
          <div className={`p-5 rounded-2xl border transition-all shadow-sm space-y-4 ${
            isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                Show in online store
              </span>
              <button
                type="button"
                onClick={() => setShowInOnlineStore(!showInOnlineStore)}
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  showInOnlineStore ? "bg-blue-600" : isLight ? "bg-slate-300" : "bg-slate-700"
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  showInOnlineStore ? "translate-x-4" : "translate-x-0"
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className={`text-xs font-semibold ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                Show in Point of Sale
              </span>
              <button
                type="button"
                onClick={() => setShowInPos(!showInPos)}
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  showInPos ? "bg-blue-600" : isLight ? "bg-slate-300" : "bg-slate-700"
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  showInPos ? "translate-x-4" : "translate-x-0"
                }`} />
              </button>
            </div>
          </div>

          {/* 2. Categories Card with + Assign button (Wix Style) */}
          <div className={`p-5 rounded-2xl border transition-all shadow-sm space-y-4 ${
            isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                Categories
              </h3>
              <button
                type="button"
                onClick={() => setShowInlineNewCat(!showInlineNewCat)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Assign
              </button>
            </div>

            {/* Inline New Category Creator */}
            {showInlineNewCat && (
              <div className={`p-3 rounded-xl border space-y-2 animate-in fade-in ${
                isLight ? "bg-slate-50 border-blue-200" : "bg-slate-950 border-blue-500/30"
              }`}>
                <input
                  type="text"
                  value={inlineCatName}
                  onChange={(e) => setInlineCatName(e.target.value)}
                  placeholder="New category name..."
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isLight
                      ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                      : "bg-slate-900 border-slate-800 text-white placeholder-slate-500"
                  }`}
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowInlineNewCat(false)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateInlineCategory}
                    disabled={isCreatingInlineCat}
                    className="px-3 py-1 text-[11px] font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  >
                    {isCreatingInlineCat ? "Creating..." : "Save"}
                  </button>
                </div>
              </div>
            )}

            {/* Category Checkbox List */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {categoryList.map((cat) => {
                const isSelected = selectedCategoryIds.includes(cat.id);
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => handleToggleCategory(cat.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                      isSelected
                        ? isLight ? "bg-blue-50/80 text-blue-900 font-bold" : "bg-blue-950/40 text-blue-300 font-bold"
                        : isLight ? "hover:bg-slate-50 text-slate-700" : "hover:bg-slate-800 text-slate-400"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                      isSelected 
                        ? "bg-blue-600 border-blue-600 text-white" 
                        : isLight ? "border-slate-300 bg-white" : "border-slate-700 bg-slate-950"
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Ribbons & Badges Card (Wix Style) */}
          <div className={`p-5 rounded-2xl border transition-all shadow-sm space-y-4 ${
            isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
          }`}>
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${
                isLight ? "text-slate-900" : "text-white"
              }`}>
                <span>Ribbons</span>
                <HelpCircle className="w-3 h-3 text-slate-400" />
              </label>
              <button
                type="button"
                onClick={() => setRibbonText("")}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={ribbonText}
                onChange={(e) => setRibbonText(e.target.value)}
                placeholder="Enter text to add new (e.g. BESTSELLER)"
                className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  isLight
                    ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    : "bg-slate-950 border-slate-800 text-white placeholder-slate-500"
                }`}
              />

              {/* Quick Ribbon Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["NEW", "HOT", "SALE", "BESTSELLER", "20% OFF"].map((chip) => (
                  <button
                    type="button"
                    key={chip}
                    onClick={() => setRibbonText(chip)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                      ribbonText === chip
                        ? "bg-blue-600 text-white border-blue-600"
                        : isLight 
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200" 
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Brand & Manufacturer Card */}
          <div className={`p-5 rounded-2xl border transition-all shadow-sm space-y-4 ${
            isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
          }`}>
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${
                isLight ? "text-slate-900" : "text-white"
              }`}>
                <span>Brand</span>
                <HelpCircle className="w-3 h-3 text-slate-400" />
              </label>
            </div>

            <select
              {...register("brandId")}
              className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                isLight
                  ? "bg-white border-slate-300 text-slate-800"
                  : "bg-slate-950 border-slate-800 text-white"
              }`}
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>
    </form>
  );
}
