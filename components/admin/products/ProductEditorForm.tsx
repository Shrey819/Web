"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema, type ProductFormValues } from "@/lib/validations/product";
import { createProduct, updateProduct, deleteProduct } from "@/app/actions/product";
import { useToastStore } from "@/store/useToastStore";
import { generateCartesianVariants, type GeneratedVariant } from "@/lib/variantGenerator";
import {
  Save,
  Trash2,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Plus,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  List,
  ListOrdered,
  GripVertical,
  Flag,
  MoreHorizontal,
  Info,
  ExternalLink,
  HelpCircle,
  X,
  Palette,
  Check,
  Tag as TagIcon
} from "lucide-react";
import Link from "next/link";
import { CldUploadButton } from "next-cloudinary";

import { AssignCategoriesModal } from "./modals/AssignCategoriesModal";
import { ManageRibbonsModal } from "./modals/ManageRibbonsModal";
import { ManageTagsModal } from "./modals/ManageTagsModal";
import { EditInfoSectionModal } from "./modals/EditInfoSectionModal";
import { ManageGlobalOptionsModal } from "./modals/ManageGlobalOptionsModal";
import { AddProductOptionModal } from "./modals/AddProductOptionModal";
import { ProductMediaManagerModal } from "./modals/ProductMediaManagerModal";
import { WixRichTextEditor } from "./WixRichTextEditor";

interface CategoryItem {
  id: string;
  name: string;
  slug?: string;
  status?: string;
}

interface RibbonItem {
  id: string;
  name: string;
  color?: string;
}

interface TagItem {
  id: string;
  name: string;
}

interface InfoSectionItem {
  id: string;
  internalName: string;
  title: string;
  content: string;
  productCount?: number;
}

interface ProductEditorFormProps {
  initialData?: any;
  categories: CategoryItem[];
  allRibbons?: RibbonItem[];
  allTags?: TagItem[];
  allInfoSections?: InfoSectionItem[];
  isEdit?: boolean;
}

