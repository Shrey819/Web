"use client";

import { useState, useEffect } from "react";
import {
  Search,
  X,
  Layers,
  Check,
  Trash2,
  Loader2,
  Sparkles,
  Plus,
  ArrowLeft,
  Palette,
  Type,
  Bookmark,
  Edit2,
} from "lucide-react";
import {
  getOptionPresets,
  deleteOptionPreset,
  saveOptionPreset,
  updateOptionPreset,
  OptionPresetItem,
} from "@/app/actions/productManagement";
import { resolveColor } from "./AddProductOptionModal";
import { useToastStore } from "@/store/useToastStore";

interface OptionChoiceDraft {
  name: string;
  colorCode?: string;
}

interface OptionDraft {
  name: string;
  type: "TEXT_CHOICES" | "SWATCH_CHOICES";
  choices: OptionChoiceDraft[];
  choiceInput: string;
}

interface ApplyOptionPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset?: (options: any[], variants?: any[], includeVariants?: boolean) => void;
}

const COMMON_OPTION_SUGGESTIONS = ["Color", "Size", "Material", "Style", "Voltage", "Length"];

export function ApplyOptionPresetModal({
  isOpen,
  onClose,
  onApplyPreset,
}: ApplyOptionPresetModalProps) {
  const { addToast } = useToastStore();
  const [presets, setPresets] = useState<OptionPresetItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Preset Creation/Edit Mode State
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetOptions, setNewPresetOptions] = useState<OptionDraft[]>([
    { name: "", type: "TEXT_CHOICES", choices: [], choiceInput: "" },
  ]);
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  const loadPresets = async () => {
    setIsLoading(true);
    const res = await getOptionPresets();
    if (res.success) {
      setPresets(res.presets || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadPresets();
      setIsCreatingPreset(false);
      setSearch("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredPresets = presets.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete preset "${name}"?`)) return;

    setDeletingId(id);
    const res = await deleteOptionPreset(id);
    if (res.success) {
      setPresets((prev) => prev.filter((p) => p.id !== id));
      addToast("info", "Setting Deleted", `Removed preset "${name}".`);
    } else {
      addToast("error", "Delete Failed", res.error || "Could not delete preset.");
    }
    setDeletingId(null);
  };

  const handleApply = (preset: OptionPresetItem) => {
    const rawOptions =
      typeof preset.options === "string" ? JSON.parse(preset.options) : preset.options;
    const rawVariants =
      typeof preset.variants === "string" && preset.variants
        ? JSON.parse(preset.variants)
        : preset.variants;

    if (onApplyPreset) {
      onApplyPreset(rawOptions || [], rawVariants, Boolean(preset.includeVariants));
      addToast(
        "success",
        "Setting Applied",
        preset.includeVariants
          ? `Applied "${preset.name}" with options and custom variants!`
          : `Applied "${preset.name}" options!`
      );
      onClose();
    } else {
      addToast(
        "info",
        "Preset Selected",
        `Preset "${preset.name}" is saved and ready to use in product editor.`
      );
    }
  };

  // Option Builder Handlers
  const handleAddChoice = (optionIdx: number) => {
    const opt = newPresetOptions[optionIdx];
    const raw = (opt.choiceInput || "").trim();
    if (!raw) return;

    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const existingNames = new Set(opt.choices.map((c) => c.name.toLowerCase()));
    const newChoices: OptionChoiceDraft[] = [...opt.choices];

    parts.forEach((p) => {
      if (!existingNames.has(p.toLowerCase())) {
        existingNames.add(p.toLowerCase());
        const autoColor = resolveColor(p) || "#ef4444";
        newChoices.push({
          name: p,
          colorCode: opt.type === "SWATCH_CHOICES" ? autoColor : undefined,
        });
      }
    });

    setNewPresetOptions((prev) =>
      prev.map((o, idx) =>
        idx === optionIdx ? { ...o, choices: newChoices, choiceInput: "" } : o
      )
    );
  };

  const handleRemoveChoice = (optionIdx: number, choiceIdx: number) => {
    setNewPresetOptions((prev) =>
      prev.map((o, idx) =>
        idx === optionIdx
          ? { ...o, choices: o.choices.filter((_, cIdx) => cIdx !== choiceIdx) }
          : o
      )
    );
  };

  const handleStartEdit = (e: React.MouseEvent, preset: OptionPresetItem) => {
    e.stopPropagation();
    const rawOptions =
      typeof preset.options === "string" ? JSON.parse(preset.options) : preset.options || [];

    const parsedDrafts: OptionDraft[] = rawOptions.map((opt: any) => ({
      name: opt.name || "",
      type:
        opt.type ||
        (opt.choices?.some((c: any) => typeof c === "object" && c.colorCode)
          ? "SWATCH_CHOICES"
          : "TEXT_CHOICES"),
      choices: (opt.choices || []).map((c: any) => ({
        name: typeof c === "string" ? c : c.name || "",
        colorCode:
          typeof c === "object"
            ? c.colorCode || resolveColor(c.name || "") || undefined
            : resolveColor(c) || undefined,
      })),
      choiceInput: "",
    }));

    setEditingPresetId(preset.id);
    setNewPresetName(preset.name);
    setNewPresetOptions(
      parsedDrafts.length > 0
        ? parsedDrafts
        : [{ name: "", type: "TEXT_CHOICES", choices: [], choiceInput: "" }]
    );
    setIsCreatingPreset(true);
  };

  const handleSaveNewPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newPresetName.trim();
    if (!trimmedName) {
      addToast("warning", "Name Required", "Please enter a name for this option setting.");
      return;
    }

    // Auto-commit any unfinished choice inputs
    const validatedOptions = newPresetOptions.map((opt) => {
      let finalChoices = [...opt.choices];
      if (opt.choiceInput && opt.choiceInput.trim()) {
        const parts = opt.choiceInput.split(",").map((s) => s.trim()).filter(Boolean);
        const existingNames = new Set(finalChoices.map((c) => c.name.toLowerCase()));
        parts.forEach((p) => {
          if (!existingNames.has(p.toLowerCase())) {
            existingNames.add(p.toLowerCase());
            const autoColor = resolveColor(p) || "#ef4444";
            finalChoices.push({
              name: p,
              colorCode: opt.type === "SWATCH_CHOICES" ? autoColor : undefined,
            });
          }
        });
      }
      return {
        name: opt.name.trim(),
        type: opt.type,
        choices: finalChoices.map((c) => ({
          name: c.name,
          colorCode: opt.type === "SWATCH_CHOICES" ? (c.colorCode || resolveColor(c.name) || "#ef4444") : undefined,
        })),
      };
    });

    const hasInvalid = validatedOptions.some(
      (opt) => !opt.name || opt.choices.length === 0
    );

    if (hasInvalid || validatedOptions.length === 0) {
      addToast(
        "warning",
        "Incomplete Options",
        "Each option must have a title and at least one choice."
      );
      return;
    }

    setIsSavingPreset(true);
    try {
      let res;
      if (editingPresetId) {
        res = await updateOptionPreset(editingPresetId, trimmedName, validatedOptions, false);
      } else {
        res = await saveOptionPreset(trimmedName, validatedOptions, false);
      }

      if (res.success) {
        addToast(
          "success",
          editingPresetId ? "Preset Updated" : "Preset Created",
          editingPresetId
            ? `Updated option preset "${trimmedName}".`
            : `Created option preset "${trimmedName}".`
        );
        setIsCreatingPreset(false);
        setEditingPresetId(null);
        loadPresets();
      } else {
        addToast("error", "Failed to Save", res.error || "Could not save option preset.");
      }
    } catch (err: any) {
      addToast("error", "Error", err.message || "An unexpected error occurred.");
    } finally {
      setIsSavingPreset(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 text-slate-800 dark:text-slate-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isCreatingPreset ? (
              <button
                type="button"
                onClick={() => {
                  setIsCreatingPreset(false);
                  setEditingPresetId(null);
                }}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Back to presets"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Layers className="w-4 h-4" />
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingPresetId
                  ? "Edit Option Preset"
                  : isCreatingPreset
                  ? "Add Option Preset"
                  : "Apply Option Setting"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {editingPresetId
                  ? "Update option combinations and choices for this preset"
                  : isCreatingPreset
                  ? "Define reusable option combinations and choices"
                  : "Choose from saved option and variant settings to apply directly"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View 1: Preset Creation Form */}
        {isCreatingPreset ? (
          <form onSubmit={handleSaveNewPreset} className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Preset Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Preset Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newPresetName}
                maxLength={60}
                autoFocus
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="e.g. Standard T-Shirt Sizes & Colors, Voltage & Specs"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white font-medium placeholder-slate-400"
              />
            </div>

            {/* Options Builder List */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Product Options</span>
                <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                  {newPresetOptions.length} / 6 options
                </span>
              </label>

              {newPresetOptions.map((opt, oIdx) => (
                <div
                  key={oIdx}
                  className="p-4 bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 relative group text-slate-900 dark:text-white"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Option {oIdx + 1}
                    </span>
                    {newPresetOptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setNewPresetOptions((prev) => prev.filter((_, idx) => idx !== oIdx))
                        }
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
                        title="Remove option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option Name */}
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={opt.name}
                        maxLength={30}
                        placeholder="Option name (e.g. Color, Size)"
                        onChange={(e) =>
                          setNewPresetOptions((prev) =>
                            prev.map((o, idx) =>
                              idx === oIdx ? { ...o, name: e.target.value } : o
                            )
                          )
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400"
                      />

                      {/* Quick suggestions */}
                      {!opt.name && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {COMMON_OPTION_SUGGESTIONS.map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() =>
                                setNewPresetOptions((prev) =>
                                  prev.map((o, idx) =>
                                    idx === oIdx
                                      ? {
                                          ...o,
                                          name: sug,
                                          type:
                                            sug === "Color"
                                              ? "SWATCH_CHOICES"
                                              : "TEXT_CHOICES",
                                        }
                                      : o
                                  )
                                )
                              }
                              className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                            >
                              + {sug}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Option Type Selector */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700 rounded-lg h-[34px]">
                      <button
                        type="button"
                        onClick={() =>
                          setNewPresetOptions((prev) =>
                            prev.map((o, idx) =>
                              idx === oIdx ? { ...o, type: "TEXT_CHOICES" } : o
                            )
                          )
                        }
                        className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          opt.type === "TEXT_CHOICES"
                            ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        <Type className="w-3 h-3" /> Text
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNewPresetOptions((prev) =>
                            prev.map((o, idx) =>
                              idx === oIdx
                                ? {
                                    ...o,
                                    type: "SWATCH_CHOICES",
                                    choices: o.choices.map((c) => ({
                                      ...c,
                                      colorCode: c.colorCode || resolveColor(c.name) || "#ef4444",
                                    })),
                                  }
                                : o
                            )
                          )
                        }
                        className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          opt.type === "SWATCH_CHOICES"
                            ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        <Palette className="w-3 h-3" /> Swatch
                      </button>
                    </div>
                  </div>

                  {/* Choice Chips Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap min-h-[38px] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-blue-500">
                      {opt.choices.map((c, cIdx) => (
                        <span
                          key={cIdx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200"
                        >
                          {opt.type === "SWATCH_CHOICES" && (
                            <label
                              className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shadow-2xs flex items-center justify-center overflow-hidden cursor-pointer hover:scale-110 transition-transform relative shrink-0"
                              style={{ backgroundColor: c.colorCode || resolveColor(c.name) || "#ef4444" }}
                              title={`Click to pick color for "${c.name}"`}
                            >
                              <input
                                type="color"
                                value={c.colorCode || resolveColor(c.name) || "#ef4444"}
                                onChange={(e) => {
                                  const newColor = e.target.value;
                                  setNewPresetOptions((prev) =>
                                    prev.map((o, idx) =>
                                      idx === oIdx
                                        ? {
                                            ...o,
                                            choices: o.choices.map((choice, i) =>
                                              i === cIdx
                                                ? { ...choice, colorCode: newColor }
                                                : choice
                                            ),
                                          }
                                        : o
                                    )
                                  );
                                }}
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer pointer-events-auto"
                              />
                            </label>
                          )}
                          <span>{c.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveChoice(oIdx, cIdx)}
                            className="text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}

                      <input
                        type="text"
                        value={opt.choiceInput || ""}
                        placeholder={
                          opt.choices.length === 0
                            ? "Type choice & press Enter..."
                            : "Add choice..."
                        }
                        onChange={(e) =>
                          setNewPresetOptions((prev) =>
                            prev.map((o, idx) =>
                              idx === oIdx ? { ...o, choiceInput: e.target.value } : o
                            )
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
                            e.preventDefault();
                            handleAddChoice(oIdx);
                          }
                        }}
                        className="flex-1 min-w-[120px] text-xs bg-transparent border-none outline-hidden font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      Type choice name and hit <kbd className="px-1 py-0.2 bg-slate-200/80 dark:bg-slate-800 rounded font-mono text-[9px]">Enter</kbd> or <kbd className="px-1 py-0.2 bg-slate-200/80 dark:bg-slate-800 rounded font-mono text-[9px]">,</kbd> to add.
                    </p>
                  </div>
                </div>
              ))}

              {newPresetOptions.length < 6 && (
                <button
                  type="button"
                  onClick={() =>
                    setNewPresetOptions((prev) => [
                      ...prev,
                      { name: "", type: "TEXT_CHOICES", choices: [], choiceInput: "" },
                    ])
                  }
                  className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Another Option
                </button>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingPreset(false);
                  setEditingPresetId(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingPreset}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isSavingPreset ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                {editingPresetId ? "Update Preset" : "Save Preset"}
              </button>
            </div>
          </form>
        ) : (
          /* View 2: Preset List & Search */
          <>
            {/* Search & Add Preset Button */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search saved option settings..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 transition-all font-medium"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingPreset(true);
                  setNewPresetName("");
                  setNewPresetOptions([
                    { name: "", type: "TEXT_CHOICES", choices: [], choiceInput: "" },
                  ]);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Preset Option
              </button>
            </div>

            {/* List of presets */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-xs font-medium">Loading saved settings...</span>
                </div>
              ) : filteredPresets.length === 0 ? (
                <div className="py-14 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Saved Settings Found</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
                      You haven&apos;t created any option presets yet. Click below to add your first preset!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreatingPreset(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Preset Option
                  </button>
                </div>
              ) : (
                filteredPresets.map((preset) => {
                  const opts =
                    typeof preset.options === "string"
                      ? JSON.parse(preset.options)
                      : preset.options || [];
                  return (
                    <div
                      key={preset.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs transition-all flex items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {preset.name}
                          </h4>
                          {preset.includeVariants && (
                            <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded text-[10px] font-bold">
                              + Custom Variants
                            </span>
                          )}
                        </div>

                        {/* Options list tags */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {opts.map((opt: any, oIdx: number) => (
                            <span
                              key={oIdx}
                              className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] font-medium text-slate-700 dark:text-slate-300 shadow-2xs"
                            >
                              <strong>{opt.name}:</strong>{" "}
                              {opt.choices?.map((c: any) => c.name).join(", ")}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {onApplyPreset && (
                          <button
                            type="button"
                            onClick={() => handleApply(preset)}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Apply
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleStartEdit(e, preset)}
                          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                          title="Edit preset setting"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === preset.id}
                          onClick={(e) => handleDelete(e, preset.id, preset.name)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          title="Delete setting"
                        >
                          {deletingId === preset.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Total: {presets.length} {presets.length === 1 ? "preset" : "presets"}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
