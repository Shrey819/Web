"use client";

import { useState } from "react";
import { Search, X, GripVertical, Info, Check } from "lucide-react";

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  required?: boolean;
  hasInfo?: boolean;
}

interface CustomizeColumnsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnConfig[];
  onChange: (updatedColumns: ColumnConfig[]) => void;
}

export function CustomizeColumnsDrawer({
  isOpen,
  onClose,
  columns,
  onChange,
}: CustomizeColumnsDrawerProps) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredColumns = columns.filter((col) =>
    col.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (id: string) => {
    const updated = columns.map((c) =>
      c.id === id && !c.required ? { ...c, visible: !c.visible } : c
    );
    onChange(updated);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const newCols = [...columns];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newCols.length) return;
    const temp = newCols[index];
    newCols[index] = newCols[targetIdx];
    newCols[targetIdx] = temp;
    onChange(newCols);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/25 backdrop-blur-2xs transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Customize columns</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select which columns to show, or drag them into a different order.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors -mr-1"
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
                placeholder="Search columns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Column Items */}
          <div className="p-3 overflow-y-auto flex-1 divide-y divide-slate-50 space-y-1">
            {filteredColumns.map((col, idx) => (
              <div
                key={col.id}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="text-slate-300 group-hover:text-slate-500 cursor-grab">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <input
                    type="checkbox"
                    checked={col.visible}
                    disabled={col.required}
                    onChange={() => handleToggle(col.id)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                  />
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    {col.label}
                    {col.hasInfo && <Info className="w-3 h-3 text-slate-400" />}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, "up")}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 text-xs"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={idx === filteredColumns.length - 1}
                    onClick={() => handleMove(idx, "down")}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 text-xs"
                  >
                    ▼
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
            <button
              onClick={onClose}
              className="px-5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
