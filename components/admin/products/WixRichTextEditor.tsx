"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  Highlighter,
} from "lucide-react";

// Wix-style List Icons
function WixNumberedListIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <text x="0.5" y="6" fontSize="6" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">1</text>
      <rect x="5.5" y="3.2" width="9" height="1.6" rx="0.4" fill="currentColor" />
      <text x="0.5" y="13.5" fontSize="6" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">2</text>
      <rect x="5.5" y="8" width="9" height="1.6" rx="0.4" fill="currentColor" />
      <rect x="5.5" y="12.5" width="9" height="1.6" rx="0.4" fill="currentColor" />
    </svg>
  );
}

function WixBulletListIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <circle cx="2.5" cy="4" r="1.5" fill="currentColor" />
      <circle cx="2.5" cy="8.5" r="1.5" fill="currentColor" />
      <circle cx="2.5" cy="13" r="1.5" fill="currentColor" />
      <rect x="6" y="3.2" width="8.5" height="1.6" rx="0.4" fill="currentColor" />
      <rect x="6" y="7.7" width="8.5" height="1.6" rx="0.4" fill="currentColor" />
      <rect x="6" y="12.2" width="8.5" height="1.6" rx="0.4" fill="currentColor" />
    </svg>
  );
}

interface WixRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

export function WixRichTextEditor({
  value,
  onChange,
  placeholder = "Write product description...",
  className = "",
  maxLength,
}: WixRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const [isFocused, setIsFocused] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [currentTextColor, setCurrentTextColor] = useState("#000000");
  const [currentBgColor, setCurrentBgColor] = useState("transparent");

  // Active toolbar states
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    orderedList: false,
    unorderedList: false,
  });

  // Save current caret / selection range
  const saveSelection = () => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Restore saved caret / selection range
  const restoreSelection = () => {
    if (typeof window === "undefined" || !savedRangeRef.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  // Check current selection states to highlight active buttons in toolbar
  const updateToolbarStates = useCallback(() => {
    if (typeof document === "undefined") return;
    try {
      setActiveStates({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        orderedList: document.queryCommandState("insertOrderedList"),
        unorderedList: document.queryCommandState("insertUnorderedList"),
      });

      const colorVal = document.queryCommandValue("foreColor");
      if (colorVal) {
        setCurrentTextColor(colorVal);
      }
    } catch {
      // Ignore if selection is outside
    }
  }, []);

  // Sync incoming value to editor content if external change occurs
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (document.activeElement === editorRef.current) {
        saveSelection();
        updateToolbarStates();
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [updateToolbarStates]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const cleanHtml = html === "<p><br></p>" || html === "<br>" ? "" : html;
      onChange(cleanHtml);
      updateToolbarStates();
    }
  };

  const exec = (command: string, val: string | null = null) => {
    if (editorRef.current) {
      editorRef.current.focus();

      const inner = editorRef.current.innerHTML.trim();
      const isEmpty = !inner || inner === "<br>" || inner === "<p><br></p>" || inner === "<div><br></div>";

      if (isEmpty && (command === "insertOrderedList" || command === "insertUnorderedList")) {
        const tag = command === "insertOrderedList" ? "ol" : "ul";
        editorRef.current.innerHTML = `<${tag}><li><br></li></${tag}>`;
        const li = editorRef.current.querySelector("li");
        if (li) {
          const range = document.createRange();
          range.selectNodeContents(li);
          range.collapse(false);
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
        handleInput();
        saveSelection();
        updateToolbarStates();
        return;
      }

      restoreSelection();
    }

    try {
      document.execCommand(command, false, val || undefined);
    } catch (e) {
      console.warn("execCommand error:", e);
    }

    handleInput();
    saveSelection();
    updateToolbarStates();
  };

  const handleApplyColor = (color: string) => {
    setCurrentTextColor(color);
    if (editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
    }

    const sel = window.getSelection();
    if (sel && sel.isCollapsed && sel.rangeCount > 0) {
      const span = document.createElement("span");
      span.style.color = color;
      span.innerHTML = "\u200B";
      const range = sel.getRangeAt(0);
      range.insertNode(span);
      range.selectNodeContents(span);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      document.execCommand("foreColor", false, color);
    }

    handleInput();
    saveSelection();
    setShowColorPicker(false);
  };

  const handleApplyBgColor = (bgColor: string) => {
    setCurrentBgColor(bgColor);
    if (editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
    }

    const sel = window.getSelection();
    if (sel && sel.isCollapsed && sel.rangeCount > 0 && bgColor !== "transparent") {
      const span = document.createElement("span");
      span.style.backgroundColor = bgColor;
      span.innerHTML = "\u200B";
      const range = sel.getRangeAt(0);
      range.insertNode(span);
      range.selectNodeContents(span);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      document.execCommand("hiliteColor", false, bgColor);
    }

    handleInput();
    saveSelection();
    setShowBgColorPicker(false);
  };

  const handleLink = () => {
    saveSelection();
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString().trim() : "";

    const url = prompt("Enter URL:", "https://");
    if (!url || url.trim() === "" || url.trim() === "https://") return;

    const cleanUrl =
      url.trim().startsWith("http://") ||
      url.trim().startsWith("https://") ||
      url.trim().startsWith("mailto:") ||
      url.trim().startsWith("/")
        ? url.trim()
        : `https://${url.trim()}`;

    if (!selectedText) {
      if (editorRef.current) {
        editorRef.current.focus();
        restoreSelection();
        const anchor = document.createElement("a");
        anchor.href = cleanUrl;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.textContent = cleanUrl;

        const selObj = window.getSelection();
        if (selObj && selObj.rangeCount > 0) {
          const range = selObj.getRangeAt(0);
          range.insertNode(anchor);
          range.selectNodeContents(anchor);
          range.collapse(false);
          selObj.removeAllRanges();
          selObj.addRange(range);
        } else {
          editorRef.current.appendChild(anchor);
        }
      }
    } else {
      exec("createLink", cleanUrl);
      if (editorRef.current) {
        const links = editorRef.current.querySelectorAll("a");
        links.forEach((a) => {
          if (!a.getAttribute("target")) {
            a.setAttribute("target", "_blank");
            a.setAttribute("rel", "noopener noreferrer");
          }
        });
      }
    }

    handleInput();
    saveSelection();
    updateToolbarStates();
  };

  const currentLength = (value || "").replace(/<[^>]*>?/gm, "").length;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Character limit enforcement
    if (maxLength && maxLength > 0) {
      const isNavOrControl =
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "Tab" ||
        e.key === "Escape" ||
        e.ctrlKey ||
        e.metaKey;

      if (!isNavOrControl) {
        const sel = window.getSelection();
        const isReplacingSelection = sel && sel.toString().length > 0;
        if (currentLength >= maxLength && !isReplacingSelection) {
          e.preventDefault();
          return;
        }
      }
    }

    // Handle Tab for list indentation
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        document.execCommand("outdent");
      } else {
        document.execCommand("indent");
      }
      handleInput();
      updateToolbarStates();
      return;
    }

    // Handle Shift+Enter for soft line break inside list item
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      document.execCommand("insertLineBreak");
      handleInput();
      updateToolbarStates();
      return;
    }

    // Handle Enter on empty list item to break out
    if (e.key === "Enter" && !e.shiftKey) {
      const sel = window.getSelection();
      if (sel && sel.anchorNode) {
        let node: Node | null = sel.anchorNode;
        while (node && node !== editorRef.current && node.nodeName !== "LI") {
          node = node.parentNode;
        }
        if (node && node.nodeName === "LI" && (node.textContent?.trim() === "" || node.textContent === "\u200B")) {
          e.preventDefault();
          document.execCommand("outdent");
          handleInput();
          updateToolbarStates();
          return;
        }
      }
    }
  };

  const textColors = [
    { label: "Black", hex: "#000000" },
    { label: "Yellow", hex: "#eab308" },
    { label: "Blue", hex: "#2563eb" },
    { label: "Green", hex: "#16a34a" },
    { label: "Red", hex: "#dc2626" },
    { label: "Purple", hex: "#9333ea" },
    { label: "Orange", hex: "#ea580c" },
    { label: "Dark Gray", hex: "#334155" },
  ];

  const bgColors = [
    { label: "None", hex: "transparent" },
    { label: "Light Yellow", hex: "#fef08a" },
    { label: "Light Green", hex: "#bbf7d0" },
    { label: "Light Blue", hex: "#bfdbfe" },
    { label: "Light Pink", hex: "#fbcfe8" },
    { label: "Light Orange", hex: "#fed7aa" },
    { label: "Light Gray", hex: "#e2e8f0" },
  ];

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all bg-white flex flex-col ${
        isFocused
          ? "border-blue-500 ring-2 ring-blue-500/20"
          : "border-slate-200 hover:border-slate-300"
      } ${className}`}
    >
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-1 p-2 bg-slate-50/90 border-b border-slate-200 select-none relative">
        {/* Bold */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("bold");
          }}
          className={`w-7 h-7 flex items-center justify-center rounded-md font-bold text-xs transition-colors cursor-pointer ${
            activeStates.bold
              ? "bg-blue-600 text-white shadow-2xs"
              : "text-slate-700 hover:bg-slate-200"
          }`}
          title="Bold (Ctrl+B)"
        >
          <span className="font-bold text-sm">B</span>
        </button>

        {/* Italic */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("italic");
          }}
          className={`w-7 h-7 flex items-center justify-center rounded-md text-xs italic font-serif transition-colors cursor-pointer ${
            activeStates.italic
              ? "bg-blue-600 text-white shadow-2xs"
              : "text-slate-700 hover:bg-slate-200"
          }`}
          title="Italic (Ctrl+I)"
        >
          <span className="italic font-serif text-sm font-semibold">I</span>
        </button>

        {/* Underline */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("underline");
          }}
          className={`w-7 h-7 flex items-center justify-center rounded-md text-xs transition-colors cursor-pointer ${
            activeStates.underline
              ? "bg-blue-600 text-white shadow-2xs"
              : "text-slate-700 hover:bg-slate-200"
          }`}
          title="Underline (Ctrl+U)"
        >
          <span className="underline text-sm font-semibold">U</span>
        </button>

        {/* Text Color Picker (A) */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
              setShowColorPicker(!showColorPicker);
              setShowBgColorPicker(false);
            }}
            className="w-7 h-7 flex flex-col items-center justify-center rounded-md text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
            title="Text color"
          >
            <span className="text-sm font-bold leading-none">A</span>
            <div
              className="w-4 h-1 mt-0.5 rounded-xs shadow-2xs"
              style={{ backgroundColor: currentTextColor }}
            />
          </button>

          {showColorPicker && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className="absolute left-0 top-9 z-30 p-2.5 bg-white rounded-xl shadow-2xl border border-slate-200 w-44 space-y-2 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Text Color</div>
              <div className="grid grid-cols-4 gap-2">
                {textColors.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    title={col.label}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleApplyColor(col.hex);
                    }}
                    className="w-7 h-7 rounded-lg border border-slate-200 shadow-2xs hover:scale-110 transition-transform cursor-pointer flex items-center justify-center"
                    style={{ backgroundColor: col.hex }}
                  >
                    {currentTextColor.toLowerCase() === col.hex.toLowerCase() && (
                      <span className={`text-xs ${col.hex === '#000000' || col.hex === '#334155' || col.hex === '#2563eb' ? 'text-white' : 'text-black'}`}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Highlight Color Picker */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
              setShowBgColorPicker(!showBgColorPicker);
              setShowColorPicker(false);
            }}
            className="w-7 h-7 flex flex-col items-center justify-center rounded-md text-slate-700 hover:bg-slate-200 text-xs cursor-pointer"
            title="Highlight color"
          >
            <Highlighter className="w-3.5 h-3.5 text-slate-700" />
            <div
              className="w-4 h-1 mt-0.5 rounded-xs shadow-2xs"
              style={{ backgroundColor: currentBgColor === "transparent" ? "#fef08a" : currentBgColor }}
            />
          </button>

          {showBgColorPicker && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className="absolute left-0 top-9 z-30 p-2.5 bg-white rounded-xl shadow-2xl border border-slate-200 w-44 space-y-2 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Highlight Color</div>
              <div className="grid grid-cols-4 gap-2">
                {bgColors.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    title={col.label}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleApplyBgColor(col.hex);
                    }}
                    className="w-7 h-7 rounded-lg border border-slate-200 shadow-2xs hover:scale-110 transition-transform cursor-pointer flex items-center justify-center text-xs text-slate-600 font-bold"
                    style={{ backgroundColor: col.hex }}
                  >
                    {col.hex === "transparent" ? "✕" : (currentBgColor.toLowerCase() === col.hex.toLowerCase() ? "✓" : "")}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Link */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleLink();
          }}
          className="w-7 h-7 flex items-center justify-center rounded-md text-slate-700 hover:bg-slate-200 cursor-pointer"
          title="Insert Link"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        {/* Numbered List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("insertOrderedList");
          }}
          className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
            activeStates.orderedList
              ? "bg-blue-600 text-white shadow-2xs"
              : "text-slate-700 hover:bg-slate-200"
          }`}
          title="Numbered List"
        >
          <WixNumberedListIcon className="w-4 h-4" />
        </button>

        {/* Bullet List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("insertUnorderedList");
          }}
          className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
            activeStates.unorderedList
              ? "bg-blue-600 text-white shadow-2xs"
              : "text-slate-700 hover:bg-slate-200"
          }`}
          title="Bullet List"
        >
          <WixBulletListIcon className="w-4 h-4" />
        </button>

        {/* Character Count Indicator */}
        {maxLength != null && maxLength > 0 && (
          <div className="ml-auto pl-2">
            <span
              className={`text-[11px] font-semibold select-none px-2 py-0.5 rounded-md ${
                currentLength > maxLength
                  ? "bg-red-50 text-red-600 font-bold border border-red-200"
                  : currentLength >= maxLength * 0.9
                  ? "bg-amber-50 text-amber-700"
                  : "text-slate-400"
              }`}
            >
              {currentLength} / {maxLength}
            </span>
          </div>
        )}
      </div>

      {/* Editable Viewport */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setIsFocused(true);
          saveSelection();
        }}
        onBlur={() => {
          setIsFocused(false);
          setShowColorPicker(false);
          setShowBgColorPicker(false);
          handleInput();
        }}
        onKeyUp={() => {
          saveSelection();
          updateToolbarStates();
        }}
        onMouseUp={() => {
          saveSelection();
          updateToolbarStates();
        }}
        className="wix-rich-editor w-full min-h-[140px] max-h-[360px] overflow-y-auto p-4 text-sm text-slate-900 focus:outline-hidden leading-relaxed"
        data-placeholder={placeholder}
        style={{
          outline: "none",
        }}
      />
    </div>
  );
}
