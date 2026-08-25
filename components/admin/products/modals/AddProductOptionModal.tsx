"use client";

import { useState, useEffect, useRef } from "react";
import { X, GripVertical, Trash2, Plus, AlertTriangle, Layers } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";

interface OptionChoiceDraft {
  id?: string;
  name: string;
  colorHex?: string;
}

interface AddProductOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingOptions?: Array<{ id?: string; name: string; choices: any[] }>;
  editingIndex?: number | null;
  initialOption?: {
    id?: string;
    name: string;
    fieldType: "TEXT_CHOICES" | "SWATCH_CHOICES";
    choices: OptionChoiceDraft[];
  } | null;
  onSave: (option: {
    id?: string;
    name: string;
    fieldType: "TEXT_CHOICES" | "SWATCH_CHOICES";
    choices: OptionChoiceDraft[];
  }) => void;
}

const COLOR_NAME_MAP: Record<string, string> = {
  red: "#ef4444",
  "dark red": "#7f1d1d",
  "light red": "#f87171",
  crimson: "#dc143c",
  scarlet: "#ff2400",
  ruby: "#e0115f",
  maroon: "#800000",
  burgundy: "#800020",
  wine: "#722f37",
  rose: "#f43f5e",
  pink: "#ec4899",
  "hot pink": "#ff69b4",
  "light pink": "#fbcfe8",
  magenta: "#d946ef",
  fuchsia: "#c026d3",
  purple: "#9333ea",
  violet: "#7c3aed",
  indigo: "#4f46e5",
  lavender: "#e9d5ff",
  plum: "#dda0dd",
  lilac: "#c8a2c8",
  blue: "#2563eb",
  "dark blue": "#1e3a8a",
  "light blue": "#38bdf8",
  "sky blue": "#0ea5e9",
  navy: "#0f172a",
  "navy blue": "#0f172a",
  royal: "#1d4ed8",
  "royal blue": "#1d4ed8",
  cyan: "#06b6d4",
  teal: "#0d9488",
  turquoise: "#14b8a6",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  green: "#16a34a",
  "dark green": "#14532d",
  "light green": "#4ade80",
  emerald: "#059669",
  forest: "#228b22",
  "forest green": "#228b22",
  lime: "#84cc16",
  "lime green": "#32cd32",
  mint: "#a7f3d0",
  "mint green": "#98ff98",
  olive: "#808000",
  "olive green": "#556b2f",
  sage: "#9caf88",
  khaki: "#f0e68c",
  yellow: "#eab308",
  "light yellow": "#fef08a",
  "dark yellow": "#ca8a04",
  lemon: "#fff44f",
  mustard: "#ffdb58",
  amber: "#f59e0b",
  gold: "#eab308",
  golden: "#ffd700",
  orange: "#f97316",
  "dark orange": "#c2410c",
  "light orange": "#fdba74",
  coral: "#f87171",
  peach: "#fed7aa",
  apricot: "#fb923c",
  rust: "#b45309",
  brown: "#78350f",
  "dark brown": "#451a03",
  "light brown": "#a16207",
  chocolate: "#7b3f00",
  coffee: "#6f4e37",
  tan: "#d2b48c",
  beige: "#f5f5dc",
  sand: "#c2b280",
  cream: "#fffdd0",
  ivory: "#fffff0",
  white: "#ffffff",
  "off white": "#fafafa",
  silver: "#94a3b8",
  gray: "#64748b",
  grey: "#64748b",
  "dark gray": "#334155",
  "dark grey": "#334155",
  "light gray": "#cbd5e1",
  "light grey": "#cbd5e1",
  charcoal: "#1e293b",
  black: "#000000",
  rad: "#ef4444",
  yello: "#eab308",
  blu: "#2563eb",
  grn: "#16a34a",
};

export function resolveColor(input: string): string | null {
  const clean = input.toLowerCase().trim();
  if (!clean) return null;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(clean)) {
    return clean;
  }
  if (COLOR_NAME_MAP[clean]) {
    return COLOR_NAME_MAP[clean];
  }
  for (const [key, hex] of Object.entries(COLOR_NAME_MAP)) {
    if (clean === key || clean.endsWith(" " + key) || clean.startsWith(key + " ")) {
      return hex;
    }
  }
  return null;
}

