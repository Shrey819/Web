"use client";

import { useState } from "react";
import { createCategory, updateCategory, deleteCategory } from "@/app/actions/category";
import { useToastStore } from "@/store/useToastStore";
import { Plus, Edit2, Trash2, FolderTree, Loader2, Save, X, Package } from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  product_count: number;
}

interface CategoryManagerProps {
  categories: CategoryItem[];
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const { addToast } = useToastStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setIsCreating(false);
    setEditingId(null);
  };

  const handleStartEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
    setIsCreating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        const res = await updateCategory(editingId, name, description);
        if (res.success) {
          addToast("success", "Category Updated", "Category changes saved.");
          resetForm();
        } else {
          addToast("error", "Update Failed", res.error || "Could not update category.");
        }
      } else {
        const res = await createCategory(name, description);
        if (res.success) {
          addToast("success", "Category Created", `Category "${name}" created.`);
          resetForm();
        } else {
          addToast("error", "Creation Failed", res.error || "Could not create category.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return;
    setIsSubmitting(true);
    try {
      const res = await deleteCategory(id);
      if (res.success) {
        addToast("info", "Category Deleted", `Category "${catName}" removed.`);
      } else {
        addToast("error", "Delete Failed", res.error || "Could not delete category.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Manage Product Categories</h1>
            <p className="text-xs text-slate-400">Add, edit, or reorganize hardware categories</p>
          </div>
        </div>

        {!isCreating && !editingId && (
          <button
            onClick={() => {
              resetForm();
              setIsCreating(true);
            }}
            className="px-4 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        )}
      </div>

      {/* Add / Edit Form Card */}
      {(isCreating || editingId) && (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-amber-400" />
              {editingId ? "Edit Category" : "Create New Category"}
            </h3>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Category Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sensors & Perception"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Inductive, photoelectric, and laser sensors"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? "Update Category" : "Save Category"}
            </button>
          </div>
        </form>
      )}

      {/* Category Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Category Name</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-center">Associated Products</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <FolderTree className="w-8 h-8 mx-auto mb-2 opacity-50 text-amber-500" />
                    No categories found. Click "Add Category" above to create one.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">
                      {cat.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400 text-[11px]">
                      {cat.slug}
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                      {cat.description || "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px]">
                        <Package className="w-3 h-3 text-slate-400" />
                        {cat.product_count} items
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleStartEdit(cat)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          disabled={isSubmitting}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors disabled:opacity-50"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
