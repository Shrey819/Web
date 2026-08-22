"use client";

import { useState, useEffect } from "react";
import { Search, X, Layers, Check, Trash2, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { getOptionPresets, deleteOptionPreset, OptionPresetItem } from "@/app/actions/productManagement";
import { useToastStore } from "@/store/useToastStore";

interface ApplyOptionPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (options: any[], variants?: any[], includeVariants?: boolean) => void;
}

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
    const rawOptions = typeof preset.options === "string" ? JSON.parse(preset.options) : preset.options;
    const rawVariants = typeof preset.variants === "string" && preset.variants ? JSON.parse(preset.variants) : preset.variants;

    onApplyPreset(rawOptions || [], rawVariants, Boolean(preset.includeVariants));
    addToast(
      "success",
      "Setting Applied",
      preset.includeVariants
        ? `Applied "${preset.name}" with options and custom variants!`
        : `Applied "${preset.name}" options!`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Apply Option Setting</h2>
              <p className="text-xs text-slate-500">
                Choose from saved option and variant settings to apply directly
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search saved option settings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 transition-all font-medium"
            />
          </div>
        </div>

        {/* List of presets */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Loading saved settings...</span>
            </div>
          ) : filteredPresets.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-2xl p-6 space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">No Saved Settings Found</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                You haven&apos;t saved any option presets yet. Use the &quot;Save changes&quot; button to save your current product options for reuse!
              </p>
            </div>
          ) : (
            filteredPresets.map((preset) => {
              const opts = typeof preset.options === "string" ? JSON.parse(preset.options) : preset.options || [];
              return (
                <div
                  key={preset.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{preset.name}</h4>
                      {preset.includeVariants && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-bold">
                          + Custom Variants
                        </span>
                      )}
                    </div>

                    {/* Options list tags */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {opts.map((opt: any, oIdx: number) => (
                        <span
                          key={oIdx}
                          className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 shadow-2xs"
                        >
                          <strong>{opt.name}:</strong> {opt.choices?.map((c: any) => c.name).join(", ")}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleApply(preset)}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Apply
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === preset.id}
                      onClick={(e) => handleDelete(e, preset.id, preset.name)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
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
        <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
