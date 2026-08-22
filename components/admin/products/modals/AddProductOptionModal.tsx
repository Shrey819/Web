"use client";

import { useState, useEffect } from "react";
import { X, GripVertical, Trash2, Plus, HelpCircle, Palette } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";

interface OptionChoiceDraft {
  id?: string;
  name: string;
  colorHex?: string;
}

interface AddProductOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export function AddProductOptionModal({
  isOpen,
  onClose,
  initialOption,
  onSave,
}: AddProductOptionModalProps) {
  const { addToast } = useToastStore();
  const [optionName, setOptionName] = useState("");
  const [fieldType, setFieldType] = useState<"TEXT_CHOICES" | "SWATCH_CHOICES">("TEXT_CHOICES");
  const [choices, setChoices] = useState<OptionChoiceDraft[]>([
    { name: "", colorHex: "#3b82f6" },
  ]);

  useEffect(() => {
    if (isOpen) {
      if (initialOption) {
        setOptionName(initialOption.name || "");
        setFieldType(initialOption.fieldType || "TEXT_CHOICES");
        setChoices(
          initialOption.choices && initialOption.choices.length > 0
            ? initialOption.choices
            : [{ name: "", colorHex: "#3b82f6" }]
        );
      } else {
        setOptionName("");
        setFieldType("TEXT_CHOICES");
        setChoices([{ name: "", colorHex: "#3b82f6" }]);
      }
    }
  }, [isOpen, initialOption]);

  if (!isOpen) return null;

  const handleAddChoice = () => {
    setChoices((prev) => [...prev, { name: "", colorHex: "#10b981" }]);
  };

  const handleUpdateChoice = (index: number, name: string, colorHex?: string) => {
    setChoices((prev) =>
      prev.map((c, i) =>
        i === index
          ? {
              ...c,
              name,
              colorHex: colorHex !== undefined ? colorHex : c.colorHex,
            }
          : c
      )
    );
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionName.trim()) {
      addToast("warning", "Name Required", "Please provide an option name.");
      return;
    }

    const validChoices = choices
      .map((c) => ({
        ...c,
        name: c.name.trim(),
        colorHex: fieldType === "SWATCH_CHOICES" ? c.colorHex || "#3b82f6" : undefined,
      }))
      .filter((c) => Boolean(c.name));

    if (validChoices.length === 0) {
      addToast("warning", "Choices Required", "Add at least 1 choice value.");
      return;
    }

    onSave({
      id: initialOption?.id,
      name: optionName.trim(),
      fieldType,
      choices: validChoices,
    });
    onClose();
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
          <h2 className="text-lg font-bold text-slate-900">
            {initialOption?.id ? "Edit product option" : "Add product option"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            You&apos;ll be able to manage pricing and inventory for this product option later on.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Option Name & Field Type Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Option name *</span>
                <span className="text-slate-400 font-normal">{optionName.length} / 50</span>
              </div>
              <input
                type="text"
                placeholder="e.g. Color or Size"
                value={optionName}
                onChange={(e) => setOptionName(e.target.value)}
                maxLength={50}
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Field type</label>
              <select
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value as any)}
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
              >
                <option value="TEXT_CHOICES">Text choices</option>
                <option value="SWATCH_CHOICES">Color swatches</option>
              </select>
            </div>
          </div>

          {/* Choices Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Choices *</label>
              {choices.length > 1 && (
                <button
                  type="button"
                  onClick={handleRemoveAll}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Remove all
                </button>
              )}
            </div>

            <div className="space-y-2">
              {choices.map((choice, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="text-slate-300 cursor-grab">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <div className="flex-1 relative flex items-center">
                    <input
                      type="text"
                      placeholder={fieldType === "SWATCH_CHOICES" ? "e.g., Red or Green" : "e.g., Small, Medium or 4"}
                      value={choice.name}
                      onChange={(e) => handleUpdateChoice(idx, e.target.value)}
                      className="w-full pl-3 pr-10 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />

                    {fieldType === "SWATCH_CHOICES" && (
                      <div className="absolute right-2 flex items-center">
                        <label
                          className="w-6 h-6 rounded-md cursor-pointer border border-slate-300 shadow-xs flex items-center justify-center overflow-hidden"
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
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddChoice}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 pt-1"
            >
              <Plus className="w-4 h-4" /> Another Choice
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              {initialOption?.id ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
