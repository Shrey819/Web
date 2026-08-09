"use client";

import { useState } from "react";
import { createCategory, updateCategory, deleteCategory, toggleCategoryVisibility } from "@/app/actions/category";
import { useToastStore } from "@/store/useToastStore";
import { Plus, Edit2, Trash2, FolderTree, Loader2, Save, X, Package, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { CategoryProductsModal } from "./CategoryProductsModal";
import { DeleteCategoryReassignModal } from "./DeleteCategoryReassignModal";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status?: string;
  product_count: number;
}

interface CategoryManagerProps {
  categories: CategoryItem[];
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategoryForProducts, setSelectedCategoryForProducts] = useState<CategoryItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);

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

  const handleToggleVisibility = async (cat: CategoryItem) => {
    const isCurrentlyHidden = cat.status === "hidden";
    const willHide = !isCurrentlyHidden;

    setIsSubmitting(true);
    try {
      const res = await toggleCategoryVisibility(cat.id, willHide);
      if (res.success) {
        addToast(
          "info",
          willHide ? "Category Hidden" : "Category Unhidden",
          willHide
            ? `Category "${cat.name}" is now hidden. Unique products in this category are hidden from storefront.`
            : `Category "${cat.name}" is now visible to all users.`
        );
        router.refresh();
      } else {
        addToast("error", "Toggle Failed", res.error || "Could not toggle category visibility.");
      }
    } finally {
      setIsSubmitting(false);
    }
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
          router.refresh();
        } else {
          addToast("error", "Update Failed", res.error || "Could not update category.");
        }
      } else {
        const res = await createCategory(name, description);
        if (res.success) {
          addToast("success", "Category Created", `Category "${name}" created.`);
          resetForm();
          router.refresh();
        } else {
          addToast("error", "Creation Failed", res.error || "Could not create category.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (cat: CategoryItem) => {
    if (cat.product_count > 0) {
      setDeletingCategory(cat);
    } else {
      if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
      setIsSubmitting(true);
      try {
        const res = await deleteCategory(cat.id);
        if (res.success) {
          addToast("info", "Category Deleted", `Category "${cat.name}" removed.`);
          router.refresh();
        } else {
          addToast("error", "Delete Failed", res.error || "Could not delete category.");
        }
      } finally {
        setIsSubmitting(false);
      }
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
            <p className="text-xs text-slate-400">Add, edit, toggle hide/show, click any category to view its products and apply filters</p>
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
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-center">Associated Products</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <FolderTree className="w-8 h-8 mx-auto mb-2 opacity-50 text-amber-500" />
                    No categories found. Click "Add Category" above to create one.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => {
                  const isHidden = cat.status === "hidden";
                  return (
                    <tr key={cat.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-6 py-4 font-bold text-white">
                        <button
                          onClick={() => setSelectedCategoryForProducts(cat)}
                          className="text-left font-bold text-white hover:text-sky-400 flex items-center gap-2 transition-colors group-hover:underline"
                          title="Click to view all products in this category"
                        >
                          <span>{cat.name}</span>
                          <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-sky-400 transition-opacity" />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {isHidden ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px] font-bold uppercase inline-flex items-center gap-1">
                            <EyeOff className="w-3 h-3 text-amber-400" /> Hidden
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold uppercase inline-flex items-center gap-1">
                            <Eye className="w-3 h-3 text-emerald-400" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400 text-[11px]">
                        {cat.slug}
                      </td>
                      <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                        {cat.description || "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedCategoryForProducts(cat)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 hover:bg-sky-950/60 text-slate-300 hover:text-sky-300 font-mono text-[11px] border border-slate-700 hover:border-sky-500/40 transition-colors cursor-pointer"
                          title="View Category Products"
                        >
                          <Package className="w-3.5 h-3.5 text-sky-400" />
                          <span>{cat.product_count} items</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Hide / Show Category Toggle */}
                          <button
                            onClick={() => handleToggleVisibility(cat)}
                            disabled={isSubmitting}
                            className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${
                              isHidden
                                ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            }`}
                            title={isHidden ? "Unhide & Show Category on Storefront" : "Hide Category on Storefront"}
                          >
                            {isHidden ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                            <span className="hidden sm:inline text-[11px] font-mono">{isHidden ? "Show" : "Hide"}</span>
                          </button>

                          <button
                            onClick={() => setSelectedCategoryForProducts(cat)}
                            className="p-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 transition-colors flex items-center gap-1 text-xs font-semibold"
                            title="View Products & Apply Filters"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline text-[11px]">View</span>
                          </button>
                          <button
                            onClick={() => handleStartEdit(cat)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(cat)}
                            disabled={isSubmitting}
                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors disabled:opacity-50"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Products Modal */}
      {selectedCategoryForProducts && (
        <CategoryProductsModal
          category={selectedCategoryForProducts}
          onClose={() => setSelectedCategoryForProducts(null)}
        />
      )}

      {/* Safe Category Deletion Reassignment Modal */}
      {deletingCategory && (
        <DeleteCategoryReassignModal
          categoryToDelete={deletingCategory}
          categories={categories}
          onClose={() => setDeletingCategory(null)}
          onSuccess={() => {
            setDeletingCategory(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

