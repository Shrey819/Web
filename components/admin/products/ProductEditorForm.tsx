"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productFormSchema,
  type ProductFormValues,
} from "@/lib/validations/product";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  checkAndGetUniqueProductSlug,
  checkSlugAvailability,
} from "@/app/actions/product";
import { useToastStore } from "@/store/useToastStore";
import {
  Save,
  Trash2,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Plus,
  X,
  Check,
  Globe,
  Video,
  FileText,
  ExternalLink,
  Wrench,
  Calculator,
  Download,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  Tag,
  ChevronDown,
  IndianRupee,
} from "lucide-react";
import Link from "next/link";
import { WixRichTextEditor } from "./WixRichTextEditor";

interface CategoryItem {
  id: string;
  name: string;
  slug?: string;
}

interface BrandItem {
  id: string;
  name: string;
  slug?: string;
  country?: string | null;
  logo?: string | null;
}

interface ProductEditorFormProps {
  initialData?: any;
  categories: CategoryItem[];
  allRibbons?: any[];
  allTags?: any[];
  allInfoSections?: any[];
  allBrands?: BrandItem[];
  defaultSectionIds?: string[];
  defaultCategoryIds?: string[];
  defaultPrimaryCategoryId?: string;
  isEdit?: boolean;
}

export function ProductEditorForm({
  initialData,
  categories = [],
  allBrands = [],
  isEdit = false,
}: ProductEditorFormProps) {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugWarning, setSlugWarning] = useState<string | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // New application input state
  const [newAppInput, setNewAppInput] = useState("");

  // New image URL input state
  const [newImageUrl, setNewImageUrl] = useState("");

  // Form Setup
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: {
      id: initialData?.id || undefined,
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      videoUrl: initialData?.videoUrl || "",
      images: initialData?.images || [],

      // 4. Custom Feature Cards (2 or 3 columns)
      featureHighlights: initialData?.featureHighlights?.length
        ? initialData.featureHighlights
        : [
            { label: "COST SAVING", value: "lubrication free" },
            { label: "EASY INSTALLATION", value: "Replaceable" },
            { label: "EXTENDED MAINTENANCE", value: "Up to 10000 KM" },
          ],

      // 5. Applications Tags
      applications: initialData?.applications?.length
        ? initialData.applications
        : [
            "Automation equipment",
            "Industrial machine",
            "Electronic machine",
            "Medical equipment",
            "Transportation",
            "Construction",
          ],

      // 6. Technical Support Links
      technicalSupportLinks: initialData?.technicalSupportLinks?.length
        ? initialData.technicalSupportLinks
        : [
            {
              title: "Full Specs",
              url: "https://www.hiwinsupport.com/download_center.aspx?pid=BS",
              icon: "specs",
            },
            {
              title: "Product Selection",
              url: "https://www.hiwinsupport.com/product_select/ballscrew.aspx",
              icon: "selection",
            },
            {
              title: "Life Calculation",
              url: "https://www.hiwinsupport.com/life_Calculate/ballscrew.aspx",
              icon: "calculation",
            },
            {
              title: "CAD Download",
              url: "https://www.hiwinsupport.com/cad_download/ballscrew.aspx",
              icon: "cad",
            },
          ],

      // 7. Custom Buyer Note (Toggle On/Off)
      enableBuyerNote: initialData?.enableBuyerNote !== false,

      // Sidebar Right Fields
      visible: initialData?.visible !== false,
      status: initialData?.status || "ACTIVE",
      brand: initialData?.brand || "HIWIN",
      categoryId: initialData?.categoryId || categories[0]?.id || "",
      categoryIds: initialData?.categoryIds || (categories[0]?.id ? [categories[0].id] : []),
      primaryCategoryId: initialData?.primaryCategoryId || categories[0]?.id || "",

      // SEO
      seoTitle: initialData?.seoTitle || "",
      seoDesc: initialData?.seoDesc || "",

      // Price
      price: initialData?.price != null ? initialData.price : ("" as any),
      strikethroughPrice: initialData?.strikethroughPrice != null ? initialData.strikethroughPrice : null,
      primaryRibbon: "",
      tagIds: [],
      options: [],
      variants: [],
      infoSectionIds: [],
    },
  });

  const { watch, setValue, handleSubmit, formState: { errors } } = form;

  const currentName = watch("name");
  const currentSlug = watch("slug");
  const currentDescription = watch("description");
  const currentImages = watch("images") || [];
  const currentHighlights = watch("featureHighlights") || [];
  const currentApplications = watch("applications") || [];
  const currentSupportLinks = watch("technicalSupportLinks") || [];
  const currentEnableBuyerNote = watch("enableBuyerNote");
  const currentVisible = watch("visible");
  const currentBrand = watch("brand");
  const currentCategoryId = watch("categoryId");
  const currentSeoTitle = watch("seoTitle");
  const currentSeoDesc = watch("seoDesc");

  // User custom modification tracking
  const [isSlugCustom, setIsSlugCustom] = useState(Boolean(initialData?.slug));
  const [isTitleCustom, setIsTitleCustom] = useState(Boolean(initialData?.seoTitle));
  const [isDescCustom, setIsDescCustom] = useState(Boolean(initialData?.seoDesc));

  // Brand Dropdown & Suggestion State
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setIsBrandDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBrandSuggestions = useMemo<BrandItem[]>(() => {
    const query = (currentBrand || "").trim().toLowerCase();
    if (!query) return allBrands;
    return allBrands.filter(
      (b: BrandItem) =>
        b.name.toLowerCase().includes(query) ||
        (b.country && b.country.toLowerCase().includes(query))
    );
  }, [allBrands, currentBrand]);

  // Auto-generate helper functions
  const cleanHtmlToPlainText = (html: string): string => {
    if (!html) return "";
    let text = html;

    // 1. Remove style, script, and HTML comments
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<!--[\s\S]*?-->/g, "");

    // 2. Format list items cleanly
    text = text.replace(/<\/li>/gi, ". ");
    text = text.replace(/<li[^>]*>/gi, " • ");

    // 3. Block elements & line breaks separate sentences/words
    text = text.replace(/<\/(p|div|h[1-6]|blockquote|tr|table)>/gi, ". ");
    text = text.replace(/<(br|hr)\s*\/?>/gi, " ");

    // 4. Strip all remaining inline tags WITHOUT inserting spaces (e.g. <u>T</u><strong>hi</strong><em>s</em> -> This)
    text = text.replace(/<[^>]+>/g, "");

    // 5. Decode HTML entities (&nbsp;, &amp;, quotes, etc.)
    text = text
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&bull;/gi, "•")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&#x([a-f0-9]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

    // 6. Clean up spacing and punctuation from tag conversions
    text = text
      .replace(/\s+([.,;:!?])/g, "$1")
      .replace(/\.{2,}/g, ".")
      .replace(/\s+/g, " ")
      .trim();

    return text;
  };

  const generateSlugFromText = (name: string): string => {
    return (name || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const generateSeoTitleFromText = (name: string, brand?: string | null): string => {
    if (!name) return "";
    const brandStr = brand?.trim() || "HIWIN";
    return `${name} | ${brandStr}`;
  };

  const generateSeoDescFromText = (name: string, desc?: string | null, brand?: string | null): string => {
    const brandStr = brand?.trim() || "HIWIN";
    const plain = cleanHtmlToPlainText(desc || "");
    if (plain && plain.length > 20) {
      if (plain.length <= 155) return plain;
      const truncated = plain.slice(0, 152);
      const lastSpace = truncated.lastIndexOf(" ");
      return lastSpace > 100 ? `${truncated.slice(0, lastSpace)}...` : `${truncated}...`;
    }
    if (name) {
      return `Buy ${name} by ${brandStr}. High-precision industrial automation components with verified specifications, CAD models, and fast regional dispatch.`;
    }
    return "";
  };

  // Real-time auto-sync for new products if user has not customized yet
  useEffect(() => {
    if (!isEdit && currentName) {
      if (!isSlugCustom) {
        setValue("slug", generateSlugFromText(currentName), { shouldDirty: true });
      }
      if (!isTitleCustom) {
        setValue("seoTitle", generateSeoTitleFromText(currentName, currentBrand), { shouldDirty: true });
      }
      if (!isDescCustom) {
        setValue("seoDesc", generateSeoDescFromText(currentName, currentDescription, currentBrand), { shouldDirty: true });
      }
    }
  }, [currentName, currentBrand, currentDescription, isEdit, isSlugCustom, isTitleCustom, isDescCustom, setValue]);

  // Individual and batch auto-generation handlers
  const handleGenerateSlug = () => {
    const newSlug = generateSlugFromText(currentName);
    setValue("slug", newSlug, { shouldDirty: true, shouldValidate: true });
    setIsSlugCustom(false);
    addToast("info", "Slug Generated", `Generated: /product/${newSlug}`);
  };

  const handleGenerateSeoTitle = () => {
    const newTitle = generateSeoTitleFromText(currentName, currentBrand);
    setValue("seoTitle", newTitle, { shouldDirty: true, shouldValidate: true });
    setIsTitleCustom(false);
    addToast("info", "SEO Title Generated", "Generated title from name and brand.");
  };

  const handleGenerateSeoDesc = () => {
    const newDesc = generateSeoDescFromText(currentName, currentDescription, currentBrand);
    setValue("seoDesc", newDesc, { shouldDirty: true, shouldValidate: true });
    setIsDescCustom(false);
    addToast("info", "SEO Description Generated", "Generated description from product details.");
  };

  const handleAutoGenerateAll = () => {
    const newSlug = generateSlugFromText(currentName);
    const newTitle = generateSeoTitleFromText(currentName, currentBrand);
    const newDesc = generateSeoDescFromText(currentName, currentDescription, currentBrand);

    setValue("slug", newSlug, { shouldDirty: true, shouldValidate: true });
    setValue("seoTitle", newTitle, { shouldDirty: true, shouldValidate: true });
    setValue("seoDesc", newDesc, { shouldDirty: true, shouldValidate: true });

    setIsSlugCustom(false);
    setIsTitleCustom(false);
    setIsDescCustom(false);

    addToast("success", "URL & SEO Auto-Generated", "Auto-filled slug, SEO title, and description.");
  };

  // Validate Slug
  const handleSlugBlur = async () => {
    if (!currentSlug) return;
    setSlugChecking(true);
    try {
      const res = await checkSlugAvailability(currentSlug, initialData?.id);
      if (res.exists) {
        setSlugWarning(res.message || `URL already in use. Suggested: ${res.availableSlug}`);
        setValue("slug", res.availableSlug);
      } else {
        setSlugWarning(null);
      }
    } catch {
      setSlugWarning(null);
    } finally {
      setSlugChecking(false);
    }
  };

  // --- Feature Highlights Management ---
  const handleAddHighlight = () => {
    if (currentHighlights.length >= 6) {
      addToast("warning", "Limit Reached", "You can add a maximum of 6 custom feature cards.");
      return;
    }
    setValue(
      "featureHighlights",
      [...currentHighlights, { label: "NEW FEATURE", value: "Specification" }],
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const handleUpdateHighlight = (index: number, field: "label" | "value", text: string) => {
    const updated = currentHighlights.map((item, i) =>
      i === index ? { ...item, [field]: text } : item
    );
    setValue("featureHighlights", updated, { shouldDirty: true, shouldValidate: true });
  };

  const handleRemoveHighlight = (index: number) => {
    setValue(
      "featureHighlights",
      currentHighlights.filter((_, i) => i !== index),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const handleLoadHiwinHighlights = () => {
    setValue(
      "featureHighlights",
      [
        { label: "COST SAVING", value: "lubrication free" },
        { label: "EASY INSTALLATION", value: "Replaceable" },
        { label: "EXTENDED MAINTENANCE", value: "Up to 10000 KM" },
      ],
      { shouldDirty: true, shouldValidate: true }
    );
    addToast("info", "Preset Loaded", "Loaded 3 HIWIN standard feature cards.");
  };

  // --- Applications Management ---
  const handleAddApplication = () => {
    const trimmed = newAppInput.trim();
    if (!trimmed) return;
    if (currentApplications.length >= 20) {
      addToast("warning", "Limit Reached", "You can add a maximum of 20 application tags.");
      return;
    }
    if (currentApplications.includes(trimmed)) {
      setNewAppInput("");
      return;
    }
    setValue("applications", [...currentApplications, trimmed]);
    setNewAppInput("");
  };

  const handleRemoveApplication = (appToRemove: string) => {
    setValue(
      "applications",
      currentApplications.filter((app) => app !== appToRemove)
    );
  };

  const handleLoadDefaultApplications = () => {
    setValue("applications", [
      "Automation equipment",
      "Industrial machine",
      "Electronic machine",
      "Medical equipment",
      "Transportation",
      "Construction",
    ]);
    addToast("info", "Preset Loaded", "Loaded standard industrial automation applications.");
  };

  // --- Technical Support Links Management ---
  const handleAddSupportLink = () => {
    if (currentSupportLinks.length >= 6) {
      addToast("warning", "Limit Reached", "You can add a maximum of 6 technical support links.");
      return;
    }
    setValue("technicalSupportLinks", [
      ...currentSupportLinks,
      { title: "Technical Manual", url: "https://", icon: "specs" },
    ]);
  };

  const handleUpdateSupportLink = (
    index: number,
    field: "title" | "url" | "icon",
    val: any
  ) => {
    const updated = [...currentSupportLinks];
    updated[index] = { ...updated[index], [field]: val };
    setValue("technicalSupportLinks", updated);
  };

  const handleRemoveSupportLink = (index: number) => {
    setValue(
      "technicalSupportLinks",
      currentSupportLinks.filter((_, i) => i !== index)
    );
  };

  const handleLoadHiwinSupportLinks = () => {
    setValue("technicalSupportLinks", [
      {
        title: "Full Specs",
        url: "https://www.hiwinsupport.com/download_center.aspx?pid=BS",
        icon: "specs",
      },
      {
        title: "Product Selection",
        url: "https://www.hiwinsupport.com/product_select/ballscrew.aspx",
        icon: "selection",
      },
      {
        title: "Life Calculation",
        url: "https://www.hiwinsupport.com/life_Calculate/ballscrew.aspx",
        icon: "calculation",
      },
      {
        title: "CAD Download",
        url: "https://www.hiwinsupport.com/cad_download/ballscrew.aspx",
        icon: "cad",
      },
    ]);
    addToast("info", "Preset Loaded", "Loaded 4 HIWIN support tools.");
  };

  // --- Image Upload & Management ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);
    const filesList = Array.from(files);

    try {
      const formData = new FormData();
      filesList.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.urls) && data.urls.length > 0) {
        const newImages = data.urls.map((url: string, index: number) => ({
          url,
          altText: currentName || "Product image",
          isPrimary: currentImages.length === 0 && index === 0,
          sortOrder: currentImages.length + index,
        }));

        setValue("images", [...currentImages, ...newImages], { shouldDirty: true });
        addToast("success", "Uploaded", `${data.urls.length} image${data.urls.length > 1 ? "s" : ""} uploaded successfully.`);
      } else {
        throw new Error(data.error || "Server upload failed");
      }
    } catch (err: any) {
      console.warn("Direct server upload failed, converting to local preview:", err);
      // Fallback: convert to base64 Data URLs so user flow is never blocked
      try {
        const localUrls: string[] = await Promise.all(
          filesList.map(
            (file) =>
              new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              })
          )
        );

        const newImages = localUrls.map((url: string, index: number) => ({
          url,
          altText: currentName || "Product image",
          isPrimary: currentImages.length === 0 && index === 0,
          sortOrder: currentImages.length + index,
        }));

        setValue("images", [...currentImages, ...newImages], { shouldDirty: true });
        addToast("info", "Images Added", "Loaded image previews.");
      } catch (localErr: any) {
        addToast("error", "Upload Error", err.message || "Failed to process selected images.");
      }
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddImageUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    setValue("images", [
      ...currentImages,
      {
        url,
        altText: currentName || "Product image",
        isPrimary: currentImages.length === 0,
        sortOrder: currentImages.length,
      },
    ]);
    setNewImageUrl("");
  };

  const handleRemoveImage = (index: number) => {
    const updated = currentImages.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setValue("images", updated);
  };

  const handleSetPrimaryImage = (index: number) => {
    const updated = currentImages.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    setValue("images", updated);
  };

  // --- Form Submission ---
  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      // Ensure primary category
      const primaryCat = values.categoryId || categories[0]?.id || "";
      const payload: ProductFormValues = {
        ...values,
        categoryId: primaryCat,
        primaryCategoryId: primaryCat,
        categoryIds: [primaryCat],
        status: values.visible ? "ACTIVE" : "DRAFT",
      };

      if (isEdit && initialData?.id) {
        const res = await updateProduct(initialData.id, payload);
        if (res.success) {
          addToast("success", "Product Updated", `"${values.name}" saved successfully.`);
          router.push("/admin/products");
        } else {
          addToast("error", "Update Failed", res.error || "Failed to update product.");
        }
      } else {
        const res = await createProduct(payload);
        if (res.success) {
          addToast("success", "Product Created", `"${values.name}" created successfully.`);
          router.push("/admin/products");
        } else {
          addToast("error", "Creation Failed", res.error || "Failed to create product.");
        }
      }
    } catch (err: any) {
      console.error("Save error:", err);
      addToast("error", "Error", err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!confirm(`Are you sure you want to delete "${initialData.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteProduct(initialData.id);
      if (res.success) {
        addToast("info", "Product Deleted", "Product removed successfully.");
        router.push("/admin/products");
      } else {
        addToast("error", "Delete Failed", res.error || "Could not delete product.");
      }
    } catch (err: any) {
      addToast("error", "Error", err.message || "Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-24 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to Products"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isEdit ? `Edit: ${initialData?.name || "Product"}` : "Create New Product"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure product specifications, feature cards, support links, and visibility.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-800/50 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>Delete</span>
            </button>
          )}

          <Link
            href="/admin/products"
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-bold text-white bg-[#00a651] hover:bg-[#008a41] rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEdit ? "Update Product" : "Save & Publish"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 1 to 6 (Main Product Content) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Name & 2. Feature Description */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div>
              <label htmlFor="product-name" className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                1) Product Name *
              </label>
              <input
                id="product-name"
                type="text"
                {...form.register("name")}
                placeholder="e.g., HIWIN EL Self Lubricating Ballscrew"
                className={`w-full px-4 py-2.5 rounded-lg border text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? "border-rose-400 focus:ring-rose-200 dark:border-rose-500"
                    : "border-slate-300 dark:border-slate-700 focus:border-[#00a651] focus:ring-[#00a651]/20"
                }`}
              />
              {errors.name && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                2) Feature Description
              </label>
              <WixRichTextEditor
                value={watch("description") || ""}
                onChange={(html) => setValue("description", html, { shouldDirty: true, shouldValidate: true })}
                placeholder="Enter detailed high-performance feature overview for this product..."
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Supports bold, italic, underline, text and background colors, links, bullet points, and numbered lists. Appears under the "Feature" heading on the product page.
              </p>
            </div>

            {/* Simple Price Option */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-[#00a651]" />
                <span>Price (₹)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product-price" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Selling Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm">₹</span>
                    <input
                      id="product-price"
                      type="number"
                      step="any"
                      min="0"
                      {...form.register("price", {
                        valueAsNumber: true,
                        setValueAs: (v) => (v === "" || v === null || v === undefined || isNaN(Number(v)) ? 0 : Number(v)),
                      })}
                      onFocus={(e) => {
                        if (e.target.value === "0" || e.target.value === "0.00") {
                          e.target.select();
                        }
                      }}
                      onClick={(e) => {
                        if (e.currentTarget.value === "0" || e.currentTarget.value === "0.00") {
                          e.currentTarget.select();
                        }
                      }}
                      onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        const val = e.currentTarget.value;
                        if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
                          const clean = val.replace(/^0+/, "");
                          e.currentTarget.value = clean || "0";
                          setValue("price", Number(e.currentTarget.value), { shouldValidate: true, shouldDirty: true });
                        }
                      }}
                      placeholder="e.g., 2500"
                      className={`w-full pl-8 pr-4 py-2.5 rounded-lg border text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950 font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.price
                          ? "border-rose-400 focus:ring-rose-200 dark:border-rose-500"
                          : "border-slate-300 dark:border-slate-700 focus:border-[#00a651] focus:ring-[#00a651]/20"
                      }`}
                    />
                  </div>
                  {errors.price && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="product-strikethrough-price" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Original / Strikethrough Price (₹) <span className="font-normal text-slate-400 dark:text-slate-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm">₹</span>
                    <input
                      id="product-strikethrough-price"
                      type="number"
                      step="any"
                      min="0"
                      {...form.register("strikethroughPrice", {
                        setValueAs: (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
                      })}
                      onFocus={(e) => {
                        if (e.target.value === "0" || e.target.value === "0.00") {
                          e.target.select();
                        }
                      }}
                      onClick={(e) => {
                        if (e.currentTarget.value === "0" || e.currentTarget.value === "0.00") {
                          e.currentTarget.select();
                        }
                      }}
                      placeholder="Optional (e.g., 3000)"
                      className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#00a651] focus:ring-2 focus:ring-[#00a651]/20 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Displays with strikethrough (e.g., <span className="line-through">₹3,000</span> ₹2,500)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Images and Videos */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#00a651]" />
                  <span>3) Images and Videos</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Upload images from computer or paste image & video URLs.
                </p>
              </div>
            </div>

            {/* Direct Signed File Upload & URL Input */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                disabled={isUploadingImages}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:bg-slate-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs border border-transparent dark:border-slate-700"
              >
                {isUploadingImages ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Upload from Computer</span>
                  </>
                )}
              </button>

              <div className="flex-1 flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Or paste direct image URL (https://...)"
                  className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#00a651]"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
                >
                  Add URL
                </button>
              </div>
            </div>

            {/* Uploaded Images Grid */}
            {currentImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                {currentImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`relative rounded-lg border p-2 bg-slate-50 dark:bg-slate-800/60 flex flex-col items-center justify-between group ${
                      img.isPrimary
                        ? "border-[#00a651] ring-2 ring-[#00a651]/20 bg-emerald-50/20 dark:bg-emerald-950/20"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="w-full h-24 flex items-center justify-center overflow-hidden rounded bg-white dark:bg-slate-950">
                      <img src={img.url} alt={img.altText || ""} className="max-h-full max-w-full object-contain" />
                    </div>

                    <div className="w-full pt-2 flex items-center justify-between gap-1">
                      {img.isPrimary ? (
                        <span className="text-[10px] font-bold text-[#00a651] uppercase">Primary</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium underline cursor-pointer"
                        >
                          Make Primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                        title="Delete image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                No images added yet. Upload an image or enter a URL above.
              </div>
            )}

            {/* Video URL Input */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <label htmlFor="product-video" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Product Video URL (Optional)</span>
              </label>
              <input
                id="product-video"
                type="url"
                {...form.register("videoUrl")}
                placeholder="e.g., https://www.youtube.com/watch?v=... or .mp4 video link"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#00a651]"
              />
            </div>
          </div>

          {/* 4. Custom Feature Cards (2 or 3 columns) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    4) Custom Feature Cards (2 or 3 columns)
                  </h2>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                    currentHighlights.length >= 6
                      ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}>
                    {currentHighlights.length}/6 max
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Displays highlight cards with top gray text and bottom bold green text (maximum 6).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadHiwinHighlights}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-[#00a651] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                >
                  Load HIWIN 3-Card Preset
                </button>
                <button
                  type="button"
                  onClick={handleAddHighlight}
                  disabled={currentHighlights.length >= 6}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    currentHighlights.length >= 6
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                      : "bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer border border-transparent dark:border-slate-700"
                  }`}
                  title={currentHighlights.length >= 6 ? "Maximum 6 cards reached" : "Add new card"}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Card</span>
                </button>
              </div>
            </div>

            {/* List of Highlight Cards */}
            <div className="space-y-3 pt-2">
              {currentHighlights.map((card, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                >
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-6 shrink-0">
                    #{idx + 1}
                  </span>

                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      Top Label (Gray Text)
                    </label>
                    <input
                      type="text"
                      value={card.label}
                      onChange={(e) => handleUpdateHighlight(idx, "label", e.target.value)}
                      placeholder="e.g., COST SAVING"
                      className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase focus:outline-none focus:border-[#00a651]"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
                      Bottom Value (Green Bold Text)
                    </label>
                    <input
                      type="text"
                      value={card.value}
                      onChange={(e) => handleUpdateHighlight(idx, "value", e.target.value)}
                      placeholder="e.g., lubrication free"
                      className="w-full px-3 py-1.5 rounded-md border border-emerald-300 dark:border-emerald-700/60 bg-white dark:bg-slate-900 text-xs font-bold text-[#00a651] dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-[#00a651]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveHighlight(idx)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors self-end sm:self-center cursor-pointer"
                    title="Remove card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {currentHighlights.length === 0 && (
                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-400 dark:text-slate-500">
                  No feature cards added. Click "Add Card" or "Load HIWIN 3-Card Preset" above.
                </div>
              )}
            </div>
          </div>

          {/* 5. Applications (add / remove) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">5) Applications (Tags)</h2>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                    currentApplications.length >= 20
                      ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}>
                    {currentApplications.length}/20 max
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Industrial machinery and automation application areas (maximum 20 tags).
                </p>
              </div>
              <button
                type="button"
                onClick={handleLoadDefaultApplications}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer self-start sm:self-auto"
              >
                Load Default Applications
              </button>
            </div>

            {/* Current Tags */}
            <div className="flex flex-wrap gap-2 pt-1 min-h-[40px]">
              {currentApplications.map((app, idx) => (
                <span
                  key={idx}
                  className="bg-[#4a4a4a] dark:bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-md border border-transparent dark:border-slate-700 flex items-center gap-2 group"
                >
                  <span>{app}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveApplication(app)}
                    className="text-slate-300 hover:text-rose-300 cursor-pointer"
                    title="Remove tag"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}

              {currentApplications.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">No applications added yet.</p>
              )}
            </div>

            {/* Add New Tag Input */}
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="text"
                value={newAppInput}
                disabled={currentApplications.length >= 20}
                onChange={(e) => setNewAppInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddApplication();
                  }
                }}
                placeholder={
                  currentApplications.length >= 20
                    ? "Maximum 20 application tags reached"
                    : "Type application name (e.g. Semiconductor Equipment) and press Enter"
                }
                className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#00a651] disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400"
              />
              <button
                type="button"
                onClick={handleAddApplication}
                disabled={currentApplications.length >= 20}
                className={`px-4 py-2 font-semibold text-xs rounded-lg transition-colors shrink-0 ${
                  currentApplications.length >= 20
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    : "bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white border border-transparent dark:border-slate-700 cursor-pointer"
                }`}
              >
                Add
              </button>
            </div>
          </div>

          {/* 6. Brand Technical Support (add / remove text, URL) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    6) Brand Technical Support Links
                  </h2>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                    currentSupportLinks.length >= 6
                      ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}>
                    {currentSupportLinks.length}/6 max
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Redirecting buttons (maximum 6 links, e.g. Full Specs, Selection, Life Calculation, CAD Download).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadHiwinSupportLinks}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-[#00a651] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                >
                  Load HIWIN 4-Tool Links
                </button>
                <button
                  type="button"
                  onClick={handleAddSupportLink}
                  disabled={currentSupportLinks.length >= 6}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    currentSupportLinks.length >= 6
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                      : "bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer border border-transparent dark:border-slate-700"
                  }`}
                  title={currentSupportLinks.length >= 6 ? "Maximum 6 links reached" : "Add new link"}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Link</span>
                </button>
              </div>
            </div>

            {/* List of Support Links */}
            <div className="space-y-3 pt-2">
              {currentSupportLinks.map((link, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                >
                  <div className="w-full sm:w-1/4">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Button Title
                    </label>
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => handleUpdateSupportLink(idx, "title", e.target.value)}
                      placeholder="e.g. Full Specs"
                      className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#00a651]"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Redirect URL
                    </label>
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => handleUpdateSupportLink(idx, "url", e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#00a651]"
                    />
                  </div>

                  <div className="w-full sm:w-28">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Icon Type
                    </label>
                    <select
                      value={link.icon || "specs"}
                      onChange={(e) => handleUpdateSupportLink(idx, "icon", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#00a651]"
                    >
                      <option value="specs">Specs</option>
                      <option value="selection">Selection</option>
                      <option value="calculation">Calculation</option>
                      <option value="cad">CAD</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSupportLink(idx)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors self-end sm:self-center cursor-pointer"
                    title="Remove link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {currentSupportLinks.length === 0 && (
                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-400 dark:text-slate-500">
                  No support links added. Click "Add Link" or "Load HIWIN 4-Tool Links" above.
                </div>
              )}
            </div>
          </div>

          {/* 7. Custom Field for Buyer Note (On / Off Toggle) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  7) Custom Field for Buyer Note
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enables a dedicated text field for buyers to enter preferred model numbers, custom lengths, or order instructions.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentEnableBuyerNote}
                  onChange={(e) => setValue("enableBuyerNote", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a651]"></div>
                <span className="ml-3 text-xs font-bold text-slate-800 dark:text-slate-200">
                  {currentEnableBuyerNote ? "ON" : "OFF"}
                </span>
              </label>
            </div>

            <div className="mt-4 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              {currentEnableBuyerNote ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#00a651]" />
                  Buyer Note Field is <strong>ENABLED</strong> on product page.
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">
                  Buyer Note Field is <strong>DISABLED</strong> on product page.
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: 8 to 11 (Sidebar Attributes) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 8. Visibility */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">8) Visibility</h2>
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                  currentVisible
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {currentVisible ? "Active" : "Draft"}
              </span>
            </div>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors bg-white dark:bg-slate-950">
              <input
                type="checkbox"
                checked={currentVisible}
                onChange={(e) => setValue("visible", e.target.checked)}
                className="w-4 h-4 rounded text-[#00a651] focus:ring-[#00a651] border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">Visible in Storefront</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  When active, customers can browse and order this item online.
                </span>
              </div>
            </label>
          </div>

          {/* 9. Brand */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="product-brand" className="block text-sm font-bold text-slate-900 dark:text-white">
                9) Brand
              </label>
              {allBrands.length > 0 && (
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {allBrands.length} brands registered
                </span>
              )}
            </div>

            <div className="relative" ref={brandDropdownRef}>
              <div className="relative flex items-center">
                <input
                  id="product-brand"
                  type="text"
                  value={currentBrand || ""}
                  onChange={(e) => {
                    setValue("brand", e.target.value, { shouldDirty: true, shouldValidate: true });
                    setIsBrandDropdownOpen(true);
                  }}
                  onFocus={() => setIsBrandDropdownOpen(true)}
                  placeholder="Type or select a brand (e.g., HIWIN, THK, Rexroth)"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#00a651] focus:ring-2 focus:ring-[#00a651]/20 bg-white dark:bg-slate-950"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setIsBrandDropdownOpen((prev) => !prev)}
                  className="absolute right-2 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
                  title="Toggle brand suggestions"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isBrandDropdownOpen ? 'rotate-180 text-[#00a651]' : ''}`} />
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {isBrandDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin">
                  {filteredBrandSuggestions.length > 0 ? (
                    <div className="p-1.5 space-y-0.5">
                      <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Existing Brands
                      </div>
                      {filteredBrandSuggestions.map((b) => {
                        const isSelected = (currentBrand || "").trim().toLowerCase() === b.name.toLowerCase();
                        return (
                          <button
                            key={b.id || b.name}
                            type="button"
                            onClick={() => {
                              setValue("brand", b.name, { shouldDirty: true, shouldValidate: true });
                              setIsBrandDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-[#00a651] dark:text-emerald-400"
                                : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="truncate">{b.name}</span>
                              {b.country && (
                                <span className="text-[10px] font-normal text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded shrink-0">
                                  {b.country}
                                </span>
                              )}
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#00a651] dark:text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        No matching existing brand for "{currentBrand}".
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Keep typing to use "{currentBrand}" as a custom brand.
                      </p>
                    </div>
                  )}

                  <div className="p-2 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 rounded-b-xl">
                    <Link
                      href="/admin/categories"
                      target="_blank"
                      className="text-[#00a651] dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Manage Brands & Logos</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsBrandDropdownOpen(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Used in "{currentBrand || 'HIWIN'} Technical Support" and storefront filters.
            </p>
          </div>

          {/* 10. Category */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
            <label htmlFor="product-category" className="block text-sm font-bold text-slate-900 dark:text-white">
              10) Category
            </label>
            <select
              id="product-category"
              {...form.register("categoryId")}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00a651] focus:ring-2 focus:ring-[#00a651]/20 bg-white dark:bg-slate-950"
            >
              <option value="" className="dark:bg-slate-900 dark:text-white">Select a Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="dark:bg-slate-900 dark:text-white">
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Organizes the product under the appropriate catalog collection and breadcrumbs.
            </p>
          </div>

          {/* 11. Product URL & SEO */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#00a651]" />
                <span>11) Product URL & SEO</span>
              </h2>
              <button
                type="button"
                onClick={handleAutoGenerateAll}
                className="px-2.5 py-1 text-xs font-semibold text-[#00a651] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                title="Auto-generate Slug, SEO Title, and Description from product name and details"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#00a651]" />
                <span>Auto-Generate All</span>
              </button>
            </div>

            {/* Slug */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="product-slug" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Product URL Slug *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  className="text-[11px] font-semibold text-[#00a651] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Auto-generate clean slug from product name"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Generate
                </button>
              </div>
              <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 overflow-hidden focus-within:border-[#00a651] focus-within:ring-2 focus-within:ring-[#00a651]/20">
                <span className="px-2.5 py-2 text-xs text-slate-400 dark:text-slate-500 font-mono border-r border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 select-none">
                  /product/
                </span>
                <input
                  id="product-slug"
                  type="text"
                  {...form.register("slug")}
                  onChange={(e) => {
                    setValue("slug", e.target.value, { shouldDirty: true });
                    setIsSlugCustom(true);
                  }}
                  onBlur={handleSlugBlur}
                  placeholder="hiwin-el-ballscrew"
                  className="flex-1 px-3 py-2 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-950 font-mono focus:outline-none"
                />
              </div>
              {slugChecking && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Checking slug availability...</p>
              )}
              {slugWarning && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">{slugWarning}</p>
              )}
            </div>

            {/* SEO Meta Title */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="seo-title" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  SEO Meta Title
                </label>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono ${
                    (currentSeoTitle?.length || 0) > 60 ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-slate-400 dark:text-slate-500"
                  }`}>
                    {currentSeoTitle?.length || 0} / 60
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateSeoTitle}
                    className="text-[11px] font-semibold text-[#00a651] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Auto-generate title from product name and brand"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
              </div>
              <input
                id="seo-title"
                type="text"
                {...form.register("seoTitle")}
                onChange={(e) => {
                  setValue("seoTitle", e.target.value, { shouldDirty: true });
                  setIsTitleCustom(true);
                }}
                placeholder={currentName ? `${currentName} | ${currentBrand || "HIWIN"}` : "Product Title | Brand"}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#00a651] focus:ring-2 focus:ring-[#00a651]/20 bg-white dark:bg-slate-950"
              />
            </div>

            {/* SEO Meta Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="seo-desc" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  SEO Meta Description
                </label>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono ${
                    (currentSeoDesc?.length || 0) > 160 ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-slate-400 dark:text-slate-500"
                  }`}>
                    {currentSeoDesc?.length || 0} / 160
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateSeoDesc}
                    className="text-[11px] font-semibold text-[#00a651] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Auto-generate description from feature description"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
              </div>
              <textarea
                id="seo-desc"
                rows={3}
                {...form.register("seoDesc")}
                onChange={(e) => {
                  setValue("seoDesc", e.target.value, { shouldDirty: true });
                  setIsDescCustom(true);
                }}
                placeholder="Brief search engine overview of the product specifications and advantages..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#00a651] focus:ring-2 focus:ring-[#00a651]/20 resize-none bg-white dark:bg-slate-950"
              />
            </div>

            {/* Search Preview */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                Google Search Preview
              </span>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  https://yourdomain.com/product/{currentSlug || "product-slug"}
                </div>
                <div className="text-sm font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer truncate">
                  {currentSeoTitle || currentName || "Product Name"}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {currentSeoDesc || "Reliable and high-performance industrial equipment engineered for superior performance."}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </form>
  );
}
