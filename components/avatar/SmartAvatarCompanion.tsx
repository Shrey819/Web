"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, useScroll, useVelocity, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { AvatarMascot, type AvatarAnimation, type AvatarMascotHandle } from "./AvatarMascot";
import { AvatarChatbot } from "./AvatarChatbot";
import { useCartStore } from "@/store/useCartStore";
import { useQuickViewStore } from "@/store/useQuickViewStore";
import {
  X,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface ActiveTarget {
  id: string;
  x: number;
  y: number;
  prompt: string;
  mood: AvatarAnimation;
  actionLabel?: string;
  actionHref?: string;
}

export function SmartAvatarCompanion() {
  const mascotRef = useRef<AvatarMascotHandle>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [avatarMood, setAvatarMood] = useState<AvatarAnimation>("idle");
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
  const [activeTarget, setActiveTarget] = useState<ActiveTarget | null>(null);

  // Popup / Drawer / Menu detection to suppress avatar & messages while open
  const isCartOpen = useCartStore((s) => s.isOpen);
  const isQuickViewOpen = useQuickViewStore((s) => s.isOpen);
  const [isAnyPopupOpen, setIsAnyPopupOpen] = useState(false);

  // User Drag-and-Drop & Anger States
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [dropPosition, setDropPosition] = useState<{ x: number; y: number } | null>(null);
  const [isAngryDropped, setIsAngryDropped] = useState(false);

  const isPointerDownRef = useRef(false);
  const isActuallyDraggingRef = useRef(false);
  const dragStartPointerRef = useRef({ x: 0, y: 0 });
  const dragInitialAvatarRef = useRef({ x: 0, y: 0 });
  const angerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Speech bubble state with auto-dismiss & anti-block protection
  const [bubbleText, setBubbleText] = useState<string | null>("Hi! I'm Kilby ⚡ How can I help?");
  const [bubbleAction, setBubbleAction] = useState<{ label: string; href?: string } | null>(null);
  const [isBubbleVisible, setIsBubbleVisible] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);

  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTargetIdRef = useRef<string | null>(null);

  // Scroll tracking & travel inertia
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 35, stiffness: 220 });

  // Travel angle: leans forward when diving down, tilts up when scrolling up
  const travelRotate = useTransform(smoothVelocity, [-1200, 0, 1200], [-8, 0, 8]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (angerTimerRef.current) clearTimeout(angerTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

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

  // Helper: Show polite speech bubble that auto-dismisses so it NEVER blocks content
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
  // Ensures Kilby stays completely silent and out of the way when any drawer/popup is active
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
        setActiveTarget(null);
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

  // 1. Dynamic Target Evaluator: Detects buttons and inputs across Header, Body & Footer
  // ONLY for automatic travel on scroll - NEVER sets anger!
  const evaluateTargets = useCallback(() => {
    if (isChatOpen || isMinimized || isDragging || isAngryDropped || isAnyPopupOpen) return;

    const anchors = Array.from(document.querySelectorAll<HTMLElement>("[data-kilby-anchor]"));
    if (anchors.length === 0) {
      setActiveTarget(null);
      return;
    }

    const vHeight = window.innerHeight;
    const vWidth = window.innerWidth;
    const scrollYPos = window.scrollY || window.pageYOffset || 0;
    const avatarSize = 54;
    const margin = 12;

    // Check if any anchor or its child has active focus
    const focusedEl = document.activeElement as HTMLElement | null;
    const focusedAnchor = anchors.find(
      (a) => a === focusedEl || a.contains(focusedEl)
    );

    let chosenEl: HTMLElement | null = focusedAnchor || null;

    if (!chosenEl) {
      // When at top of page, allow visiting header search or hero CTA
      if (scrollYPos < 80) {
        for (const el of anchors) {
          const rect = el.getBoundingClientRect();
          if (rect.bottom > 0 && rect.top < vHeight * 0.55 && rect.height > 0) {
            chosenEl = el;
            break;
          }
        }
      } else {
        // When scrolled down, skip sticky header anchors unless user focused them
        let minDistance = Infinity;
        for (const el of anchors) {
          const isSticky = Boolean(el.closest("header.sticky, header.fixed, [data-sticky]"));
          if (isSticky) continue;

          const rect = el.getBoundingClientRect();
          if (rect.bottom > 20 && rect.top < vHeight - 20 && rect.height > 0) {
            const centerY = rect.top + rect.height / 2;
            const dist = Math.abs(centerY - vHeight * 0.45);
            if (dist < minDistance) {
              minDistance = dist;
              chosenEl = el;
            }
          }
        }
      }
    }

    if (chosenEl) {
      const rect = chosenEl.getBoundingClientRect();
      const position = chosenEl.getAttribute("data-kilby-position") || "right";
      const prompt = chosenEl.getAttribute("data-kilby-prompt") || "Need assistance with this? Ask me! 💡";
      const mood = (chosenEl.getAttribute("data-kilby-mood") as AvatarAnimation) || "curious";
      const actionLabel = chosenEl.getAttribute("data-kilby-action") || undefined;
      const actionHref = chosenEl.getAttribute("data-kilby-href") || undefined;

      let targetX = rect.right + margin;
      let targetY = rect.top + rect.height / 2 - avatarSize / 2;

      // If positioning on the right would push Kilby off the screen edge, place on left
      if (position === "left" || targetX + avatarSize + 16 > vWidth) {
        targetX = rect.left - avatarSize - margin;
      }
      // If left is also too tight, place top
      if (targetX < 12) {
        targetX = Math.min(vWidth - avatarSize - 16, Math.max(16, rect.left));
        targetY = rect.top - avatarSize - margin;
      }

      // Clamp inside viewport
      const clampedX = Math.max(12, Math.min(targetX, vWidth - avatarSize - 16));
      const clampedY = Math.max(12, Math.min(targetY, vHeight - avatarSize - 16));

      const anchorId = chosenEl.getAttribute("data-kilby-anchor") || "anchor";
      setActiveTarget({
        id: anchorId,
        x: clampedX,
        y: clampedY,
        prompt,
        mood,
        actionLabel,
        actionHref,
      });
      if (!isAngryDropped && !isDragging) {
        setAvatarMood(mood);
      }
    } else {
      setActiveTarget(null);
    }
  }, [isChatOpen, isMinimized, isDragging, isAngryDropped, isAnyPopupOpen]);

  // When activeTarget changes, trigger polite speech bubble with 4.5s auto-dismiss
  useEffect(() => {
    if (activeTarget && !isAngryDropped && !isDragging && !isAnyPopupOpen) {
      if (activeTarget.id !== lastTargetIdRef.current) {
        lastTargetIdRef.current = activeTarget.id;
        showBubble(activeTarget.prompt, activeTarget.actionLabel, activeTarget.actionHref, 4500);
      }
    } else if (!activeTarget) {
      lastTargetIdRef.current = null;
    }
  }, [activeTarget, showBubble, isAngryDropped, isDragging, isAnyPopupOpen]);

  // Run target evaluation on scroll, focus, and input events
  useEffect(() => {
    let animFrame: number;
    const handleScrollOrEvent = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 220);

      cancelAnimationFrame(animFrame);
      animFrame = requestAnimationFrame(evaluateTargets);
    };

    window.addEventListener("scroll", handleScrollOrEvent, { passive: true });
    window.addEventListener("focusin", handleScrollOrEvent);
    window.addEventListener("focusout", handleScrollOrEvent);

    const initialTimer = setTimeout(evaluateTargets, 400);

    return () => {
      window.removeEventListener("scroll", handleScrollOrEvent);
      window.removeEventListener("focusin", handleScrollOrEvent);
      window.removeEventListener("focusout", handleScrollOrEvent);
      cancelAnimationFrame(animFrame);
      clearTimeout(initialTimer);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [evaluateTargets]);

  // 2. Form Input Validation Reactions
  useEffect(() => {
    if (isChatOpen || isMinimized || isDragging || isAngryDropped || isAnyPopupOpen) return;

    const handleInputChange = (e: Event) => {
      const target = e.target as HTMLInputElement | null;
      if (!target || target.type !== "email") return;

      const val = target.value.trim();
      if (val.length > 5 && !val.includes("@")) {
        setAvatarMood("suspicious");
        showBubble("Could you check your email, maybe name@company.com?", undefined, undefined, 4000);
      } else if (val.includes("@") && val.includes(".")) {
        setAvatarMood("happy");
        showBubble("Email looks great! 🤝", undefined, undefined, 3000);
      }
    };

    window.addEventListener("input", handleInputChange);
    return () => window.removeEventListener("input", handleInputChange);
  }, [isChatOpen, isMinimized, isDragging, isAngryDropped, isAnyPopupOpen, showBubble]);

  // 3. Periodic Friendly Tips when not anchored to a specific form element
  useEffect(() => {
    if (isChatOpen || isMinimized || isDragging || activeTarget || isAngryDropped || isAnyPopupOpen) return;

    const prompts = [
      "Travelling with you! Ask me anything 🚀",
      "Need a bulk project quote? Click me! 📋",
      "We stock Siemens & Delta PLCs ⚡",
      "Same-day dispatch across India 🚚",
      "100% genuine parts with GST invoices 🛡️",
      "Looking for precision sensors? 🎯",
    ];

    const interval = setInterval(() => {
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      showBubble(randomPrompt, undefined, undefined, 4500);
    }, 28000);

    return () => clearInterval(interval);
  }, [isChatOpen, isMinimized, isDragging, activeTarget, isAngryDropped, isAnyPopupOpen, showBubble]);

  // Coordinates Calculation:
  // Mobile Downside Corner: 12px from right, 16px from bottom
  // Desktop: 24px from right, 28px from bottom
  const avatarSize = 54;
  const isMobile = windowSize.width < 640;
  const defaultX = windowSize.width - avatarSize - (isMobile ? 12 : 24);
  const defaultY = windowSize.height - avatarSize - (isMobile ? 16 : 28);

  const baseTargetX = activeTarget ? activeTarget.x : defaultX;
  const baseTargetY = activeTarget ? activeTarget.y : defaultY;

  // Real-time Coordinate Resolution:
  // 1. Dragging position (following user pointer)
  // 2. Drop position (staying at drop site while angry for 0.5s only)
  // 3. Active in-page anchor (automatic on scroll)
  // 4. Default downside corner
  const currentX = dragPosition
    ? dragPosition.x
    : dropPosition
    ? dropPosition.x
    : baseTargetX;

  const currentY = dragPosition
    ? dragPosition.y
    : dropPosition
    ? dropPosition.y
    : baseTargetY;

  // Smart Bubble Placement:
  // Suppressed completely whenever a popup, drawer, or menu is open!
  const isTopRegion = currentY < 90;
  const isRightSide = currentX > windowSize.width / 2;
  const shouldShowBubble = isBubbleVisible && !isScrolling && !isAnyPopupOpen && Boolean(bubbleText);

  // 4. HOLD, DRAG & DROP HANDLERS (Desktop Mouse + Mobile Touch)
  // Anger only triggers when USER manually drags and changes Kilby's position (> 35px)!
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (isChatOpen || isMinimized || isAnyPopupOpen) return;

    e.stopPropagation();

    // Clear any previous anger timer
    if (angerTimerRef.current) {
      clearTimeout(angerTimerRef.current);
      angerTimerRef.current = null;
    }
    setIsAngryDropped(false);

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

    // Threshold of 16px to begin drag mode (prevents accidental micro-movements on tap)
    if (!isActuallyDraggingRef.current && dist > 16) {
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

      // Check how far Kilby was actually moved from where drag started
      const totalMoved = Math.hypot(
        droppedAtX - dragInitialAvatarRef.current.x,
        droppedAtY - dragInitialAvatarRef.current.y
      );

      setIsDragging(false);
      setDragPosition(null);

      // ONLY get angry if USER ACTUALLY CHANGED Kilby's position by dragging (> 35px)!
      if (totalMoved > 35) {
        setDropPosition({ x: droppedAtX, y: droppedAtY });
        setIsAngryDropped(true);
        setAvatarMood("angry");

        const angryLines = [
          "Hey! Don't throw me around! 😤",
          "Hey! I'm an engineer, not a toy! 😡",
          "Whoa! Put me back at my station! 💢",
          "Ouch! Why did you drop me here?! 😾",
        ];
        const randomLine = angryLines[Math.floor(Math.random() * angryLines.length)];
        showBubble(randomLine, undefined, undefined, 1800);

        // Anger & shaking for EXACTLY 0.5 SECONDS ONLY, then snaps back to base!
        if (angerTimerRef.current) clearTimeout(angerTimerRef.current);
        angerTimerRef.current = setTimeout(() => {
          setIsAngryDropped(false);
          setDropPosition(null);
          setAvatarMood("happy");
          showBubble("Phew, back to base! 😌", undefined, undefined, 2000);
        }, 500); // 0.5 seconds only!
      } else {
        // User put him right back or barely jiggled him (< 35px) -> No anger!
        setDropPosition(null);
        setIsAngryDropped(false);
        setAvatarMood("idle");
      }
    } else {
      // Normal click / tap (< 16px) -> Open chatbot!
      setIsDragging(false);
      setDragPosition(null);
      setDropPosition(null);
      setIsAngryDropped(false);
      setIsChatOpen(true);
      setAvatarMood("happy");
    }
  };

  // Minimized Floating Pill - in mobile downside corner (bottom-4 right-3)
  // Fades out and yields z-index whenever a modal, drawer, or menu is open
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
      {/* 1. Full Chatbot Window (Centered or Docked at mobile downside corner) */}
      <div className="absolute bottom-3 sm:bottom-6 right-3 sm:right-6 pointer-events-auto">
        <AvatarChatbot
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onMinimize={toggleMinimize}
          avatarMood={avatarMood}
          onMoodChange={setAvatarMood}
        />
      </div>

      {/* 2. Floating Kilby Traveling, Anchoring & Draggable anywhere on site */}
      {!isChatOpen && (
        <motion.div
          animate={
            isAngryDropped
              ? {
                  x: [currentX - 5, currentX + 5, currentX - 4, currentX + 4, currentX - 2, currentX + 2, currentX],
                  y: [currentY, currentY - 2, currentY + 2, currentY],
                  rotate: [-8, 8, -6, 6, -3, 3, 0],
                }
              : {
                  x: currentX,
                  y: currentY,
                }
          }
          transition={
            isDragging
              ? { duration: 0 } // Zero-lag immediate pointer following while dragging
              : isAngryDropped
              ? { duration: 0.5, ease: "easeInOut" } // Shakes for 0.5s only, NO REPEAT!
              : {
                  type: "spring",
                  stiffness: 140,
                  damping: 18,
                  mass: 0.8,
                }
          }
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            rotate: isAngryDropped ? undefined : travelRotate,
          }}
          className="pointer-events-auto select-none"
        >
          <div className="relative flex items-center gap-2.5">
            {/* Non-Obstructive Speech Bubble (Vertical placement, auto-dismissing, scroll-protected, popup-suppressed) */}
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
                    isAngryDropped
                      ? "bg-red-950/95 text-white border-red-500/60 shadow-red-900/40"
                      : "bg-slate-950/95 text-white border-amber-400/40"
                  } shadow-2xl border backdrop-blur-md z-50 text-xs font-medium`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className="text-slate-100 leading-snug cursor-pointer hover:text-amber-300 transition-colors"
                      onClick={() => {
                        if (!isDragging && !isAngryDropped && !isAnyPopupOpen) {
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
                  {bubbleAction?.label && !isAngryDropped && (
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
                      isAngryDropped
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

            {/* Draggable Kilby Avatar Mascot Dock */}
            <div
              className="relative group cursor-grab active:cursor-grabbing select-none touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onMouseEnter={() => {
                if (!shouldShowBubble && !isScrolling && !isDragging && !isAngryDropped && !isAnyPopupOpen) {
                  showBubble(
                    activeTarget?.prompt || "Hi! I'm Kilby ⚡ Click to chat or drag me around!",
                    activeTarget?.actionLabel,
                    activeTarget?.actionHref,
                    4000
                  );
                }
              }}
            >
              <button
                type="button"
                className={`relative flex items-center justify-center p-1 rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-amber-950 text-white shadow-2xl border-2 transition-transform duration-150 focus:outline-none pointer-events-none ${
                  isDragging
                    ? "scale-110 border-red-400 ring-4 ring-red-400/40 shadow-red-500/30"
                    : isAngryDropped
                    ? "border-red-500 ring-4 ring-red-500/50 shadow-red-500/40"
                    : activeTarget
                    ? "border-amber-400 ring-4 ring-amber-400/30 scale-105"
                    : "border-amber-400/60 hover:border-amber-400 hover:scale-105"
                }`}
                aria-label="Kilby AI Assistant"
              >
                {/* Active Online / Angry Pulse */}
                <span
                  className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 z-10 ${
                    isAngryDropped || isDragging ? "bg-red-500 animate-ping" : "bg-emerald-500"
                  }`}
                />

                {/* Quick Hint Pill */}
                {isAngryDropped ? (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-600 text-white text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded-full shadow-md pointer-events-none animate-pulse">
                    ANGRY!
                  </span>
                ) : isDragging ? (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-400 text-slate-950 text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded-full shadow-md pointer-events-none">
                    MOVING...
                  </span>
                ) : activeTarget ? (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-500 text-slate-950 text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded-full shadow-md pointer-events-none animate-bounce">
                    LOOK!
                  </span>
                ) : null}

                {/* Embedded Yellow Avatar (size 54) */}
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
