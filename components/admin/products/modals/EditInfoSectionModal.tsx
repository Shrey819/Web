"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { createInfoSection, updateInfoSection } from "@/app/actions/productManagement";
import { useToastStore } from "@/store/useToastStore";
import { WixRichTextEditor } from "../WixRichTextEditor";

interface InfoSectionItem {
  id?: string;
  internalName: string;
  title: string;
  content: string;
  productCount?: number;
}

interface EditInfoSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section?: InfoSectionItem | null;
  onSaved?: (savedSection: { id: string; title: string; internalName: string; content: string }) => void;
}

export function EditInfoSectionModal({ isOpen, onClose, section, onSaved }: EditInfoSectionModalProps) {
  const { addToast } = useToastStore();
  const [title, setTitle] = useState("");
  const [internalName, setInternalName] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (section) {
        setTitle(section.title || "");
        setInternalName(section.internalName || section.title || "");
        setContent(section.content || "");
      } else {
        setTitle("");
        setInternalName("");
        setContent("");
      }
    }
  }, [isOpen, section]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast("warning", "Title Required", "Please enter a section title.");
      return;
    }

    setIsSaving(true);
    try {
      if (section?.id) {
        const res = await updateInfoSection(section.id, internalName, title, content);
        if (res.success) {
          addToast("success", "Section Updated", `"${title}" has been updated.`);
          if (onSaved) onSaved({ id: section.id, title, internalName, content });
          onClose();
        } else {
          addToast("error", "Update Failed", res.error || "Could not update section.");
        }
      } else {
        const res = await createInfoSection(internalName, title, content);
        if (res.success && res.id) {
          addToast("success", "Section Created", `"${title}" has been created.`);
          if (onSaved) onSaved({ id: res.id, title, internalName, content });
          onClose();
        } else {
          addToast("error", "Creation Failed", res.error || "Could not create section.");
        }
      }
    } catch (err: any) {
      addToast("error", "Error", err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 text-slate-800 dark:text-slate-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {section?.id ? "Edit info section" : "Add info section"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Usage Alert Banner */}
          {section?.id && (
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/60 rounded-lg text-xs text-blue-900 dark:text-blue-300 font-medium leading-relaxed">
              This info section is currently assigned to {section.productCount ?? 12} products. Changes you make here will apply to all of them.
            </div>
          )}

          {/* Title & Internal Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Title *</span>
                <span className="text-slate-400 dark:text-slate-500 font-normal">{title.length} / 50</span>
              </div>
              <input
                type="text"
                placeholder="e.g. Return & Refund Policy"
                value={title}
                maxLength={50}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white placeholder-slate-400"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Name (internal) *</span>
                <span className="text-slate-400 dark:text-slate-500 font-normal">{internalName.length} / 100</span>
              </div>
              <input
                type="text"
                placeholder="e.g. Standard Return Policy"
                value={internalName}
                maxLength={100}
                onChange={(e) => setInternalName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
          </div>

          {/* Rich Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
            <WixRichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Write detailed section contents here..."
              maxLength={500}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="px-6 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
