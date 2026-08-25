"use client";

import { useState } from "react";
import { X, Bookmark, CheckSquare, Square, Loader2, Info } from "lucide-react";
import { saveOptionPreset } from "@/app/actions/productManagement";
import { useToastStore } from "@/store/useToastStore";

interface SaveOptionPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: any[];
  variants: any[];
  onSaved?: () => void;
}

export function SaveOptionPresetModal({
  isOpen,
  onClose,
  options,
  variants,
  onSaved,
}: SaveOptionPresetModalProps) {
  const { addToast } = useToastStore();
  const [presetName, setPresetName] = useState("");
  const [includeVariants, setIncludeVariants] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = presetName.trim();
    if (!trimmed) {
      addToast("warning", "Name Required", "Please enter a name for this option setting.");
      return;
    }

    if (!options || options.length === 0) {
      addToast("warning", "No Options", "Add at least one product option before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveOptionPreset(
        trimmed,
        options,
        includeVariants,
        includeVariants ? variants : undefined
      );

      if (res.success) {
        addToast(
          "success",
          "Setting Saved",
          includeVariants
            ? `Saved "${trimmed}" with options and customized variants.`
            : `Saved "${trimmed}" option choices.`
        );
        onSaved?.();
        onClose();
        setPresetName("");
        setIncludeVariants(false);
      } else {
        addToast("error", "Failed to Save", res.error || "Could not save setting.");
      }
    } catch (err: any) {
      console.error("Save option preset error:", err);
      addToast("error", "Error", err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 text-slate-800 dark:text-slate-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Save Option Setting</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Save this structure to reuse across other products</p>
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

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Setting Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Setting / Preset Name *</label>
            <input
              type="text"
              placeholder="e.g. Standard Colors & Lengths"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white placeholder-slate-400"
              autoFocus
              required
            />
          </div>

          {/* Current Summary Preview */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Current configuration:</span>
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              {options.map((opt, i) => (
                <span key={i} className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 font-medium">
                  {opt.name} ({opt.choices?.length || 0})
                </span>
              ))}
            </div>
          </div>

          {/* Include Variants Checkbox */}
          <div
            onClick={() => setIncludeVariants(!includeVariants)}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-all cursor-pointer flex items-start gap-3"
          >
            <div className="mt-0.5 text-blue-600 dark:text-blue-400">
              {includeVariants ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
            </div>
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Save with customized variants too
              </span>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Check this box to save your specific variant prices, inventory, and SKU overrides ({variants.length} variants).
                If unchecked, only the option choices will be saved.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Setting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