export function AddProductOptionModal({
  isOpen,
  onClose,
  existingOptions = [],
  editingIndex = null,
  initialOption,
  onSave,
}: AddProductOptionModalProps) {
  const { addToast } = useToastStore();
  const [optionName, setOptionName] = useState("");
  const [fieldType, setFieldType] = useState<"TEXT_CHOICES" | "SWATCH_CHOICES">("TEXT_CHOICES");
  const [choices, setChoices] = useState<OptionChoiceDraft[]>([
    { name: "", colorHex: "#3b82f6" },
  ]);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  const choiceInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialOption) {
        setOptionName(initialOption.name || "");
        setFieldType(initialOption.fieldType || "TEXT_CHOICES");
        setChoices(
          initialOption.choices && initialOption.choices.length > 0
            ? initialOption.choices.map((c) => ({
                ...c,
                colorHex: c.colorHex || resolveColor(c.name) || "#3b82f6",
              }))
            : [{ name: "", colorHex: "#3b82f6" }]
        );
      } else {
        setOptionName("");
        setFieldType("TEXT_CHOICES");
        setChoices([{ name: "", colorHex: "#3b82f6" }]);
      }
      setFocusIndex(null);
    }
  }, [isOpen, initialOption]);

  // Focus newly added choice input automatically
  useEffect(() => {
    if (focusIndex !== null && choiceInputsRef.current[focusIndex]) {
      choiceInputsRef.current[focusIndex]?.focus();
      setFocusIndex(null);
    }
  }, [focusIndex, choices.length]);

  // Calculate potential variant combinations
  const validChoices = choices.filter((c) => c.name.trim().length > 0);
  const currentChoicesCount = Math.max(1, validChoices.length);

  const otherCombinations = existingOptions
    .filter((_, idx) => (editingIndex != null ? idx !== editingIndex : true))
    .reduce((acc, o) => {
      const cnt = (o.choices || []).filter((c: any) => c?.name?.trim()).length;
      return acc * Math.max(1, cnt);
    }, 1);

  const potentialVariantCount = otherCombinations * currentChoicesCount;
  const isOverVariantLimit = potentialVariantCount > 1000;

  if (!isOpen) return null;

  const handleAddChoice = () => {
    if (choices.length >= 50) {
      addToast("warning", "Limit Reached", "Max 50 choices allowed per option.");
      return;
    }
    if (isOverVariantLimit) {
      addToast("warning", "Variant Limit", "Cannot add more choices. 1,000 variants limit exceeded.");
      return;
    }
    setChoices((prev) => [...prev, { name: "", colorHex: "#10b981" }]);
    setFocusIndex(choices.length);
  };

  const handleUpdateChoice = (index: number, name: string, explicitColorHex?: string) => {
    setChoices((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;

        let newColor = explicitColorHex !== undefined ? explicitColorHex : c.colorHex;

        if (fieldType === "SWATCH_CHOICES" && explicitColorHex === undefined) {
          const detectedColor = resolveColor(name);
          if (detectedColor) {
            newColor = detectedColor;
          }
        }

        return {
          ...c,
          name,
          colorHex: newColor,
        };
      })
    );
  };

  const handleChoiceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (idx === choices.length - 1) {
        if (choices.length >= 50) {
          addToast("warning", "Limit Reached", "Max 50 choices allowed per option.");
          return;
        }
        if (isOverVariantLimit) {
          addToast("warning", "Variant Limit", "Cannot add more choices. 1,000 variants limit exceeded.");
          return;
        }
        setChoices((prev) => [...prev, { name: "", colorHex: "#10b981" }]);
        setFocusIndex(idx + 1);
      } else {
        choiceInputsRef.current[idx + 1]?.focus();
      }
    }
  };

  const handleOptionNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      choiceInputsRef.current[0]?.focus();
    }
  };

  const handleRemoveChoice = (index: number) => {
    if (choices.length === 1) {
      setChoices([{ name: "", colorHex: "#3b82f6" }]);
      return;
    }
    setChoices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAll = () => {
    setChoices([{ name: "", colorHex: "#3b82f6" }]);
  };

  const handleFieldTypeChange = (newType: "TEXT_CHOICES" | "SWATCH_CHOICES") => {
    setFieldType(newType);
    if (newType === "SWATCH_CHOICES") {
      setChoices((prev) =>
        prev.map((c) => ({
          ...c,
          colorHex: resolveColor(c.name) || c.colorHex || "#3b82f6",
        }))
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionName.trim()) {
      addToast("warning", "Name Required", "Please provide an option name.");
      return;
    }

    const cleanChoices = choices
      .map((c) => ({
        ...c,
        name: c.name.trim(),
        colorHex: fieldType === "SWATCH_CHOICES" ? c.colorHex || resolveColor(c.name) || "#3b82f6" : undefined,
      }))
      .filter((c) => Boolean(c.name));

    if (cleanChoices.length === 0) {
      addToast("warning", "Choices Required", "Add at least 1 choice value.");
      return;
    }

    if (isOverVariantLimit) {
      addToast(
        "warning",
        "Variant Limit Exceeded",
        `This configuration would generate ${potentialVariantCount.toLocaleString()} variants (Limit is 1,000). Please reduce choices.`
      );
      return;
    }

    onSave({
      id: initialOption?.id,
      name: optionName.trim(),
      fieldType,
      choices: cleanChoices,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 text-slate-800 dark:text-slate-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 relative">
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 absolute right-4 top-4 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {initialOption?.id ? "Edit Product Option" : "Add Product Option"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure choice values for this product option.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Option Name & Field Type Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Option name *</span>
                <span className="text-slate-400 dark:text-slate-500 font-normal">{optionName.length}/50</span>
              </div>
              <input
                type="text"
                placeholder="e.g. Color or Size"
                value={optionName}
                onChange={(e) => setOptionName(e.target.value)}
                onKeyDown={handleOptionNameKeyDown}
                maxLength={50}
                className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium placeholder-slate-400"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Field type</label>
              <select
                value={fieldType}
                onChange={(e) => handleFieldTypeChange(e.target.value as any)}
                className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
              >
                <option value="TEXT_CHOICES">Text choices</option>
                <option value="SWATCH_CHOICES">Color swatches</option>
              </select>
            </div>
          </div>

          {/* Variant combination estimator / warning */}
          {isOverVariantLimit ? (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-400 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <span className="font-bold block">1,000 Variants Limit Exceeded</span>
                <span>
                  Adding these choices will create <strong>{potentialVariantCount.toLocaleString()}</strong> variants.
                  Please reduce choices or options to stay within the 1,000 variant limit.
                </span>
              </div>
            </div>
          ) : potentialVariantCount > 100 ? (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Will generate ~{potentialVariantCount} variants
              </span>
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                Limit: 1,000
              </span>
            </div>
          ) : null}

          {/* Choices Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Choices *</label>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                  ({choices.length}/50)
                </span>
              </div>
              {choices.length > 1 && (
                <button
                  type="button"
                  onClick={handleRemoveAll}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium cursor-pointer"
                >
                  Remove all
                </button>
              )}
            </div>

            <div className="space-y-2">
              {choices.map((choice, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="text-slate-300 dark:text-slate-600 cursor-grab">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <div className="flex-1 relative flex items-center">
                    <input
                      ref={(el) => {
                        choiceInputsRef.current[idx] = el;
                      }}
                      type="text"
                      maxLength={50}
                      placeholder={fieldType === "SWATCH_CHOICES" ? "e.g., Red or Green" : "e.g., Small, Medium or 4"}
                      value={choice.name}
                      onChange={(e) => handleUpdateChoice(idx, e.target.value)}
                      onKeyDown={(e) => handleChoiceKeyDown(e, idx)}
                      className="w-full pl-3 pr-10 py-1.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-medium placeholder-slate-400 dark:placeholder-slate-500"
                    />

                    {fieldType === "SWATCH_CHOICES" && (
                      <div className="absolute right-2 flex items-center">
                        <label
                          className="w-6 h-6 rounded-md cursor-pointer border border-slate-300 dark:border-slate-700 shadow-xs flex items-center justify-center overflow-hidden transition-colors"
                          style={{ backgroundColor: choice.colorHex || "#3b82f6" }}
                          title="Pick swatch color"
                        >
                          <input
                            type="color"
                            value={choice.colorHex || "#3b82f6"}
                            onChange={(e) => handleUpdateChoice(idx, choice.name, e.target.value)}
                            className="opacity-0 w-0 h-0 cursor-pointer"
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveChoice(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={choices.length >= 50 || isOverVariantLimit}
              onClick={handleAddChoice}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed pt-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Another Choice
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isOverVariantLimit}
              className="px-5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {initialOption?.id ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
