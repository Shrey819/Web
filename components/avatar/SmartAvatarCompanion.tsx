"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AvatarMascot, type AvatarAnimation, type AvatarMascotHandle } from "./AvatarMascot";
import { AvatarChatbot } from "./AvatarChatbot";
import { useCartStore } from "@/store/useCartStore";
import { useQuickViewStore } from "@/store/useQuickViewStore";
import {
  X,
  ChevronUp,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

export function SmartAvatarCompanion() {
  const mascotRef = useRef<AvatarMascotHandle>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [avatarMood, setAvatarMood] = useState<AvatarAnimation>("idle");
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });

  // Popup / Drawer / Menu detection to suppress avatar & messages while open
  const isCartOpen = useCartStore((s) => s.isOpen);
  const isQuickViewOpen = useQuickViewStore((s) => s.isOpen);
  const [isAnyPopupOpen, setIsAnyPopupOpen] = useState(false);

  // User Drag-and-Drop & Anger Return States
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [dropPosition, setDropPosition] = useState<{ x: number; y: number } | null>(null);
  const [isAngry, setIsAngry] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const isPointerDownRef = useRef(false);
  const isActuallyDraggingRef = useRef(false);
  const dragStartPointerRef = useRef({ x: 0, y: 0 });
  const dragInitialAvatarRef = useRef({ x: 0, y: 0 });

  const angerTimer1Ref = useRef<NodeJS.Timeout | null>(null);
  const angerTimer2Ref = useRef<NodeJS.Timeout | null>(null);
  const angerTimer3Ref = useRef<NodeJS.Timeout | null>(null);

  // Speech bubble state with auto-dismiss
  const [bubbleText, setBubbleText] = useState<string | null>("Hi! I'm Kilby ⚡ How can I help?");
  const [bubbleAction, setBubbleAction] = useState<{ label: string; href?: string } | null>(null);
  const [isBubbleVisible, setIsBubbleVisible] = useState(true);

  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Window resize handler to maintain exact right-corner coordinates
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const clearAllAngerTimers = useCallback(() => {
    if (angerTimer1Ref.current) {
      clearTimeout(angerTimer1Ref.current);
      angerTimer1Ref.current = null;
    }
    if (angerTimer2Ref.current) {
      clearTimeout(angerTimer2Ref.current);
      angerTimer2Ref.current = null;
    }
    if (angerTimer3Ref.current) {
      clearTimeout(angerTimer3Ref.current);
      angerTimer3Ref.current = null;
    }
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearAllAngerTimers();
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [clearAllAngerTimers]);

  // Restore user minimized preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("om_avatar_minimized");
      if (saved === "true") {
        setIsMinimized(true);
      }
    } catch {
      // Ignore in private browsing
    }
  }, []);

  const toggleMinimize = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = !isMinimized;
    setIsMinimized(next);
    if (next) setIsChatOpen(false);
    try {
      localStorage.setItem("om_avatar_minimized", String(next));
    } catch {
      // Ignore
    }
  };

  // Helper: Show polite speech bubble that auto-dismisses
  const showBubble = useCallback(
    (text: string, actionLabel?: string, actionHref?: string, durationMs = 4500) => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      setBubbleText(text);
      if (actionLabel) {
        setBubbleAction({ label: actionLabel, href: actionHref });
      } else {
        setBubbleAction(null);
      }
      setIsBubbleVisible(true);

      dismissTimerRef.current = setTimeout(() => {
        setIsBubbleVisible(false);
      }, durationMs);
    },
    []
  );

  const hideBubble = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    setIsBubbleVisible(false);
  }, []);

  // Universal Popup / Menu / Cart Drawer Detection
  const checkPopups = useCallback(() => {
    if (typeof document === "undefined") return false;
    const body = document.body;
    const isBodyLocked = body.style.overflow === "hidden" || body.style.position === "fixed";
    const hasMenuAttr = body.getAttribute("data-menu-open") === "true";
    const hasCartAttr = body.getAttribute("data-cart-open") === "true";
    const hasBackdrop = Boolean(
      document.querySelector(
        "[data-mobile-nav='open'], [data-cart-drawer='open'], [role='dialog'], [aria-modal='true'], .fixed.inset-0.bg-slate-950\\/70"
      )
    );
    const cartOpen = useCartStore.getState().isOpen;
    const quickViewOpen = useQuickViewStore.getState().isOpen;

    return isBodyLocked || hasMenuAttr || hasCartAttr || hasBackdrop || cartOpen || quickViewOpen;
  }, []);

  useEffect(() => {
    const updatePopupState = () => {
      const open = checkPopups();
      setIsAnyPopupOpen(open);
      if (open) {
        hideBubble();
      }
    };

    updatePopupState();

    const observer = new MutationObserver(updatePopupState);
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["style", "data-menu-open", "data-cart-open"],
    });

    return () => observer.disconnect();
  }, [checkPopups, hideBubble, isCartOpen, isQuickViewOpen]);

  // Initial welcome message auto-dismisses after 4.5 seconds
  useEffect(() => {
    dismissTimerRef.current = setTimeout(() => {
      setIsBubbleVisible(false);
    }, 4500);
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  // Periodic Friendly Tips while resting at base
  useEffect(() => {
    if (isChatOpen || isMinimized || isDragging || isAngry || isAnyPopupOpen) return;

    const prompts = [
      "I'm Kilby! Click to chat anytime ⚡",
      "Need a bulk project quote? Click me! 📋",
      "We stock Siemens & Delta PLCs ⚡",
      "Same-day dispatch across India 🚚",
      "100% genuine parts with GST invoices 🛡️",
      "Looking for precision sensors? 🎯",
    ];

    const interval = setInterval(() => {
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      showBubble(randomPrompt, undefined, undefined, 4500);
    }, 32000);

    return () => clearInterval(interval);
  }, [isChatOpen, isMinimized, isDragging, isAngry, isAnyPopupOpen, showBubble]);

  // Steady Coordinates Calculation:
  // Stays fixed at right bottom corner regardless of scrolling!
  // Mobile Downside Corner: 12px from right, 16px from bottom
  // Desktop: 24px from right, 28px from bottom
  const avatarSize = 54;
  const isMobile = windowSize.width < 640;
  const defaultX = windowSize.width - avatarSize - (isMobile ? 12 : 24);
  const defaultY = windowSize.height - avatarSize - (isMobile ? 16 : 28);

  // Real-time Coordinate Resolution:
  // 1. Dragging position (following user pointer)
  // 2. Drop position (staying at drop site while shaking in anger)
  // 3. Steady original place at right corner (defaultX, defaultY)
  const currentX = dragPosition
    ? dragPosition.x
    : dropPosition
    ? dropPosition.x
    : defaultX;

  const currentY = dragPosition
    ? dragPosition.y
    : dropPosition
    ? dropPosition.y
    : defaultY;

  // Smart Bubble Placement
  const isTopRegion = currentY < 90;
  const isRightSide = currentX > windowSize.width / 2;
  const shouldShowBubble = isBubbleVisible && !isAnyPopupOpen && Boolean(bubbleText);

  // HOLD, DRAG & DROP HANDLERS (Desktop Mouse + Mobile Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (isChatOpen || isMinimized || isAnyPopupOpen) return;

    e.stopPropagation();

    // Reset anger and return timers if user grabs him again
    clearAllAngerTimers();
    setIsAngry(false);
    setIsShaking(false);
    setDropPosition(null);

    isPointerDownRef.current = true;
    isActuallyDraggingRef.current = false;
    dragStartPointerRef.current = { x: e.clientX, y: e.clientY };
    dragInitialAvatarRef.current = { x: currentX, y: currentY };

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || isAnyPopupOpen) return;

    const dx = e.clientX - dragStartPointerRef.current.x;
    const dy = e.clientY - dragStartPointerRef.current.y;
    const dist = Math.hypot(dx, dy);

    // Threshold of 14px to begin drag mode
    if (!isActuallyDraggingRef.current && dist > 14) {
      isActuallyDraggingRef.current = true;
      setIsDragging(true);
      setAvatarMood("scared");
      showBubble("Whoaaa! Put me down! 😲", undefined, undefined, 4000);
    }

    if (isActuallyDraggingRef.current) {
      if (e.cancelable) e.preventDefault();

      const vWidth = window.innerWidth;
      const vHeight = window.innerHeight;
      const rawX = dragInitialAvatarRef.current.x + dx;
      const rawY = dragInitialAvatarRef.current.y + dy;

      const clampedX = Math.max(8, Math.min(rawX, vWidth - avatarSize - 8));
      const clampedY = Math.max(8, Math.min(rawY, vHeight - avatarSize - 8));

      setDragPosition({ x: clampedX, y: clampedY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    const wasDragging = isActuallyDraggingRef.current;
    isActuallyDraggingRef.current = false;

    if (wasDragging && dragPosition) {
      const droppedAtX = dragPosition.x;
      const droppedAtY = dragPosition.y;

      // Check distance moved from start
      const totalMoved = Math.hypot(
        droppedAtX - dragInitialAvatarRef.current.x,
        droppedAtY - dragInitialAvatarRef.current.y
      );

      setIsDragging(false);
      setDragPosition(null);

      // ONLY get angry and return if USER ACTUALLY MOVED Kilby (> 25px)!
      if (totalMoved > 25) {
        clearAllAngerTimers();
        setDropPosition({ x: droppedAtX, y: droppedAtY });
        setIsAngry(true);
        setIsShaking(true);
        setAvatarMood("angry");

        const angryLines = [
          "Hey! Don't throw me around! 😤",
          "Hey! I'm an engineer, not a toy! 😡",
          "Whoa! Taking myself back to my station! 💢",
          "Ouch! I belong in my corner! 😾",
          "Hmph! Heading back to my post! 😤",
        ];
        const randomLine = angryLines[Math.floor(Math.random() * angryLines.length)];
        showBubble(randomLine, undefined, undefined, 3500);

        // Phase 1: Shake in anger at the drop spot for 500ms
        angerTimer1Ref.current = setTimeout(() => {
          // Phase 2: Start returning back to original corner while staying ANGRY
          setIsShaking(false);
          setDropPosition(null); // Coordinate target switches to (defaultX, defaultY)

          // Phase 3: Arrived back at original corner (after 900ms spring flight) -> Calm down!
          angerTimer2Ref.current = setTimeout(() => {
            setIsAngry(false);
            setAvatarMood("happy");
            showBubble("Phew, back where I belong! 😌", undefined, undefined, 2500);

            // Phase 4: Settle to idle
            angerTimer3Ref.current = setTimeout(() => {
              setAvatarMood("idle");
            }, 2500);
          }, 900);
        }, 500);
      } else {
        // User barely moved him -> Put back peacefully
        setDropPosition(null);
        setIsAngry(false);
        setIsShaking(false);
        setAvatarMood("idle");
      }
    } else {
      // Normal click / tap (< 14px) -> Open chatbot!
      setIsDragging(false);
      setDragPosition(null);
      setDropPosition(null);
      setIsAngry(false);
      setIsShaking(false);
      setIsChatOpen(true);
      setAvatarMood("happy");
    }
  };

  // Minimized Floating Pill - in mobile downside corner (bottom-4 right-3)
  if (isMinimized) {
    return (
      <div
        className={`fixed bottom-4 sm:bottom-6 right-3 sm:right-6 transition-all duration-300 ${
          isAnyPopupOpen ? "z-30 opacity-0 pointer-events-none" : "z-[10000] opacity-100"
        }`}
      >
        <button
          onClick={toggleMinimize}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900/95 hover:bg-slate-800 text-white rounded-full shadow-2xl border border-amber-500/40 backdrop-blur-sm transition-all duration-200 text-xs font-semibold cursor-pointer group"
          title="Open Kilby Assistant"
          aria-label="Open Kilby Assistant"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Ask Kilby</span>
          <ChevronUp className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 pointer-events-none transition-all duration-300 overflow-hidden ${
        isAnyPopupOpen ? "z-30 opacity-0 pointer-events-none" : "z-[10000] opacity-100"
      }`}
    >
      {/* 1. Full Chatbot Window (Docked at bottom right corner) */}
      <div className="absolute bottom-3 sm:bottom-6 right-3 sm:right-6 pointer-events-auto">
        <AvatarChatbot
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onMinimize={toggleMinimize}
          avatarMood={avatarMood}
          onMoodChange={setAvatarMood}
        />
      </div>

      {/* 2. Floating Kilby: Steady at right corner, only moves when dragged and returns in anger */}
      {!isChatOpen && (
        <motion.div
          animate={
            isShaking && dropPosition
              ? {
                  x: [
                    dropPosition.x - 6,
                    dropPosition.x + 6,
                    dropPosition.x - 5,
                    dropPosition.x + 5,
                    dropPosition.x - 3,
                    dropPosition.x + 3,
                    dropPosition.x,
                  ],
                  y: [
                    dropPosition.y,
                    dropPosition.y - 3,
                    dropPosition.y + 3,
                    dropPosition.y - 2,
                    dropPosition.y + 2,
                    dropPosition.y,
                  ],
                  rotate: [-10, 10, -8, 8, -4, 4, 0],
                }
              : {
                  x: currentX,
                  y: currentY,
                  rotate: 0,
                }
          }
          transition={
            isDragging
              ? { duration: 0 } // Zero-lag immediate pointer following while dragging
              : isShaking
              ? { duration: 0.5, ease: "easeInOut" } // Shakes with anger at drop spot
              : {
                  type: "spring",
                  stiffness: 110,
                  damping: 15,
                  mass: 0.8,
                }
          }
          style={{
            position: "absolute",
            top: 0,
            left: 0,
          }}
          className="pointer-events-auto select-none"
        >
          <div className="relative flex items-center gap-2.5">
            {/* Speech Bubble */}
            <AnimatePresence>
              {shouldShowBubble && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: isTopRegion ? -6 : 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: isTopRegion ? -4 : 4 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute ${
                    isTopRegion ? "top-full mt-3" : "bottom-full mb-3"
                  } ${
                    isRightSide ? "right-0" : "left-0"
                  } w-max max-w-[240px] sm:max-w-[280px] p-3 rounded-2xl ${
                    isAngry
                      ? "bg-red-950/95 text-white border-red-500/60 shadow-red-900/40"
                      : "bg-slate-950/95 text-white border-amber-400/40"
                  } shadow-2xl border backdrop-blur-md z-50 text-xs font-medium`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className="text-slate-100 leading-snug cursor-pointer hover:text-amber-300 transition-colors"
                      onClick={() => {
                        if (!isDragging && !isAngry && !isAnyPopupOpen) {
                          setIsChatOpen(true);
                          setAvatarMood("happy");
                        }
                      }}
                      title="Click to ask Kilby"
                    >
                      {bubbleText}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        hideBubble();
                      }}
                      className="text-slate-400 hover:text-white p-0.5 -mt-0.5 -mr-0.5 rounded cursor-pointer transition-colors shrink-0"
                      aria-label="Dismiss message"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Optional Action Pill inside the speech bubble */}
                  {bubbleAction?.label && !isAngry && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-end">
                      {bubbleAction.href ? (
                        <Link
                          href={bubbleAction.href}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-300 text-slate-950 text-[11px] font-bold rounded-full transition-colors cursor-pointer"
                        >
                          <span>{bubbleAction.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsChatOpen(true);
                            setAvatarMood("happy");
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold rounded-full transition-colors cursor-pointer"
                        >
                          <span>{bubbleAction.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Speech Bubble Arrow Tail pointing directly at Kilby */}
                  <div
                    className={`absolute w-2.5 h-2.5 ${
                      isAngry
                        ? "bg-red-950 border-red-500/60"
                        : "bg-slate-950 border-amber-400/40"
                    } rotate-45 ${
                      isTopRegion
                        ? "-top-1.5 border-t border-l"
                        : "-bottom-1.5 border-b border-r"
                    } ${
                      isRightSide ? "right-5" : "left-5"
                    }`}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Draggable Kilby Avatar Mascot */}
            <div
              className="relative group cursor-grab active:cursor-grabbing select-none touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onMouseEnter={() => {
                if (!shouldShowBubble && !isDragging && !isAngry && !isAnyPopupOpen) {
                  showBubble(
                    "Hi! I'm Kilby ⚡ Click to chat or drag me around!",
                    undefined,
                    undefined,
                    3500
                  );
                }
              }}
            >
              <button
                type="button"
                className={`relative flex items-center justify-center p-1 rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-amber-950 text-white shadow-2xl border-2 transition-transform duration-150 focus:outline-none pointer-events-none ${
                  isDragging
                    ? "scale-110 border-red-400 ring-4 ring-red-400/40 shadow-red-500/30"
                    : isAngry
                    ? "border-red-500 ring-4 ring-red-500/50 shadow-red-500/40"
                    : "border-amber-400/60 hover:border-amber-400 hover:scale-105"
                }`}
                aria-label="Kilby AI Assistant"
              >
                {/* Active Online / Angry Pulse */}
                <span
                  className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 z-10 ${
                    isAngry || isDragging ? "bg-red-500 animate-ping" : "bg-emerald-500"
                  }`}
                />

                {/* Status Pill Badge */}
                {isAngry ? (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-600 text-white text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded-full shadow-md pointer-events-none animate-pulse">
                    ANGRY!
                  </span>
                ) : isDragging ? (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-400 text-slate-950 text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded-full shadow-md pointer-events-none">
                    MOVING...
                  </span>
                ) : null}

                {/* Embedded Yellow Avatar */}
                <div className="w-11 h-11 overflow-hidden rounded-full flex items-center justify-center bg-slate-900/60 pointer-events-none">
                  <AvatarMascot
                    ref={mascotRef}
                    mode="custom"
                    animation={avatarMood}
                    size={54}
                    interactive={false}
                  />
                </div>
              </button>

              {/* Minimize Icon on Hover */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={toggleMinimize}
                className="absolute -top-1 -left-1 p-1 bg-slate-800 text-slate-300 hover:text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 cursor-pointer pointer-events-auto z-20"
                title="Minimize Assistant"
                aria-label="Minimize Assistant"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default SmartAvatarCompanion;
