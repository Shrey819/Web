"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema, type ProductFormValues } from "@/lib/validations/product";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  checkAndGetUniqueProductSlug,
  checkSlugAvailability,
} from "@/app/actions/product";
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
  Tag as TagIcon,
  Bookmark,
  Layers,
  Edit2,
  ChevronDown,
  Globe,
  RotateCcw,
  Copy,
  AlertCircle,
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
import { SaveOptionPresetModal } from "./modals/SaveOptionPresetModal";
import { ApplyOptionPresetModal } from "./modals/ApplyOptionPresetModal";
import { VariantMatrixEditorModal } from "./modals/VariantMatrixEditorModal";
import { SelectInfoSectionsModal } from "./modals/SelectInfoSectionsModal";
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

interface BrandItem {
  id: string;
  name: string;
  slug?: string;
  productCount?: number;
}

interface ProductEditorFormProps {
  initialData?: any;
  categories: CategoryItem[];
  allRibbons?: RibbonItem[];
  allTags?: TagItem[];
  allInfoSections?: InfoSectionItem[];
  allBrands?: BrandItem[];
  defaultSectionIds?: string[];
  defaultCategoryIds?: string[];
  defaultPrimaryCategoryId?: string;
  isEdit?: boolean;
}

export function ProductEditorForm({
  initialData,
  categories: initialCategories,
  allRibbons = [],
  allTags = [],
  allInfoSections = [],
  allBrands = [],
  defaultSectionIds = [],
  defaultCategoryIds = [],
  defaultPrimaryCategoryId,
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
  const [brandsList, setBrandsList] = useState<BrandItem[]>(allBrands);

  // Brand Combobox State
  const brandRef = useRef<HTMLDivElement>(null);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);

  // Tag Direct Input & Autocomplete State
  const tagContainerRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [tagInput, setTagInput] = useState("");
  const [isTagSuggestOpen, setIsTagSuggestOpen] = useState(false);
  const [highlightedTagIdx, setHighlightedTagIdx] = useState(-1);
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  // Selected State
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() => {
    if (isEdit && initialData) {
      if (initialData?.categoryIds && initialData.categoryIds.length > 0) return initialData.categoryIds;
      if (initialData?.categoryId) return [initialData.categoryId];
      return [initialCategories[0]?.id || "cat_default"];
    }
    if (defaultCategoryIds && defaultCategoryIds.length > 0) {
      return defaultCategoryIds;
    }
    return [initialCategories[0]?.id || "cat_default"];
  });
  const [primaryCatId, setPrimaryCatId] = useState<string>(() => {
    if (isEdit && initialData) {
      return initialData?.primaryCategoryId || initialData?.categoryId || initialCategories[0]?.id || "";
    }
    if (defaultPrimaryCategoryId) {
      return defaultPrimaryCategoryId;
    }
    if (defaultCategoryIds && defaultCategoryIds.length > 0) {
      return defaultCategoryIds[0];
    }
    return initialCategories[0]?.id || "";
  });

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialData?.tagIds || []);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>(() => {
    if (isEdit && initialData) {
      return initialData.infoSectionIds || [];
    }
    if (defaultSectionIds && defaultSectionIds.length > 0) {
      return defaultSectionIds;
    }
    return allInfoSections.slice(0, 3).map((s) => s.id);
  });
  const [isInfoSectionsEnabled, setIsInfoSectionsEnabled] = useState<boolean>(() => {
    if (isEdit && initialData) {
      return Boolean(initialData.infoSectionIds && initialData.infoSectionIds.length > 0);
    }
    return true;
  });

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
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [isSelectInfoSectionsOpen, setIsSelectInfoSectionsOpen] = useState(false);
  const [isEditInfoSectionOpen, setIsEditInfoSectionOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<InfoSectionItem | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isSavePresetOpen, setIsSavePresetOpen] = useState(false);
  const [isApplyPresetOpen, setIsApplyPresetOpen] = useState(false);
  const [isEditVariantsModalOpen, setIsEditVariantsModalOpen] = useState(false);

  // Pricing & Unit pricing
  const [showPricePerUnit, setShowPricePerUnit] = useState<boolean>(
    Boolean(initialData?.showPricePerUnit ?? false)
  );

  // SEO & Slug State
  const [isCustomSlug, setIsCustomSlug] = useState<boolean>(Boolean(initialData?.slug));
  const [isEditingSlug, setIsEditingSlug] = useState<boolean>(false);
  const [isCopiedSlug, setIsCopiedSlug] = useState<boolean>(false);
  const [slugAvailability, setSlugAvailability] = useState<{
    checked: boolean;
    exists: boolean;
    suggestedSlug?: string;
    existingProductName?: string;
    message?: string;
  }>({ checked: false, exists: false });
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  const defaultValues: Partial<ProductFormValues> = {
    id: initialData?.id,
    name: initialData?.name || "",
    slug: initialData?.slug || "",
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
  const slugValue = watch("slug") || "";
  const basePrice = Number(watch("price") || 0);
  const strikethroughPrice = Number(watch("strikethroughPrice") || 0);
  const isVisible = watch("visible");
  const isPosVisible = watch("showInPos");
  const currentPrimaryRibbon = watch("primaryRibbon");
  const brandValue = watch("brand") || "";

  // Auto-generate slug from product name with database collision check if user hasn't manually customized it
  useEffect(() => {
    if (!isCustomSlug && productName.trim()) {
      const timer = setTimeout(async () => {
        const res = await checkAndGetUniqueProductSlug(productName.trim(), initialData?.id);
        if (res.success && res.slug) {
          setValue("slug", res.slug, { shouldDirty: true });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [productName, isCustomSlug, initialData?.id, setValue]);

  // Real-time check if custom-entered slug is already in use by another product
  useEffect(() => {
    const trimmed = (slugValue || "").trim();
    if (!trimmed) {
      setSlugAvailability({ checked: false, exists: false });
      return;
    }

    setIsCheckingSlug(true);
    const timer = setTimeout(async () => {
      try {
        const res = await checkSlugAvailability(trimmed, initialData?.id);
        if (res.exists) {
          setSlugAvailability({
            checked: true,
            exists: true,
            suggestedSlug: res.availableSlug,
            existingProductName: res.existingProductName,
            message: res.message,
          });
        } else {
          setSlugAvailability({
            checked: true,
            exists: false,
            suggestedSlug: res.availableSlug,
          });
        }
      } finally {
        setIsCheckingSlug(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [slugValue, initialData?.id]);

  const handleResetSlug = async () => {
    const nameToCheck = productName.trim();
    if (!nameToCheck) {
      addToast("warning", "Enter Name", "Please enter product name first.");
      return;
    }
    const res = await checkAndGetUniqueProductSlug(nameToCheck, initialData?.id);
    if (res.success && res.slug) {
      setIsCustomSlug(false);
      setValue("slug", res.slug, { shouldDirty: true });
      addToast("success", "URL Reset", `Available unique URL assigned: /products/${res.slug}`);
    }
  };

  // Prune invalid variant overrides if option choices are deleted
  useEffect(() => {
    if (options.length > 0 && variants.length > 0) {
      const validOptionNames = new Set(options.map((o) => o.name));
      const validChoicesMap = new Map<string, Set<string>>();
      options.forEach((o) => {
        validChoicesMap.set(o.name, new Set((o.choices || []).map((c: any) => c.name)));
      });

      const validVariants = variants.filter((v) => {
        const attrs = v.attributes || {};
        return Object.entries(attrs).every(([optName, optVal]) => {
          if (!validOptionNames.has(optName)) return false;
          const choiceSet = validChoicesMap.get(optName);
          return choiceSet ? choiceSet.has(optVal) : false;
        });
      });

      if (validVariants.length !== variants.length) {
        setVariants(validVariants);
        setValue("variants", validVariants as any, { shouldDirty: true });
      }
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
    setValue("infoSectionIds", isInfoSectionsEnabled ? selectedSectionIds : [], { shouldDirty: true });
  }, [selectedSectionIds, isInfoSectionsEnabled]);

  // For new products: restore last saved info sections template from localStorage
  useEffect(() => {
    if (!isEdit && !initialData?.id && typeof window !== "undefined") {
      try {
        const savedLast = localStorage.getItem("admin_last_info_sections");
        const savedLastEnabled = localStorage.getItem("admin_last_info_sections_enabled");
        if (savedLast) {
          const parsed = JSON.parse(savedLast);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed.filter((id) => allInfoSections.some((s) => s.id === id));
            if (valid.length > 0) {
              setSelectedSectionIds(valid);
              setValue("infoSectionIds", valid, { shouldDirty: false });
            }
          }
        }
        if (savedLastEnabled !== null) {
          setIsInfoSectionsEnabled(savedLastEnabled === "true");
        }
      } catch (e) {
        console.error("Error reading last info sections:", e);
      }
    }
  }, [isEdit, initialData?.id, allInfoSections, setValue]);

  // For new products: restore last saved categories template from localStorage
  useEffect(() => {
    if (!isEdit && !initialData?.id && typeof window !== "undefined") {
      try {
        const savedLastCats = localStorage.getItem("admin_last_categories");
        const savedLastPrimary = localStorage.getItem("admin_last_primary_category");
        if (savedLastCats) {
          const parsed = JSON.parse(savedLastCats);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed.filter((id) => categoriesList.some((c) => c.id === id));
            if (valid.length > 0) {
              setSelectedCategoryIds(valid);
              setValue("categoryIds", valid, { shouldDirty: false });
              const primary = savedLastPrimary && valid.includes(savedLastPrimary) ? savedLastPrimary : valid[0];
              setPrimaryCatId(primary);
              setValue("categoryId", primary, { shouldDirty: false });
              setValue("primaryCategoryId", primary, { shouldDirty: false });
            }
          }
        } else if (defaultCategoryIds && defaultCategoryIds.length > 0) {
          const valid = defaultCategoryIds.filter((id) => categoriesList.some((c) => c.id === id));
          if (valid.length > 0) {
            setSelectedCategoryIds(valid);
            setValue("categoryIds", valid, { shouldDirty: false });
            const primary = defaultPrimaryCategoryId && valid.includes(defaultPrimaryCategoryId) ? defaultPrimaryCategoryId : valid[0];
            setPrimaryCatId(primary);
            setValue("categoryId", primary, { shouldDirty: false });
            setValue("primaryCategoryId", primary, { shouldDirty: false });
          }
        }
      } catch (e) {
        console.error("Error reading last categories:", e);
      }
    }
  }, [isEdit, initialData?.id, defaultCategoryIds, defaultPrimaryCategoryId, categoriesList, setValue]);

  // Sync brands list if prop changes
  useEffect(() => {
    if (allBrands && allBrands.length > 0) {
      setBrandsList(allBrands);
    }
  }, [allBrands]);

  // Click outside to close brand dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) {
        setIsBrandDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentBrandValue = watch("brand") || "";
  const filteredBrands = brandsList.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );
  const hasExactBrandMatch = brandsList.some(
    (b) => b.name.toLowerCase() === brandSearch.trim().toLowerCase()
  );

  const handleSelectBrand = (brandName: string) => {
    setValue("brand", brandName, { shouldDirty: true });
    setBrandSearch("");
    setIsBrandDropdownOpen(false);
  };

  const handleCreateNewBrand = async (brandNameToCreate: string) => {
    const trimmed = brandNameToCreate.trim();
    if (!trimmed) return;
    setIsCreatingBrand(true);
    try {
      const res = await (await import("@/app/actions/productManagement")).createBrand(trimmed);
      if (res.success && res.id) {
        const newBrand = { id: res.id, name: trimmed, productCount: 0 };
        setBrandsList((prev) =>
          [...prev.filter((b) => b.name.toLowerCase() !== trimmed.toLowerCase()), newBrand].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
        setValue("brand", trimmed, { shouldDirty: true });
        setBrandSearch("");
        setIsBrandDropdownOpen(false);
        addToast("success", "Brand Created", `"${trimmed}" added and selected.`);
      } else {
        addToast("error", "Error", res.error || "Could not create brand.");
      }
    } finally {
      setIsCreatingBrand(false);
    }
  };

  const handleDeleteBrand = async (brand: BrandItem, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm(`Are you sure you want to delete brand "${brand.name}"?`)) {
      const res = await (await import("@/app/actions/productManagement")).deleteBrand(brand.id, brand.name);
      if (res.success) {
        setBrandsList((prev) => prev.filter((b) => b.id !== brand.id));
        if (currentBrandValue.toLowerCase() === brand.name.toLowerCase()) {
          setValue("brand", "", { shouldDirty: true });
        }
        addToast("success", "Brand Deleted", `"${brand.name}" deleted.`);
      } else {
        addToast("error", "Error", res.error || "Could not delete brand.");
      }
    }
  };

  // Tag input helpers & suggestions
  const matchingTagSuggestions = useMemo(() => {
    if (!tagInput.trim()) return [];
    const query = tagInput.trim().toLowerCase();
    return tagsList.filter(
      (t) => t.name.toLowerCase().includes(query) && !selectedTagIds.includes(t.id)
    );
  }, [tagInput, tagsList, selectedTagIds]);

  const hasExactTagMatch = useMemo(() => {
    const query = tagInput.trim().toLowerCase();
    return tagsList.some((t) => t.name.toLowerCase() === query);
  }, [tagInput, tagsList]);

  // Click outside to close tag suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagContainerRef.current && !tagContainerRef.current.contains(e.target as Node)) {
        setIsTagSuggestOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAssignTagById = (tagId: string) => {
    if (!selectedTagIds.includes(tagId)) {
      setSelectedTagIds((prev) => [...prev, tagId]);
    }
    setTagInput("");
    setIsTagSuggestOpen(false);
    setHighlightedTagIdx(-1);
    tagInputRef.current?.focus();
  };

  const handleCreateAndAssignTag = async (rawName: string) => {
    const trimmed = rawName.trim().replace(/^,+|,+$/g, "");
    if (!trimmed) return;

    // Check if tag already exists in tagsList
    const existing = tagsList.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      handleAssignTagById(existing.id);
      return;
    }

    setIsCreatingTag(true);
    try {
      const res = await (await import("@/app/actions/productManagement")).createTag(trimmed);
      if (res.success && res.id) {
        const newTag = { id: res.id, name: res.name || trimmed };
        setTagsList((prev) => [...prev.filter((t) => t.id !== newTag.id), newTag]);
        setSelectedTagIds((prev) => (prev.includes(newTag.id) ? prev : [...prev, newTag.id]));
        setTagInput("");
        setIsTagSuggestOpen(false);
        setHighlightedTagIdx(-1);
        tagInputRef.current?.focus();
      } else {
        addToast("error", "Failed", res.error || "Could not create tag.");
      }
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      e.preventDefault();
      if (
        matchingTagSuggestions.length > 0 &&
        highlightedTagIdx >= 0 &&
        highlightedTagIdx < matchingTagSuggestions.length
      ) {
        handleAssignTagById(matchingTagSuggestions[highlightedTagIdx].id);
      } else if (
        matchingTagSuggestions.length > 0 &&
        (e.key === "Tab" || (e.key === "Enter" && hasExactTagMatch))
      ) {
        handleAssignTagById(matchingTagSuggestions[0].id);
      } else if (tagInput.trim()) {
        handleCreateAndAssignTag(tagInput);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isTagSuggestOpen) {
        setIsTagSuggestOpen(true);
      }
      setHighlightedTagIdx((prev) =>
        prev < matchingTagSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedTagIdx((prev) =>
        prev > 0 ? prev - 1 : matchingTagSuggestions.length - 1
      );
    } else if (e.key === "Backspace" && !tagInput && selectedTagIds.length > 0) {
      setSelectedTagIds((prev) => prev.slice(0, -1));
    } else if (e.key === "Escape") {
      setIsTagSuggestOpen(false);
    }
  };

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
    if (editingOptionIndex !== null && editingOptionIndex >= 0 && editingOptionIndex < options.length) {
      // Direct update of the existing option at that index
      updated = options.map((o, i) =>
        i === editingOptionIndex
          ? { ...o, ...optData, id: o.id || optData.id || `opt_${Date.now()}` }
          : o
      );
    } else if (optData.id && options.some((o) => o.id === optData.id)) {
      updated = options.map((o) => (o.id === optData.id ? { ...o, ...optData } : o));
    } else {
      // Check if option with same name already exists to prevent duplicate rows
      const existingIdx = options.findIndex(
        (o) => o.name.toLowerCase().trim() === optData.name.toLowerCase().trim()
      );
      if (existingIdx >= 0) {
        updated = options.map((o, i) =>
          i === existingIdx ? { ...o, ...optData, id: o.id || `opt_${Date.now()}` } : o
        );
      } else {
        const newOpt = {
          id: "opt_" + Date.now(),
          ...optData,
          sortOrder: options.length,
        };
        updated = [...options, newOpt];
      }
    }
    setOptions(updated);
    setValue("options", updated, { shouldDirty: true });
    setEditingOption(null);
    setEditingOptionIndex(null);
    addToast("success", "Option Saved", `Updated ${optData.name}`);
  };

  const handleDeleteOption = (index: number) => {
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    setValue("options", updated, { shouldDirty: true });
    addToast("info", "Option Removed", "Option removed.");
  };

  const handleApplyOptionPreset = (
    presetOptions: any[],
    presetVariants?: any[],
    includeVariants?: boolean
  ) => {
    setOptions(presetOptions);
    setValue("options", presetOptions, { shouldDirty: true });

    if (includeVariants && presetVariants && presetVariants.length > 0) {
      setVariants(presetVariants);
      setValue("variants", presetVariants as any, { shouldDirty: true });
    }
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

      const cleanVariants = (variants || []).map((v: any, vIdx: number) => ({
        id: v.id || undefined,
        sku: v.sku || `VAR-${vIdx + 1}`,
        barcode: v.barcode || "",
        price: Number(v.price ?? basePrice ?? 0),
        strikethroughPrice: v.strikethroughPrice != null && String(v.strikethroughPrice).trim() !== "" ? Number(v.strikethroughPrice) : null,
        cost: v.cost != null && String(v.cost).trim() !== "" ? Number(v.cost) : null,
        trackQuantity: Boolean(v.trackQuantity),
        stockQuantity: Number(v.stockQuantity ?? 100),
        inventoryStatus: (v.inventoryStatus === "OUT_OF_STOCK" || (typeof v.inventoryStatus === "string" && v.inventoryStatus.toUpperCase().includes("OUT"))) ? "OUT_OF_STOCK" as const : "IN_STOCK" as const,
        preOrderEnabled: Boolean(v.preOrderEnabled),
        preOrderLimit: v.preOrderLimit != null && String(v.preOrderLimit).trim() !== "" ? Number(v.preOrderLimit) : null,
        totalUnits: v.totalUnits != null && String(v.totalUnits).trim() !== "" ? Number(v.totalUnits) : null,
        totalUnitsMeasurement: v.totalUnitsMeasurement || "g",
        packageLength: v.packageLength != null && String(v.packageLength).trim() !== "" ? Number(v.packageLength) : null,
        packageWidth: v.packageWidth != null && String(v.packageWidth).trim() !== "" ? Number(v.packageWidth) : null,
        packageHeight: v.packageHeight != null && String(v.packageHeight).trim() !== "" ? Number(v.packageHeight) : null,
        packageUnit: v.packageUnit || "cm",
        mediaUrl: v.mediaUrl || "",
        attributes: v.attributes || {},
        displayName: v.displayName || "",
      }));

      const payload: ProductFormValues = {
        ...data,
        name: (data.name || productName).trim(),
        categoryId: activePrimaryCat,
        categoryIds: activeCategories,
        primaryCategoryId: activePrimaryCat,
        tagIds: selectedTagIds,
        infoSectionIds: isInfoSectionsEnabled ? selectedSectionIds : [],
        showPricePerUnit,
        images,
        options: cleanOptions,
        variants: cleanVariants,
      };

      const res = isEdit && initialData?.id
        ? await updateProduct(initialData.id, payload)
        : await createProduct(payload);

      if (res.success) {
        if (typeof window !== "undefined") {
          try {
            if (isInfoSectionsEnabled && selectedSectionIds.length > 0) {
              localStorage.setItem("admin_last_info_sections", JSON.stringify(selectedSectionIds));
              localStorage.setItem("admin_last_info_sections_enabled", "true");
            } else {
              localStorage.setItem("admin_last_info_sections_enabled", "false");
            }

            if (selectedCategoryIds.length > 0) {
              localStorage.setItem("admin_last_categories", JSON.stringify(selectedCategoryIds));
              if (primaryCatId) {
                localStorage.setItem("admin_last_primary_category", primaryCatId);
              }
            }
          } catch (e) {
            console.error("Error saving last preferences:", e);
          }
        }
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
                  maxLength={1000}
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
                <div className="flex items-center gap-2">
                  {options.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsSavePresetOpen(true)}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      Save changes
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsApplyPresetOpen(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    Apply setting
                  </button>
                </div>
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
                          setEditingOptionIndex(idx);
                          setIsAddOptionOpen(true);
                        }}
                        className="px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 shadow-2xs cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOption(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {options.length < 6 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOption(null);
                      setEditingOptionIndex(null);
                      setIsAddOptionOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 pt-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Another Option
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-medium italic block pt-1">
                    Maximum 6 product options reached
                  </span>
                )}
              </div>
            </div>

            {/* 5. Custom Variant Pricing & Overrides Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Custom Variant Pricing <span className="text-xs text-slate-400 font-medium">({variants.length} custom overrides)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {options.some((o) => o.choices && o.choices.length > 0)
                      ? `All combinations dynamically use base price (₹${basePrice.toFixed(2)}) unless overridden here.`
                      : "Add options above to create customizable variant combinations."}
                  </p>
                </div>
                {options.some((o) => o.choices && o.choices.length > 0) && (
                  <button
                    type="button"
                    onClick={() => setIsEditVariantsModalOpen(true)}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {variants.length > 0 ? "Manage Overrides" : "Customize Specific Variants"}
                  </button>
                )}
              </div>

              {/* Overrides Table or Clean Empty State */}
              {variants.length === 0 ? (
                <div className="p-6 bg-slate-50/70 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">
                      Standard pricing applied to all combinations
                    </span>
                    <p className="text-xs text-slate-500">
                      Every customer choice combination will automatically sell for the base price of <strong>₹{basePrice.toFixed(2)}</strong>.
                    </p>
                  </div>
                  {options.some((o) => o.choices && o.choices.length > 0) && (
                    <button
                      type="button"
                      onClick={() => setIsEditVariantsModalOpen(true)}
                      className="px-3.5 py-1.5 text-xs font-bold text-blue-600 bg-white border border-blue-200 hover:bg-blue-50/50 rounded-lg shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                    >
                      + Add Custom Price / SKU
                    </button>
                  )}
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5">Custom Variant Override</th>
                        <th className="px-4 py-2.5">Custom Price (₹)</th>
                        <th className="px-4 py-2.5">Inventory</th>
                        <th className="px-4 py-2.5">SKU</th>
                        <th className="px-4 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
                      {variants.slice(0, 8).map((v, i) => (
                        <tr key={v.id || i} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-2.5 font-bold text-slate-900 text-xs">
                            {v.displayName || Object.values(v.attributes || {}).join(" | ")}
                          </td>
                          <td className="px-4 py-2">
                            <div className="relative w-28">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                                ₹
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                value={v.price}
                                onChange={(e) => {
                                  const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                  const updated = variants.map((item, idx) => (idx === i ? { ...item, price: val } : item));
                                  setVariants(updated);
                                  setValue("variants", updated as any, { shouldDirty: true });
                                }}
                                className="w-full pl-6 pr-2 py-1 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                v.inventoryStatus === "OUT_OF_STOCK"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {v.inventoryStatus === "OUT_OF_STOCK" ? "Out of stock" : "In stock"}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-mono text-slate-500 text-xs">
                            {v.sku || "--"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = variants.filter((_, idx) => idx !== i);
                                setVariants(updated);
                                setValue("variants", updated as any, { shouldDirty: true });
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                              title="Delete override"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {variants.length > 8 && (
                    <div className="p-2.5 bg-slate-50 text-center text-xs font-medium text-slate-500 border-t border-slate-200">
                      + {variants.length - 8} more custom overrides
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 6. Additional Info Sections Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Additional info sections{" "}
                    {isInfoSectionsEnabled && (
                      <span className="text-xs text-slate-400 font-medium">
                        ({selectedSectionIds.length} / 10)
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Display more relevant info about the product, like a return policy or size chart.
                  </p>
                </div>

                {/* Right-side Controls: Add / Select Button + On/Off Switch */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSelectInfoSectionsOpen(true)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    Add / Select
                  </button>

                  <div className="h-4 w-px bg-slate-200" />

                  {/* On/Off Toggle Switch */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isInfoSectionsEnabled}
                      onClick={() => setIsInfoSectionsEnabled(!isInfoSectionsEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        isInfoSectionsEnabled ? "bg-blue-600" : "bg-slate-300"
                      }`}
                      title={isInfoSectionsEnabled ? "Turn off info sections" : "Turn on info sections"}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isInfoSectionsEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-xs font-bold text-slate-700 min-w-7">
                      {isInfoSectionsEnabled ? "On" : "Off"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              {!isInfoSectionsEnabled ? (
                <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">
                      Info sections are turned off
                    </span>
                    <p className="text-xs text-slate-500">
                      Sections will not appear on the product page until you turn the switch on.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsInfoSectionsEnabled(true)}
                    className="px-3.5 py-1.5 text-xs font-bold text-blue-600 bg-white border border-blue-200 hover:bg-blue-50/50 rounded-lg shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Turn On
                  </button>
                </div>
              ) : selectedSectionIds.length === 0 ? (
                <div className="p-6 bg-slate-50/70 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">
                      No info sections assigned
                    </span>
                    <p className="text-xs text-slate-500">
                      Choose from your saved library of sections (e.g. Return Policy, Shipping Info).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSelectInfoSectionsOpen(true)}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Select Sections
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
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
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="text-slate-400 cursor-grab shrink-0">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {section.title}{" "}
                              {section.internalName && section.internalName !== section.title && (
                                <span className="text-slate-400 font-normal">
                                  / {section.internalName}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 truncate max-w-sm mt-0.5">
                              {section.content?.replace(/<[^>]*>?/gm, "") || "Content..."}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSection(section);
                              setIsEditInfoSectionOpen(true);
                            }}
                            className="px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 shadow-2xs cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSectionIds((prev) => prev.filter((id) => id !== secId))
                            }
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                            title="Remove from product"
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
                      onClick={() => setIsSelectInfoSectionsOpen(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 pt-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Another Info Section
                    </button>
                  )}
                </div>
              )}
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
                              const remaining = selectedCategoryIds.filter((id) => id !== cId);
                              setSelectedCategoryIds(remaining);
                              setValue("categoryIds", remaining, { shouldDirty: true });
                              if (primaryCatId === cId) {
                                const newPrimary = remaining[0];
                                setPrimaryCatId(newPrimary);
                                setValue("categoryId", newPrimary, { shouldDirty: true });
                                setValue("primaryCategoryId", newPrimary, { shouldDirty: true });
                              }
                            } else {
                              addToast("warning", "Required", "Product must belong to at least 1 category.");
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove category"
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
            <div ref={brandRef} className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-2 relative">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1">
                  Brand <Info className="w-3.5 h-3.5 text-slate-400" />
                </span>
                <span className="text-slate-400 font-normal">{currentBrandValue.length} / 50</span>
              </div>

              <div className="relative">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    maxLength={50}
                    value={isBrandDropdownOpen ? brandSearch : currentBrandValue}
                    onFocus={() => {
                      setBrandSearch(currentBrandValue);
                      setIsBrandDropdownOpen(true);
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBrandSearch(val);
                      setValue("brand", val, { shouldDirty: true });
                      if (!isBrandDropdownOpen) setIsBrandDropdownOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (brandSearch.trim()) {
                          if (filteredBrands.length > 0) {
                            handleSelectBrand(filteredBrands[0].name);
                          } else {
                            handleCreateNewBrand(brandSearch.trim());
                          }
                        }
                      } else if (e.key === "Escape") {
                        setIsBrandDropdownOpen(false);
                      }
                    }}
                    placeholder="Search or select a brand..."
                    className="w-full pl-3.5 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (!isBrandDropdownOpen) {
                        setBrandSearch(currentBrandValue);
                      }
                      setIsBrandDropdownOpen(!isBrandDropdownOpen);
                    }}
                    className="absolute right-2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isBrandDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {/* Dropdown Menu */}
                {isBrandDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                    {/* Add new option button if query doesn't match */}
                    {brandSearch.trim() && !hasExactBrandMatch && (
                      <button
                        type="button"
                        onClick={() => handleCreateNewBrand(brandSearch.trim())}
                        disabled={isCreatingBrand}
                        className="w-full px-3.5 py-2 text-left text-xs text-blue-600 hover:bg-blue-50/80 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {isCreatingBrand ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>Add &quot;<strong>{brandSearch.trim()}</strong>&quot; as new brand</span>
                      </button>
                    )}

                    {/* Filtered Brands */}
                    {filteredBrands.length > 0 ? (
                      filteredBrands.map((b) => {
                        const isSelected = currentBrandValue.toLowerCase() === b.name.toLowerCase();
                        return (
                          <div
                            key={b.id}
                            onClick={() => handleSelectBrand(b.name)}
                            className={`group px-3.5 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected ? "bg-blue-50/90 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-50 font-medium"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{b.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                            </div>

                            <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                              {b.productCount != null && b.productCount > 0 && (
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md font-normal">
                                  {b.productCount} {b.productCount === 1 ? "product" : "products"}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => handleDeleteBrand(b, e)}
                                title={`Delete "${b.name}"`}
                                className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : !brandSearch.trim() ? (
                      <div className="p-3 text-center text-xs text-slate-400 italic">
                        No brands in database. Type a name to add.
                      </div>
                    ) : hasExactBrandMatch ? null : (
                      <div className="p-2.5 text-center text-xs text-slate-400 italic">
                        No matching brands. Click above to add.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 11. Product Tags Card */}
            <div ref={tagContainerRef} className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3 relative">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  Product tags <Info className="w-3.5 h-3.5 text-slate-400" />
                </h2>
                <button
                  type="button"
                  onClick={() => setIsManageTagsOpen(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  + Assign Tags
                </button>
              </div>

              {/* Tag Input Box with Badges */}
              <div
                onClick={() => tagInputRef.current?.focus()}
                className="w-full min-h-[42px] p-2 bg-white border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 flex flex-wrap items-center gap-1.5 cursor-text transition-all"
              >
                {selectedTagIds.map((tId) => {
                  const tag = tagsList.find((t) => t.id === tId) || { id: tId, name: tId };
                  return (
                    <span
                      key={tId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-md text-xs font-semibold group transition-colors"
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTagIds((prev) => prev.filter((id) => id !== tId));
                        }}
                        className="text-slate-400 hover:text-red-600 p-0.5 rounded-xs cursor-pointer"
                        title="Remove tag"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}

                <input
                  ref={tagInputRef}
                  type="text"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setIsTagSuggestOpen(true);
                    setHighlightedTagIdx(0);
                  }}
                  onFocus={() => {
                    if (tagInput.trim()) setIsTagSuggestOpen(true);
                  }}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder={selectedTagIds.length === 0 ? "Type tag & press Enter..." : "Add more tags..."}
                  className="flex-1 min-w-[140px] px-1 py-0.5 text-xs bg-transparent border-none outline-hidden focus:outline-hidden font-medium text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Autocomplete Suggestions Popup */}
              {isTagSuggestOpen && tagInput.trim() && (
                <div className="absolute left-5 right-5 top-[calc(100%-8px)] z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                  {/* Create New Tag Action */}
                  {!hasExactTagMatch && (
                    <button
                      type="button"
                      onClick={() => handleCreateAndAssignTag(tagInput)}
                      disabled={isCreatingTag}
                      className="w-full px-3.5 py-2 text-left text-xs text-blue-600 hover:bg-blue-50 font-semibold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        {isCreatingTag ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>Add &quot;<strong>{tagInput.trim()}</strong>&quot; as new tag</span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Press Enter</span>
                    </button>
                  )}

                  {/* Matching Existing Tags */}
                  {matchingTagSuggestions.map((tag, sIdx) => {
                    const isHighlighted = sIdx === highlightedTagIdx;
                    return (
                      <div
                        key={tag.id}
                        onClick={() => handleAssignTagById(tag.id)}
                        className={`px-3.5 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isHighlighted ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700 hover:bg-slate-50 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <TagIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tag.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Tab / Enter</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                Type tag name and hit <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono text-slate-600">Enter</kbd> or <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono text-slate-600">Tab</kbd> to add quickly.
              </p>
            </div>

            {/* 12. Product URL & SEO Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Product URL & SEO <Info className="w-3.5 h-3.5 text-slate-400" />
                </h2>
                <div className="flex items-center gap-2">
                  {isCustomSlug && (
                    <button
                      type="button"
                      onClick={handleResetSlug}
                      className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer font-medium transition-colors"
                      title="Regenerate unique URL from product name"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditingSlug(!isEditingSlug)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    {isEditingSlug ? "Done" : "Edit URL"}
                  </button>
                </div>
              </div>

              {/* URL Preview Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Storefront URL Preview
                </div>
                <div className="flex items-center justify-between gap-2 overflow-hidden">
                  <span className="text-xs text-slate-700 font-mono truncate">
                    <span className="text-slate-400 font-normal">/products/</span>
                    <strong className="text-blue-600 font-semibold">{slugValue || "product-url-slug"}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        const fullUrl = `${window.location.origin}/products/${slugValue || ""}`;
                        navigator.clipboard.writeText(fullUrl);
                        setIsCopiedSlug(true);
                        setTimeout(() => setIsCopiedSlug(false), 2000);
                        addToast("success", "Copied", "Product URL copied to clipboard!");
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition-colors shrink-0 cursor-pointer"
                    title="Copy full product URL"
                  >
                    {isCopiedSlug ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Editable Slug Input */}
              {isEditingSlug && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span>Custom URL Handle</span>
                      {isCheckingSlug ? (
                        <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Checking...
                        </span>
                      ) : slugAvailability.checked && slugValue.trim() ? (
                        slugAvailability.exists ? (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" /> Already Exists
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Available
                          </span>
                        )
                      ) : null}
                    </div>
                    <span className="text-slate-400 font-normal font-mono">{slugValue.length} / 80</span>
                  </div>

                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs text-slate-400 font-mono select-none">
                      /products/
                    </span>
                    <input
                      type="text"
                      maxLength={80}
                      value={slugValue}
                      onChange={(e) => {
                        const clean = e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^a-z0-9-]/g, "");
                        setIsCustomSlug(true);
                        setValue("slug", clean, { shouldDirty: true });
                      }}
                      placeholder="e.g. schneider-electric-relay"
                      className={`w-full pl-20 pr-3.5 py-2 text-xs bg-white border rounded-lg focus:outline-hidden focus:ring-2 font-mono text-slate-900 font-medium transition-colors ${
                        slugAvailability.exists
                          ? "border-red-400 focus:ring-red-500 bg-red-50/20 text-red-900"
                          : slugAvailability.checked && slugValue.trim()
                          ? "border-emerald-400 focus:ring-emerald-500"
                          : "border-slate-200 focus:ring-blue-500"
                      }`}
                    />
                  </div>

                  {/* Warning message if slug already exists */}
                  {slugAvailability.exists && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex flex-col gap-1 text-xs text-red-700 animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>This URL is already taken!</span>
                      </div>
                      {slugAvailability.existingProductName && (
                        <p className="text-[11px] text-red-600">
                          Used by: <strong>&quot;{slugAvailability.existingProductName}&quot;</strong>
                        </p>
                      )}
                      {slugAvailability.suggestedSlug && (
                        <div className="flex items-center justify-between pt-1 border-t border-red-200/60 mt-0.5">
                          <span className="text-[11px] text-slate-600">
                            Available: <strong className="font-mono text-blue-700 font-bold">{slugAvailability.suggestedSlug}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setValue("slug", slugAvailability.suggestedSlug!, { shouldDirty: true });
                            }}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                          >
                            Use Suggested
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                SEO-friendly web address for Google and direct customer visits.
              </p>
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

      <SelectInfoSectionsModal
        isOpen={isSelectInfoSectionsOpen}
        onClose={() => setIsSelectInfoSectionsOpen(false)}
        selectedIds={selectedSectionIds}
        initialSections={infoSectionsList}
        onApply={(newSelectedIds, updatedList) => {
          setSelectedSectionIds(newSelectedIds);
          setInfoSectionsList(updatedList);
          setIsInfoSectionsEnabled(newSelectedIds.length > 0);
          setValue("infoSectionIds", newSelectedIds, { shouldDirty: true });
        }}
        onOpenCreateSection={() => {
          setEditingSection(null);
          setIsEditInfoSectionOpen(true);
        }}
        onOpenEditSection={(sec) => {
          setEditingSection(sec);
          setIsEditInfoSectionOpen(true);
        }}
      />

      <EditInfoSectionModal
        isOpen={isEditInfoSectionOpen}
        onClose={() => {
          setIsEditInfoSectionOpen(false);
          setEditingSection(null);
        }}
        section={editingSection}
        onSaved={(saved) => {
          setInfoSectionsList((prev) => {
            const exists = prev.some((s) => s.id === saved.id);
            return exists ? prev.map((s) => (s.id === saved.id ? { ...s, ...saved } : s)) : [...prev, saved];
          });
          if (!selectedSectionIds.includes(saved.id)) {
            setSelectedSectionIds((prev) => [...prev, saved.id]);
          }
          setIsInfoSectionsEnabled(true);
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
          setEditingOptionIndex(null);
        }}
        existingOptions={options}
        editingIndex={editingOptionIndex}
        initialOption={editingOption}
        onSave={handleSaveOption}
      />

      <ProductMediaManagerModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onAddImages={handleAddImagesFromMediaManager}
        maxSelectable={10 - images.length}
      />

      <SaveOptionPresetModal
        isOpen={isSavePresetOpen}
        onClose={() => setIsSavePresetOpen(false)}
        options={options}
        variants={variants}
      />

      <ApplyOptionPresetModal
        isOpen={isApplyPresetOpen}
        onClose={() => setIsApplyPresetOpen(false)}
        onApplyPreset={handleApplyOptionPreset}
      />

      <VariantMatrixEditorModal
        isOpen={isEditVariantsModalOpen}
        onClose={() => setIsEditVariantsModalOpen(false)}
        productName={productName}
        basePrice={basePrice}
        options={options}
        initialVariants={variants}
        onApplyVariants={(updatedVariants) => {
          setVariants(updatedVariants);
          setValue("variants", updatedVariants as any, { shouldDirty: true });
        }}
      />
    </div>
  );
}
