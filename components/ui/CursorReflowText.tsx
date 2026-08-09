"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CursorReflowTextProps {
  text: string;
  as?: React.ElementType;
  variant?: "heading" | "body";
  className?: string;
}

export function CursorReflowText({
  text,
  as: Tag = "p",
  variant = "body",
  className,
}: CursorReflowTextProps) {
  const [hoverState, setHoverState] = useState<{ index: number; direction: 'left' | 'right' } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const words = text.split(" ");

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isTouch || isReducedMotion) return;

    const container = containerRef.current;
    if (!container) return;

    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      // Throttle via rAF to ensure we aren't overloading layout calculations
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const { clientX, clientY } = e;
        
        let closestIdx = -1;
        let closestSide: 'left' | 'right' = 'left';
        let minDistance = Infinity;

        wordsRef.current.forEach((el, idx) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          // Only interact with words tightly on the same line as the cursor
          const dy = Math.abs(clientY - centerY);
          if (dy > 20) return; 

          const dx = clientX - centerX;
          const distance = Math.abs(dx);
          
          if (distance < minDistance) {
            minDistance = distance;
            closestIdx = idx;
            closestSide = dx < 0 ? 'left' : 'right'; 
          }
        });

        // Influence radius ~ 120px
        if (closestIdx !== -1 && minDistance < 120) {
          setHoverState(prev => {
            if (prev?.index === closestIdx && prev.direction === closestSide) return prev;
            return { index: closestIdx, direction: closestSide };
          });
        } else {
          setHoverState(null);
        }
      });
    };

    const handleMouseLeave = () => {
      cancelAnimationFrame(rafId);
      setHoverState(null);
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <Tag className={cn("relative", className)}>
      <span className="sr-only">{text}</span>
      <span 
        ref={containerRef} 
        aria-hidden="true" 
        className="inline-block relative w-full"
      >
        {words.map((word, idx) => {
          const isHovered = hoverState?.index === idx;
          const isLeft = isHovered && hoverState.direction === 'left';
          const isRight = isHovered && hoverState.direction === 'right';

          return (
            <span key={idx} className="inline-block">
              <motion.span
                ref={(el) => {
                  wordsRef.current[idx] = el;
                }}
                initial={false}
                animate={{
                  y: isHovered && variant === "body" ? -8 : 0,
                  marginLeft: isLeft ? "90px" : "0px",
                  marginRight: isRight ? "90px" : "0px",
                }}
                style={{
                  display: "inline-block",
                }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 25,
                  mass: 0.8
                }}
              >
                {word}
              </motion.span>
              {/* Add physical space to allow normal word wrap when no margin is active */}
              {idx < words.length - 1 && <span className="inline-block">&nbsp;</span>}
            </span>
          );
        })}
      </span>
    </Tag>
  );
}
