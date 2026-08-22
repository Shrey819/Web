"use client";

import { useState, useEffect } from "react";
import { Search, X, Check, Edit2, Trash2, Plus, Info, Loader2 } from "lucide-react";
import { getGlobalOptions, createGlobalOption, renameGlobalOption, deleteGlobalOption } from "@/app/actions/productManagement";
import { useToastStore } from "@/store/useToastStore";

interface GlobalOptionItem {
  id: string;
  name: string;
  fieldType: "TEXT_CHOICES" | "SWATCH_CHOICES";
  productCount?: number;
}

interface ManageGlobalOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOptionsUpdated?: () => void;
}

export function ManageGlobalOptionsModal({ isOpen, onClose, onOptionsUpdated }: ManageGlobalOptionsModalProps) {
  const { addToast } = useToastStore();
  const [options, setOptions] = useState<GlobalOptionItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const loadOptions = async () => {
    setIsLoading(true);
    const res = await getGlobalOptions();
    if (res.success) {
      setOptions(res.options || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadOptions();
      setEditingId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredOptions = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartEdit = (opt: GlobalOptionItem) => {
    setEditingId(opt.id);
    setEditingText(opt.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingText.trim()) return;
    const res = await renameGlobalOption(id, editingText.trim());
    if (res.success) {
      setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, name: editingText.trim() } : o)));
      setEditingId(null);
      addToast("success", "Option Renamed", `Updated option across all products.`);
      onOptionsUpdated?.();
    } else {
      addToast("error", "Failed", res.error || "Could not rename option.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this global option?")) return;
    const res = await deleteGlobalOption(id);
    if (res.success) {
      setOptions((prev) => prev.filter((o) => o.id !== id));
      addToast("info", "Option Deleted", "Removed global option.");
      onOptionsUpdated?.();
    } else {
      addToast("error", "Failed", res.error || "Could not delete option.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 relative">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 absolute right-4 top-4 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-slate-900">Edit option names for all products</h2>
          <p className="text-xs text-slate-500 mt-1">
            Renaming an option here will update all of the products that have this option.
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
          <div className="grid grid-cols-12 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span className="col-span-4">Option name</span>
            <span className="col-span-4">Field type</span>
            <span className="col-span-4 flex items-center justify-end gap-1">
              Products <Info className="w-3.5 h-3.5 text-slate-400" />
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isEditing = editingId === opt.id;
              return (
                <div key={opt.id} className="py-3 grid grid-cols-12 items-center gap-2">
                  {isEditing ? (
                    <div className="col-span-12 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="px-3 py-1 text-sm border-2 border-blue-500 rounded-lg focus:outline-hidden flex-1 font-medium"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(opt.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSaveEdit(opt.id)}
                        className="p-1.5 text-blue-600 hover:text-blue-700 rounded-full hover:bg-blue-50"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="col-span-4 text-sm font-semibold text-slate-800 truncate">
                        {opt.name}
                      </span>
                      <span className="col-span-4 text-xs text-slate-500 font-medium">
                        {opt.fieldType === "SWATCH_CHOICES" ? "Color swatches" : "Text choices"}
                      </span>
                      <div className="col-span-4 flex items-center justify-end gap-2">
                        <span className="text-xs text-slate-400 font-medium mr-1">
                          {opt.productCount ?? 0} {opt.productCount === 1 ? "product" : "products"}
                        </span>
                        <button
                          onClick={() => handleStartEdit(opt)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(opt.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
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
            className="px-6 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
