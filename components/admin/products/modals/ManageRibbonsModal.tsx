"use client";

import { useState, useEffect } from "react";
import { Search, X, Check, Trash2, Edit2, Plus, Info, Loader2 } from "lucide-react";
import { getGlobalRibbons, createRibbon, renameRibbon, deleteRibbon } from "@/app/actions/productManagement";
import { useToastStore } from "@/store/useToastStore";

interface RibbonItem {
  id: string;
  name: string;
  color?: string;
  productCount?: number;
}

interface ManageRibbonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRibbonsUpdated?: () => void;
}

export function ManageRibbonsModal({ isOpen, onClose, onRibbonsUpdated }: ManageRibbonsModalProps) {
  const { addToast } = useToastStore();
  const [ribbons, setRibbons] = useState<RibbonItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showAddRow, setShowAddRow] = useState(false);
  const [newRibbonName, setNewRibbonName] = useState("");

  const loadRibbons = async () => {
    setIsLoading(true);
    const res = await getGlobalRibbons();
    if (res.success) {
      setRibbons(res.ribbons || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadRibbons();
      setEditingId(null);
      setShowAddRow(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredRibbons = ribbons.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartEdit = (r: RibbonItem) => {
    setEditingId(r.id);
    setEditingText(r.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingText.trim()) return;
    const res = await renameRibbon(id, editingText.trim());
    if (res.success) {
      setRibbons(prev => prev.map(r => r.id === id ? { ...r, name: editingText.trim() } : r));
      setEditingId(null);
      addToast("success", "Ribbon Renamed", "Updated ribbon across all assigned products.");
      onRibbonsUpdated?.();
    } else {
      addToast("error", "Failed", res.error || "Could not rename ribbon.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ribbon? It will be removed from all products.")) return;
    const res = await deleteRibbon(id);
    if (res.success) {
      setRibbons(prev => prev.filter(r => r.id !== id));
      addToast("info", "Ribbon Deleted", "Removed ribbon.");
      onRibbonsUpdated?.();
    } else {
      addToast("error", "Failed", res.error || "Could not delete ribbon.");
    }
  };

  const handleCreateRibbon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRibbonName.trim()) return;
    const res = await createRibbon(newRibbonName.trim());
    if (res.success) {
      addToast("success", "Ribbon Created", `Added "${newRibbonName.trim()}"`);
      setNewRibbonName("");
      setShowAddRow(false);
      loadRibbons();
      onRibbonsUpdated?.();
    } else {
      addToast("error", "Failed", res.error || "Could not create ribbon.");
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
          <h2 className="text-lg font-bold text-slate-900">Manage ribbons for all products</h2>
          <p className="text-xs text-slate-500 mt-1">
            Renaming or deleting a ribbon here will update all other products with this ribbon.
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
          <div className="flex items-center justify-between pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Ribbon</span>
            <span className="flex items-center gap-1">
              Products <Info className="w-3.5 h-3.5 text-slate-400" />
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            filteredRibbons.map((r) => {
              const isEditing = editingId === r.id;
              return (
                <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="px-3 py-1 text-sm border-2 border-blue-500 rounded-lg focus:outline-hidden w-full font-medium"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(r.id);
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
                        onClick={() => handleSaveEdit(r.id)}
                        className="p-1.5 text-blue-600 hover:text-blue-700 rounded-full hover:bg-blue-50"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-slate-800">{r.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-medium">
                          {r.productCount ?? 0} {r.productCount === 1 ? "product" : "products"}
                        </span>
                        <button
                          onClick={() => handleStartEdit(r)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}

          {/* Add Inline Row */}
          {showAddRow && (
            <form onSubmit={handleCreateRibbon} className="py-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="New ribbon name..."
                value={newRibbonName}
                onChange={(e) => setNewRibbonName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newRibbonName.trim()}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddRow(false)}
                className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            type="button"
            onClick={() => setShowAddRow(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" /> Add Ribbon
          </button>
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
