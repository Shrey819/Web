"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils"; // Assuming cn is standard tailwind-merge util

interface CursorRepelTextProps {
  text: string;
  className?: string;
}

export function CursorRepelText({ text, className }: CursorRepelTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Disable on touch devices and for users preferring reduced motion
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isTouch || isReducedMotion) return;

    const container = containerRef.current;
    if (!container) return;

    const chars = Array.from(container.querySelectorAll(".repel-char")) as HTMLElement[];

    // Ensure we have characters to animate
    if (chars.length === 0) return;

    let mouseX = -1000;
    let mouseY = -1000;
    let isHovering = false;
    let rafId: number;

    const settings = {
      influenceRadius: 120, // Distance within which chars are repelled
      maxDisplacement: 40,  // Max distance a char can be pushed
      maxRotation: 5,       // Max degrees a char can rotate
      stiffness: 220,       // Spring stiffness
      damping: 22,          // Spring damping
    };

    // Store physical state for each character
    const charStates = chars.map((char) => ({
      el: char,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      rot: 0,
      vrot: 0,
      originX: 0,
      originY: 0,
    }));

    // Update global origins (bounding rect centers)
    const updateRects = () => {
      charStates.forEach((state) => {
        const rect = state.el.getBoundingClientRect();
        state.originX = rect.left + rect.width / 2;
        state.originY = rect.top + rect.height / 2;
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      isHovering = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      isHovering = false;
    };

    // Initialize Origins
    // Small delay to ensure layout is complete before reading rects
    const timeoutId = setTimeout(() => {
      updateRects();
    }, 100);

    window.addEventListener("resize", updateRects);
    window.addEventListener("scroll", updateRects, { passive: true });
    
    // Bind to the parent or window to track mouse
    // Using window gives a smoother follow as mouse enters/leaves the text block rapidly
    // But we restrict hover state to the container or nearby
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.03); // Cap dt to prevent massive jumps on lag
      lastTime = time;

      let needsUpdate = false;

      charStates.forEach((state) => {
        let targetX = 0;
        let targetY = 0;
        let targetRot = 0;

        if (isHovering) {
          const dx = state.originX - mouseX;
          const dy = state.originY - mouseY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < settings.influenceRadius) {
            // Push calculation
            const force = (settings.influenceRadius - distance) / settings.influenceRadius;
            const pushDist = force * settings.maxDisplacement;
            
            const dirX = dx / (distance || 1);
            const dirY = dy / (distance || 1);

            targetX = dirX * pushDist;
            targetY = dirY * pushDist;
            // Add subtle rotation based on horizontal push
            targetRot = (dirX * pushDist) / settings.maxDisplacement * settings.maxRotation;
          }
        }

        // Spring physics step
        const ax = -settings.stiffness * (state.x - targetX) - settings.damping * state.vx;
        const ay = -settings.stiffness * (state.y - targetY) - settings.damping * state.vy;
        const arot = -settings.stiffness * (state.rot - targetRot) - settings.damping * state.vrot;

        state.vx += ax * dt;
        state.vy += ay * dt;
        state.vrot += arot * dt;

        state.x += state.vx * dt;
        state.y += state.vy * dt;
        state.rot += state.vrot * dt;

        // Optimization: only update DOM if moving significantly
        const isMoving = Math.abs(state.vx) > 0.05 || Math.abs(state.vy) > 0.05;
        const isOffTarget = Math.abs(state.x - targetX) > 0.1 || Math.abs(state.y - targetY) > 0.1;

        if (isMoving || isOffTarget) {
          state.el.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) rotate(${state.rot}deg)`;
          needsUpdate = true;
        } else if (state.el.style.transform !== "none" && state.el.style.transform !== "translate3d(0px, 0px, 0) rotate(0deg)" && targetX === 0) {
           // Snap perfectly to 0 when settled
           state.el.style.transform = "none";
           state.x = 0; state.y = 0; state.rot = 0;
           state.vx = 0; state.vy = 0; state.vrot = 0;
        }
      });

      // Keep requesting frames if hovering or physics is still moving
      if (needsUpdate || isHovering) {
        rafId = requestAnimationFrame(animate);
      } else {
        // Idle - wait for next mousemove
        rafId = requestAnimationFrame(animate); 
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateRects);
      window.removeEventListener("scroll", updateRects);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const words = text.split(" ");

  return (
    <div className={cn("relative", className)}>
      {/* Accessible copy for screen readers */}
      <span className="sr-only">{text}</span>
      
      {/* Animated visual copy (hidden from SR) */}
      <div ref={containerRef} aria-hidden="true" className="inline-block relative w-full h-full">
        {words.map((word, wordIdx) => (
          <span key={wordIdx} className="inline-block whitespace-nowrap">
            {Array.from(word).map((char, charIdx) => (
              <span
                key={charIdx}
                className="repel-char inline-block origin-center pointer-events-none"
              >
                {char}
              </span>
            ))}
            {/* Preserve spaces between words exactly */}
            {wordIdx < words.length - 1 && (
              <span className="inline-block whitespace-pre"> </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