export function ProductEditorForm({
  initialData,
  categories: initialCategories,
  allRibbons = [],
  allTags = [],
  allInfoSections = [],
  isEdit = false,
}: ProductEditorFormProps) {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Lists & Choices
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(initialCategories);
  const [ribbonsList, setRibbonsList] = useState<RibbonItem[]>(allRibbons);
  const [tagsList, setTagsList] = useState<TagItem[]>(allTags);
  const [infoSectionsList, setInfoSectionsList] = useState<InfoSectionItem[]>(allInfoSections);

  // Selected State
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() => {
    if (initialData?.categoryIds && initialData.categoryIds.length > 0) return initialData.categoryIds;
    if (initialData?.categoryId) return [initialData.categoryId];
    return [initialCategories[0]?.id || "cat_default"];
  });
  const [primaryCatId, setPrimaryCatId] = useState<string>(
    initialData?.primaryCategoryId || initialData?.categoryId || initialCategories[0]?.id || ""
  );

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialData?.tagIds || []);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>(
    initialData?.infoSectionIds || (allInfoSections.slice(0, 4).map((s) => s.id))
  );

  // Options & Variants Matrix State
  const [options, setOptions] = useState<any[]>(initialData?.options || []);
  const [variants, setVariants] = useState<GeneratedVariant[]>(initialData?.variants || []);
  const [images, setImages] = useState<any[]>(initialData?.images || []);

  // UI Modals Open State
  const [isAssignCategoriesOpen, setIsAssignCategoriesOpen] = useState(false);
  const [isManageRibbonsOpen, setIsManageRibbonsOpen] = useState(false);
  const [isManageTagsOpen, setIsManageTagsOpen] = useState(false);
  const [isManageOptionsOpen, setIsManageOptionsOpen] = useState(false);
  const [isAddOptionOpen, setIsAddOptionOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<any | null>(null);
  const [isEditInfoSectionOpen, setIsEditInfoSectionOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<InfoSectionItem | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Pricing & Unit pricing
  const [showPricePerUnit, setShowPricePerUnit] = useState<boolean>(
    Boolean(initialData?.showPricePerUnit ?? false)
  );

  const defaultValues: Partial<ProductFormValues> = {
    id: initialData?.id,
    name: initialData?.name || "",
    description: initialData?.description || "",
    visible: initialData?.visible ?? true,
    showInPos: initialData?.showInPos ?? true,
    categoryId: primaryCatId || initialCategories[0]?.id || "",
    categoryIds: selectedCategoryIds,
    primaryCategoryId: primaryCatId,
    primaryRibbon: initialData?.primaryRibbon || "",
    brand: initialData?.brand || "",
    tagIds: selectedTagIds,
    price: initialData?.price ?? 450,
    strikethroughPrice: initialData?.strikethroughPrice ?? 500,
    costPrice: initialData?.costPrice ?? null,
    showPricePerUnit: initialData?.showPricePerUnit ?? false,
    baseUnit: initialData?.baseUnit ?? 100,
    baseUnitMeasurement: initialData?.baseUnitMeasurement || "g",
    totalUnits: initialData?.totalUnits ?? null,
    totalUnitsMeasurement: initialData?.totalUnitsMeasurement || "g",
    taxGroup: initialData?.taxGroup || "Products (default rate)",
    images: initialData?.images || [],
    options: initialData?.options || [],
    variants: initialData?.variants || [],
    infoSectionIds: selectedSectionIds,
  };

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues,
  });

  const productName = watch("name") || "";
  const basePrice = Number(watch("price") || 0);
  const strikethroughPrice = Number(watch("strikethroughPrice") || 0);
  const isVisible = watch("visible");
  const isPosVisible = watch("showInPos");
  const currentPrimaryRibbon = watch("primaryRibbon");
  const brandValue = watch("brand") || "";

  // Auto-regenerate variants when options or base pricing change
  useEffect(() => {
    if (options.length > 0) {
      const generated = generateCartesianVariants(
        options,
        basePrice || 450,
        strikethroughPrice || null,
        initialData?.sku,
        variants
      );
      setVariants(generated);
      setValue("variants", generated as any, { shouldDirty: true });
    }
  }, [options]);

  useEffect(() => {
    setValue("options", options, { shouldDirty: true });
  }, [options]);

  useEffect(() => {
    setValue("categoryIds", selectedCategoryIds, { shouldDirty: true });
    setValue("categoryId", primaryCatId || selectedCategoryIds[0] || "cat2", { shouldDirty: true });
    setValue("primaryCategoryId", primaryCatId || selectedCategoryIds[0] || "cat2", { shouldDirty: true });
  }, [selectedCategoryIds, primaryCatId]);

  useEffect(() => {
    setValue("tagIds", selectedTagIds, { shouldDirty: true });
  }, [selectedTagIds]);

  useEffect(() => {
    setValue("infoSectionIds", selectedSectionIds, { shouldDirty: true });
  }, [selectedSectionIds]);

  const handleGenerateAiDescription = () => {
    if (!productName.trim()) {
      addToast("warning", "Enter Name", "Please enter product name first.");
      return;
    }
    setIsGeneratingAi(true);
    setTimeout(() => {
      const sampleText = `<p>High quality <strong>${productName.trim()}</strong> designed for precision, long lasting durability, and peak efficiency. Features ergonomic craftsmanship and verified quality standards.</p><ul><li>Premium grade construction</li><li>Fast and reliable performance</li><li>Certified standard compliance</li></ul>`;
      setValue("description", sampleText, { shouldDirty: true });
      setIsGeneratingAi(false);
      addToast("success", "AI Generated", "Product description generated!");
    }, 600);
  };

  const handleFormatText = (prefix: string, suffix = "") => {
    const current = getValues("description") || "";
    setValue("description", `${current}\n${prefix}Highlight${suffix}`, { shouldDirty: true });
  };

  // Option handlers
  const handleSaveOption = (optData: any) => {
    let updated: any[];
    if (optData.id) {
      updated = options.map((o) => (o.id === optData.id ? { ...o, ...optData } : o));
    } else {
      const newOpt = {
        id: "opt_" + Date.now(),
        ...optData,
        sortOrder: options.length,
      };
      updated = [...options, newOpt];
    }
    setOptions(updated);
    setValue("options", updated, { shouldDirty: true });
    addToast("success", "Option Saved", `Updated ${optData.name}`);
  };

  const handleDeleteOption = (index: number) => {
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    setValue("options", updated, { shouldDirty: true });
    addToast("info", "Option Removed", "Option removed.");
  };

  // Image Upload handler (Limit of 10)
  const handleImageUploaded = (result: any) => {
    if (images.length >= 10) {
      addToast("warning", "Limit Reached", "Max 10 images/videos allowed.");
      return;
    }
    const newImg = {
      id: "img_" + Date.now(),
      url: result?.info?.secure_url || result?.info?.url,
      altText: productName || "Product image",
      isPrimary: images.length === 0,
      sortOrder: images.length,
    };
    const updated = [...images, newImg];
    setImages(updated);
    setValue("images", updated, { shouldDirty: true });
    addToast("success", "Image Added", "Uploaded new product image.");
  };

  const handleAddImagesFromMediaManager = (urls: string[]) => {
    const remainingSlots = 10 - images.length;
    const toAdd = urls.slice(0, remainingSlots).map((url, i) => ({
      id: "img_" + Date.now() + "_" + i,
      url,
      altText: productName || "Product image",
      isPrimary: images.length === 0 && i === 0,
      sortOrder: images.length + i,
    }));
    const updated = [...images, ...toAdd];
    setImages(updated);
    setValue("images", updated, { shouldDirty: true });
    addToast("success", "Media Added", `Added ${toAdd.length} image(s) to product.`);
  };

  const handleSetPrimaryImage = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    setImages(updated);
    setValue("images", updated, { shouldDirty: true });
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setImages(updated);
    setValue("images", updated, { shouldDirty: true });
  };

  // Submit Handler
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      const activePrimaryCat = primaryCatId || selectedCategoryIds[0] || initialCategories[0]?.id || "cat2";
      const activeCategories = selectedCategoryIds.length > 0 ? selectedCategoryIds : [activePrimaryCat];

      const cleanOptions = (options || []).map((o, idx) => ({
        id: o.id || undefined,
        globalOptionId: o.globalOptionId || null,
        name: o.name,
        fieldType: o.fieldType || "TEXT_CHOICES",
        sortOrder: o.sortOrder ?? idx,
        choices: (o.choices || []).map((c: any, cIdx: number) => ({
          id: c.id || undefined,
          name: c.name,
          colorHex: c.colorHex || "",
          sortOrder: c.sortOrder ?? cIdx,
        })),
      }));

      const payload: ProductFormValues = {
        ...data,
        name: (data.name || productName).trim(),
        categoryId: activePrimaryCat,
        categoryIds: activeCategories,
        primaryCategoryId: activePrimaryCat,
        tagIds: selectedTagIds,
        infoSectionIds: selectedSectionIds,
        showPricePerUnit,
        images,
        options: cleanOptions,
        variants,
      };

      const res = isEdit && initialData?.id
        ? await updateProduct(initialData.id, payload)
        : await createProduct(payload);

      if (res.success) {
        addToast("success", isEdit ? "Product Updated" : "Product Created", "All changes saved successfully!");
        router.push("/admin/products");
        router.refresh();
      } else {
        addToast("error", "Failed to Save", res.error || "Please check your inputs.");
      }
    } catch (err: any) {
      console.error("Save submission error:", err);
      addToast("error", "Error", err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = (formErrors: any) => {
    console.warn("Form validation errors:", formErrors);
    let errMsg = "Please check all required fields.";
    const keys = Object.keys(formErrors);
    if (keys.length > 0) {
      const topErr = formErrors[keys[0]];
      if (topErr?.message) errMsg = topErr.message;
      else if (topErr?.root?.message) errMsg = topErr.root.message;
      else if (Array.isArray(topErr) && topErr[0]?.message) errMsg = topErr[0].message;
      else errMsg = `Please check the ${keys[0]} field.`;
    }
    addToast("warning", "Required Field", errMsg);
  };

  const handleDecimalInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "price" | "strikethroughPrice" | "costPrice" | "totalUnits" | "baseUnit"
  ) => {
    let val = e.target.value;
    if (val.includes(".")) {
      const [integer, decimal] = val.split(".");
      if (decimal && decimal.length > 2) {
        val = `${integer}.${decimal.slice(0, 2)}`;
        e.target.value = val;
      }
    }
    const num = val === "" ? (field === "price" ? 0 : null) : parseFloat(val);
    setValue(field as any, num, { shouldDirty: true });
  };

  return (
    <div className="bg-[#f7f9fa] min-h-screen pb-24 text-slate-800">
      {/* Top Fixed Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/admin/products" className="hover:text-slate-800">
              Products
            </Link>
            <span>›</span>
            <span className="text-slate-900 font-bold truncate max-w-[220px]">
              {productName || "New Product"}
            </span>
            <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-semibold uppercase tracking-wider">
              Physical Product
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit(onSubmit, onInvalid)}
            className="px-6 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Main Cards */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* 1. Basic Info Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-5">
              <h2 className="text-base font-bold text-slate-900">Basic info</h2>

              {/* Product Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1">
                    Name <span className="text-blue-600">*</span> <Info className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                  <span className="text-slate-400 font-normal">{productName.length} / 80</span>
                </div>
                <input
                  type="text"
                  maxLength={80}
                  {...register("name")}
                  placeholder="e.g. Hello or Industrial Valve"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                />
                {errors.name && (
                  <p className="text-xs text-red-600 font-medium">{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1">
                    Description <Info className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateAiDescription}
                    disabled={isGeneratingAi}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isGeneratingAi ? "Generating..." : "Generate AI Text"}
                  </button>
                </div>

                <WixRichTextEditor
                  value={watch("description") || ""}
                  onChange={(html) => setValue("description", html, { shouldDirty: true })}
                  placeholder="Enter detailed product description or instructions..."
                />
              </div>
            </div>

            {/* 2. Pricing Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900">Pricing</h2>
              <p className="text-xs text-slate-500">
                Set up the pricing details that are not managed per variant.
              </p>

              {/* Price & Strikethrough Inputs (Base) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("price", { valueAsNumber: true })}
                    onChange={(e) => handleDecimalInput(e, "price")}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Strikethrough Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("strikethroughPrice", { valueAsNumber: true })}
                    onChange={(e) => handleDecimalInput(e, "strikethroughPrice")}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-500"
                  />
                </div>
              </div>

              {/* Show price per unit toggle */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPricePerUnit(!showPricePerUnit)}
                    className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                      showPricePerUnit ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`w-4.5 h-4.5 bg-white rounded-full absolute top-0.5 transition-transform shadow-xs ${
                        showPricePerUnit ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    Show price per unit <Info className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>

                {showPricePerUnit && (
                  <div className="pt-2 space-y-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Price per unit
                    </label>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {/* Price input */}
                      <div className="relative flex-1 min-w-[120px]">
                        <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={watch("price") ? String(watch("price")) : "200"}
                          {...register("totalUnits", { valueAsNumber: true })}
                          onChange={(e) => handleDecimalInput(e, "totalUnits")}
                          className="w-full pl-7 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                      </div>

                      <span className="text-xs font-semibold text-slate-500 px-1">per</span>

                      {/* Unit Quantity input */}
                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="1"
                          {...register("baseUnit", { valueAsNumber: true })}
                          onChange={(e) => handleDecimalInput(e, "baseUnit")}
                          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-center"
                        />
                      </div>

                      {/* Unit Measurement Dropdown */}
                      <div className="w-32">
                        <select
                          {...register("baseUnitMeasurement")}
                          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                        >
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="l">l</option>
                          <option value="ml">ml</option>
                          <option value="m">m</option>
                          <option value="cm">cm</option>
                          <option value="piece">piece</option>
                          <option value="pack">pack</option>
                          <option value="box">box</option>
                          <option value="set">set</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Preview on storefront: <span className="font-semibold text-slate-700">₹{Number(watch("totalUnits") || watch("price") || 200).toFixed(2)} per {watch("baseUnit") || 1} {watch("baseUnitMeasurement") || "kg"}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Note linking to Variants */}
              {variants.length > 0 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-lg flex items-center gap-2 text-xs text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Price, sale price, cost of goods and total units are managed separately for each variant.</span>
                </div>
              )}
            </div>

            {/* 3. Images and Videos Card (Limit 10) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Images and videos <span className="text-xs text-slate-400 font-medium">({images.length} / 10)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Show customers what this product looks like.</p>
                </div>
              </div>

              {/* Media Upload Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shadow-2xs"
                  >
                    <img src={img.url} alt={img.altText} className="w-full h-full object-cover" />
                    {img.isPrimary && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-bold rounded shadow-xs uppercase tracking-wider">
                        MAIN
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="px-2 py-1 bg-white text-slate-900 rounded text-[10px] font-bold shadow-xs hover:bg-slate-100"
                        >
                          Set Main
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 bg-red-600 text-white rounded-md shadow-xs hover:bg-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {images.length < 10 && (
                  <button
                    type="button"
                    onClick={() => setIsMediaModalOpen(true)}
                    className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-blue-600 cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-xs font-semibold">Add Media</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4. Product Options Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Product options <span className="text-xs text-slate-400 font-medium">({options.length} / 6)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Add, remove or reorder options to create your product variants.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManageOptionsOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50 shadow-2xs transition-colors"
                >
                  Edit All Options
                </button>
              </div>

              {/* Options Rows */}
              <div className="space-y-3 pt-2">
                {options.map((opt, idx) => (
                  <div
                    key={opt.id || idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-slate-400 cursor-grab">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 w-20 truncate">{opt.name}</span>
                    </div>

                    {/* Choices preview */}
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                      {opt.fieldType === "SWATCH_CHOICES" ? (
                        opt.choices?.map((ch: any, cIdx: number) => (
                          <div
                            key={cIdx}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-slate-200 shadow-2xs text-xs font-medium text-slate-700"
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-300"
                              style={{ backgroundColor: ch.colorHex || "#3b82f6" }}
                            />
                            <span>{ch.name}</span>
                          </div>
                        ))
                      ) : (
                        opt.choices?.map((ch: any, cIdx: number) => (
                          <span
                            key={cIdx}
                            className="px-2.5 py-1 bg-white rounded-md border border-slate-200 shadow-2xs text-xs font-semibold text-slate-800"
                          >
                            {ch.name}
                          </span>
                        ))
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingOption(opt);
                          setIsAddOptionOpen(true);
                        }}
                        className="px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 shadow-2xs"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOption(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOption(null);
                      setIsAddOptionOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 pt-1"
                  >
                    <Plus className="w-4 h-4" /> Add Another Option
                  </button>
                )}
              </div>
            </div>

            {/* 5. Variants Preview Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Variants <span className="text-xs text-slate-400 font-medium">({variants.length} / 1000)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage pricing, inventory and more for each product variant.
                  </p>
                </div>
                {initialData?.id ? (
                  <Link
                    href={`/admin/products/${initialData.id}/variants`}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                  >
                    Edit Variants
                  </Link>
                ) : (
                  <span className="text-xs text-slate-400 italic">Save product first to open dedicated editor</span>
                )}
              </div>

              {/* Variants Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">Variant</th>
                      <th className="px-4 py-2.5">Price</th>
                      <th className="px-4 py-2.5">Inventory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
                    {variants.slice(0, 5).map((v, i) => (
                      <tr key={v.id || i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-semibold text-slate-900">{v.displayName || v.sku}</td>
                        <td className="px-4 py-2.5">
                          <span>₹{Number(v.price || basePrice).toFixed(2)}</span>
                          {v.strikethroughPrice && (
                            <span className="text-slate-400 line-through ml-2">
                              ₹{Number(v.strikethroughPrice).toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-emerald-600 font-semibold">
                          {v.inventoryStatus === "IN_STOCK" ? "In stock" : "Out of stock"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {variants.length > 5 && (
                  <div className="p-2.5 bg-slate-50 text-center text-xs font-medium text-slate-500 border-t border-slate-200">
                    + {variants.length - 5} more variants
                  </div>
                )}
              </div>
            </div>

            {/* 6. Additional Info Sections Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Additional info sections <span className="text-xs text-slate-400 font-medium">({selectedSectionIds.length} / 10)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Display more relevant info about the product, like a return policy or size chart.
                  </p>
                </div>
              </div>

              {/* Sections List */}
              <div className="space-y-3 pt-2">
                {selectedSectionIds.map((secId, sIdx) => {
                  const section = infoSectionsList.find((s) => s.id === secId) || {
                    id: secId,
                    title: "Section " + (sIdx + 1),
                    internalName: "Section " + (sIdx + 1),
                    content: "Information content...",
                  };
                  return (
                    <div
                      key={secId}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-slate-400 cursor-grab">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {section.title} <span className="text-slate-400 font-normal">/ {section.internalName}</span>
                          </div>
                          <div className="text-xs text-slate-500 truncate max-w-sm mt-0.5">
                            {section.content?.replace(/<[^>]*>?/gm, "") || "Content..."}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSection(section);
                            setIsEditInfoSectionOpen(true);
                          }}
                          className="px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 shadow-2xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedSectionIds((prev) => prev.filter((id) => id !== secId))
                          }
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {selectedSectionIds.length < 10 && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSection(null);
                      setIsEditInfoSectionOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 pt-1"
                  >
                    <Plus className="w-4 h-4" /> Add Another Info Section
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Visibility, Categories, Ribbons, Brand, Tags */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* 7. Visibility Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Visibility</h2>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Show in online store</span>
                <button
                  type="button"
                  onClick={() => setValue("visible", !isVisible, { shouldDirty: true })}
                  className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                    isVisible ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 bg-white rounded-full absolute top-0.5 transition-transform shadow-xs ${
                      isVisible ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-800">Show in Point of Sale</span>
                <button
                  type="button"
                  onClick={() => setValue("showInPos", !isPosVisible, { shouldDirty: true })}
                  className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                    isPosVisible ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 bg-white rounded-full absolute top-0.5 transition-transform shadow-xs ${
                      isPosVisible ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 8. Categories Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Categories</h2>
                <button
                  type="button"
                  onClick={() => setIsAssignCategoriesOpen(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  + Assign
                </button>
              </div>

              <div className="space-y-2">
                {selectedCategoryIds.map((cId) => {
                  const cat = categoriesList.find((c) => c.id === cId) || { id: cId, name: cId };
                  const isPrimary = cId === primaryCatId;
                  return (
                    <div
                      key={cId}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                    >
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                      <div className="flex items-center gap-1.5">
                        {isPrimary ? (
                          <span
                            title="Primary Category"
                            className="p-1 text-blue-600 bg-blue-100 rounded-md"
                          >
                            <Flag className="w-3.5 h-3.5 fill-blue-600" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPrimaryCatId(cId)}
                            title="Set as Primary"
                            className="p-1 text-slate-400 hover:text-blue-600 rounded-md"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedCategoryIds.length > 1) {
                              setSelectedCategoryIds((prev) => prev.filter((id) => id !== cId));
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 9. Ribbons Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1">
                  Ribbons <Info className="w-3.5 h-3.5 text-slate-400" />
                </h2>
                <button
                  type="button"
                  onClick={() => setIsManageRibbonsOpen(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Manage All
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Primary ribbon</label>
                <select
                  value={currentPrimaryRibbon || ""}
                  onChange={(e) => setValue("primaryRibbon", e.target.value, { shouldDirty: true })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                >
                  <option value="">No Ribbon</option>
                  {ribbonsList.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 10. Brand Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1">
                  Brand <Info className="w-3.5 h-3.5 text-slate-400" />
                </span>
                <span className="text-slate-400 font-normal">{brandValue.length} / 50</span>
              </div>
              <input
                type="text"
                maxLength={50}
                {...register("brand")}
                placeholder="e.g. Samsung or Siemens"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
              />
            </div>

            {/* 11. Product Tags Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Product tags</h2>
                <button
                  type="button"
                  onClick={() => setIsManageTagsOpen(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  + Assign Tags
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {selectedTagIds.map((tId) => {
                  const tag = tagsList.find((t) => t.id === tId) || { id: tId, name: tId };
                  return (
                    <span
                      key={tId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => setSelectedTagIds((prev) => prev.filter((id) => id !== tId))}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                {selectedTagIds.length === 0 && (
                  <span className="text-xs text-slate-400 italic">No tags assigned.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <AssignCategoriesModal
        isOpen={isAssignCategoriesOpen}
        onClose={() => setIsAssignCategoriesOpen(false)}
        categories={categoriesList}
        selectedCategoryIds={selectedCategoryIds}
        primaryCategoryId={primaryCatId}
        onApply={(ids, primary) => {
          setSelectedCategoryIds(ids);
          setPrimaryCatId(primary);
          setValue("categoryIds", ids, { shouldDirty: true });
          setValue("categoryId", primary, { shouldDirty: true });
        }}
      />

      <ManageRibbonsModal
        isOpen={isManageRibbonsOpen}
        onClose={() => setIsManageRibbonsOpen(false)}
        onRibbonsUpdated={async () => {
          const res = await (await import("@/app/actions/productManagement")).getGlobalRibbons();
          if (res.success) setRibbonsList(res.ribbons || []);
        }}
      />

      <ManageTagsModal
        isOpen={isManageTagsOpen}
        onClose={() => setIsManageTagsOpen(false)}
        selectedTagIds={selectedTagIds}
        onToggleTag={(tId) => {
          setSelectedTagIds((prev) =>
            prev.includes(tId) ? prev.filter((id) => id !== tId) : [...prev, tId]
          );
        }}
        onTagsUpdated={async () => {
          const res = await (await import("@/app/actions/productManagement")).getGlobalTags();
          if (res.success) setTagsList(res.tags || []);
        }}
      />

      <EditInfoSectionModal
        isOpen={isEditInfoSectionOpen}
        onClose={() => setIsEditInfoSectionOpen(false)}
        section={editingSection}
        onSaved={(saved) => {
          setInfoSectionsList((prev) => {
            const exists = prev.some((s) => s.id === saved.id);
            return exists ? prev.map((s) => (s.id === saved.id ? { ...s, ...saved } : s)) : [...prev, saved];
          });
          if (!selectedSectionIds.includes(saved.id)) {
            setSelectedSectionIds((prev) => [...prev, saved.id]);
          }
        }}
      />

      <ManageGlobalOptionsModal
        isOpen={isManageOptionsOpen}
        onClose={() => setIsManageOptionsOpen(false)}
      />

      <AddProductOptionModal
        isOpen={isAddOptionOpen}
        onClose={() => {
          setIsAddOptionOpen(false);
          setEditingOption(null);
        }}
        initialOption={editingOption}
        onSave={handleSaveOption}
      />

      <ProductMediaManagerModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onAddImages={handleAddImagesFromMediaManager}
        maxSelectable={10 - images.length}
      />
    </div>
  );
}
