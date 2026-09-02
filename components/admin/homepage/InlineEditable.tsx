"use client";

import React, { useState, useRef, useEffect } from "react";
import { Edit3 } from "lucide-react";

interface InlineEditableProps {
  value: string | undefined | null;
  onChange: (newValue: string) => void;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "div";
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  label?: string;
  style?: React.CSSProperties;
}

export function InlineEditable({
  value,
  onChange,
  as: Component = "span",
  className = "",
  placeholder = "Double-click to enter text...",
  multiline = false,
  label,
  style,
}: InlineEditableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(value || "");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    const nextVal = value || "";
    setCurrentText((prev) => (prev !== nextVal ? nextVal : prev));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditing(true);
  };

  const handleCommit = () => {
    setIsEditing(false);
    if (currentText !== value) {
      onChange(currentText);
    }
  };

  const handleCancel = () => {
    setCurrentText(value || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      handleCancel();
    } else if (e.key === "Enter") {
      if (!multiline || (!e.shiftKey && !e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        handleCommit();
      }
    }
  };

  if (isEditing) {
    if (multiline) {
      return (
        <div className="relative inline-block w-full" onClick={(e) => e.stopPropagation()}>
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            rows={3}
            className={`w-full bg-amber-50 dark:bg-slate-900 text-slate-900 dark:text-amber-100 border-2 border-amber-500 rounded-md p-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-inherit resize-y text-inherit ${className}`}
            style={style}
          />
          <div className="absolute -top-6 right-0 bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 pointer-events-none z-30">
            <span>Press Enter to Save • Esc to Cancel</span>
          </div>
        </div>
      );
    }

    return (
      <div className="relative inline-block w-full max-w-full" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={handleKeyDown}
          className={`w-full bg-amber-50 dark:bg-slate-900 text-slate-900 dark:text-amber-100 border-2 border-amber-500 rounded px-2 py-0.5 shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-inherit text-inherit ${className}`}
          style={style}
        />
        <div className="absolute -top-6 left-0 bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 pointer-events-none z-30 whitespace-nowrap">
          <span>Enter to Save • Esc to Cancel</span>
        </div>
      </div>
    );
  }

  const displayText = currentText || placeholder;
  const isPlaceholder = !currentText;

  return (
    <Component
      onDoubleClick={handleDoubleClick}
      title={label || "Double-click to edit text"}
      className={`group relative transition-all duration-150 rounded cursor-pointer outline-dashed outline-1 outline-transparent hover:outline-amber-400/70 hover:bg-amber-400/10 hover:shadow-[0_0_0_2px_rgba(251,191,36,0.2)] ${
        isPlaceholder ? "opacity-60 italic" : ""
      } ${className}`}
      style={style}
    >
      {displayText}
      {/* Subtle indicator icon on hover */}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 inline-flex items-center text-amber-500 align-middle pointer-events-none">
        <Edit3 className="w-3 h-3" />
      </span>
    </Component>
  );
}
