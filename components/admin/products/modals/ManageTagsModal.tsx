"use client";

import { useState, useEffect } from "react";
import { Search, X, Edit2, Trash2, Plus, Check, Loader2 } from "lucide-react";
import { getGlobalTags, createTag, renameTag, deleteTag } from "@/app/actions/productManagement";
import { useToastStore } from "@/store/useToastStore";

interface TagItem {
  id: string;
  name: string;
  productCount?: number;
}

interface ManageTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTagIds?: string[];
  onToggleTag?: (tagId: string) => void;
  onTagsUpdated?: () => void;
}

export function ManageTagsModal({
  isOpen,
  onClose,
  selectedTagIds = [],
  onToggleTag,
  onTagsUpdated
}: ManageTagsModalProps) {
  const { addToast } = useToastStore();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showCreateRow, setShowCreateRow] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  const loadTags = async () => {
    setIsLoading(true);
    const res = await getGlobalTags();
    if (res.success) {
      setTags(res.tags || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadTags();
      setEditingId(null);
      setShowCreateRow(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartEdit = (t: TagItem) => {
    setEditingId(t.id);
    setEditingText(t.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingText.trim()) return;
    const res = await renameTag(id, editingText.trim());
    if (res.success) {
      setTags(prev => prev.map(t => t.id === id ? { ...t, name: editingText.trim() } : t));
      setEditingId(null);
      addToast("success", "Tag Renamed", `Renamed tag to "${editingText.trim()}".`);
      onTagsUpdated?.();
    } else {
      addToast("error", "Failed", res.error || "Could not rename tag.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;
    const res = await deleteTag(id);
    if (res.success) {
      setTags(prev => prev.filter(t => t.id !== id));
      addToast("info", "Tag Deleted", "Removed tag.");
      onTagsUpdated?.();
    } else {
      addToast("error", "Failed", res.error || "Could not delete tag.");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    const res = await createTag(newTagName.trim());
    if (res.success) {
      addToast("success", "Tag Created", `Created tag "${newTagName.trim()}".`);
      setNewTagName("");
      setShowCreateRow(false);
      loadTags();
      onTagsUpdated?.();
    } else {
      addToast("error", "Failed", res.error || "Could not create tag.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 relative">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 absolute right-4 top-4 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-slate-900">Manage tags: Products</h2>
          <p className="text-xs text-slate-500 mt-1">Edit, remove and create tags.</p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-1">
          {isLoading ? (
            <div className="py-12 flex justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            filteredTags.map((t) => {
              const isEditing = editingId === t.id;
              const isSelected = selectedTagIds.includes(t.id);
              return (
                <div key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="px-3 py-1 text-sm border-2 border-blue-500 rounded-lg focus:outline-hidden w-full font-medium"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(t.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSaveEdit(t.id)}
                        className="p-1 text-blue-600 hover:text-blue-700 rounded-full"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        {onToggleTag && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleTag(t.id)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                        )}
                        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                          {t.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(t)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full border border-blue-200 transition-colors"
                          title="Edit tag"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 text-blue-600 hover:text-red-600 hover:bg-red-50 rounded-full border border-blue-200 hover:border-red-200 transition-colors"
                          title="Delete tag"
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

          {/* Inline Create Row */}
          {showCreateRow && (
            <form onSubmit={handleCreate} className="py-2.5 flex items-center gap-2">
              <input
                type="text"
                placeholder="New tag..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newTagName.trim()}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowCreateRow(false)}
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
            onClick={() => setShowCreateRow(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" /> Create Tag
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
