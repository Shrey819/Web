"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema, type ProductFormValues } from "@/lib/validations/product";
import { createProduct, updateProduct, deleteProduct } from "@/app/actions/product";
import { useToastStore } from "@/store/useToastStore";
import { 
  Save, Trash2, ArrowLeft, Loader2, Image as ImageIcon, 
  FileText, Tag, DollarSign, Plus
} from "lucide-react";
import Link from "next/link";
import { CldUploadButton } from "next-cloudinary";

interface ProductEditorFormProps {
  initialData?: Partial<ProductFormValues> & { id?: string };
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  isEdit?: boolean;
}

export function ProductEditorForm({ initialData, categories, isEdit = false }: ProductEditorFormProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState("");

  const defaultValues: Partial<ProductFormValues> = {
    name: initialData?.name || "",
    description: initialData?.description || "",
    categoryId: initialData?.categoryId || (categories[0]?.id || ""),
    basePrice: initialData?.basePrice ? initialData.basePrice / 100 : 0,
    compareAtPrice: initialData?.compareAtPrice ? initialData.compareAtPrice / 100 : null,
    status: initialData?.status || "ACTIVE",
    images: initialData?.images || [],
    brandId: initialData?.brandId || "default-brand",
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

  const handleSaveProduct = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    
    // Convert Rupees input to Paise for backend database storage
    const payload: ProductFormValues = {
      ...data,
      status: "ACTIVE",
      basePrice: Math.round(Number(data.basePrice || 0) * 100),
      compareAtPrice: data.compareAtPrice ? Math.round(Number(data.compareAtPrice) * 100) : null,
      categoryId: data.categoryId || (categories[0]?.id || "cat_sensors"),
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
    <form onSubmit={handleSubmit(handleSaveProduct)} className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">
              {isEdit ? "Edit Product" : "Upload Product"}
            </h1>
            <p className="text-xs text-slate-400">
              Single continuous upload form
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="p-2.5 text-xs font-semibold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all disabled:opacity-50"
              title="Delete Product"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? "Update Product" : "Publish Product"}
          </button>
        </div>
      </div>

      {/* Continuous Single Page Form Card */}
      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-8">
        
        {/* 1. Product Name */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            Product Name *
          </label>
          <input
            type="text"
            {...register("name")}
            placeholder="e.g. Omron Proximity Sensor E2E-X5ME1"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-base"
          />
          {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
        </div>

        {/* 2. Category Dropdown */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-400" />
            Category *
          </label>
          <select
            {...register("categoryId")}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-medium focus:outline-none focus:border-blue-500"
          >
            {categories.length === 0 ? (
              <option value="cat_sensors">General Catalog</option>
            ) : (
              categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))
            )}
          </select>
          {errors.categoryId && <p className="text-xs text-rose-400">{errors.categoryId.message}</p>}
        </div>

        {/* 3. Pricing Section: Current Price & Original Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Current Selling Price (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                {...register("basePrice", { valueAsNumber: true })}
                placeholder="4500"
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-base font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
            {errors.basePrice && <p className="text-xs text-rose-400">{errors.basePrice.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-400" />
              Original Price / MRP (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                {...register("compareAtPrice", { valueAsNumber: true })}
                placeholder="5500"
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-base focus:outline-none focus:border-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-500">Strikethrough MRP price for showing discounts</p>
          </div>
        </div>

        {/* 4. Description */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            Description
          </label>
          <textarea
            rows={5}
            {...register("description")}
            placeholder="Enter product features, specifications, and details..."
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm leading-relaxed"
          />
        </div>

        {/* 5. Product Image Upload */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <label className="block text-sm font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              Product Image
            </label>
            <CldUploadButton
              signatureEndpoint="/api/cloudinary/sign"
              onSuccess={handleCldImageUpload}
              options={{ multiple: true, maxFiles: 10 }}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Upload Image
            </CldUploadButton>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
              placeholder="Or paste direct image URL (e.g. https://...)"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddCustomImageUrl}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
            >
              Add URL
            </button>
          </div>

          {/* Image Previews */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {(formValues.images || []).map((img, idx) => (
              <div key={idx} className="relative group rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                <img src={img.url} alt={img.altText || "Product"} className="w-full h-32 object-contain p-2" />
                <button
                  type="button"
                  onClick={() => {
                    const updated = formValues.images?.filter((_, i) => i !== idx);
                    setValue("images", updated, { shouldDirty: true });
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600 text-white opacity-80 hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-6 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? "Update Product" : "Publish Product"}
          </button>
        </div>

      </div>
    </form>
  );
}
