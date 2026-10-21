# TASK SPECIFICATION: Cinematic Web Upgrade for OM AUTOMATION (D:\Website)

You are tasked with upgrading the motion architecture and user experience of `D:\Website` using the production engineering standards of the **Cinematic Web** framework.

---

## 1. Core Principles & Strict Rules

1. **Motion Serves the Message:** If an animation does not communicate product quality, function, or tolerance, remove it.
2. **One Signature Moment:** `ProductAssemblySection` is the primary signature moment. Other interactive sections must be supporting elements, not competing spectacles.
3. **No 500vh Scroll Traps:** Pinned sections must never exceed 220vh–250vh on desktop. On mobile, unpin or limit to 100dvh–120vh.
4. **JS-Level Reduced Motion (`a11y`):** CSS media queries do NOT stop Framer Motion or requestAnimationFrame loops. Every animated component must check `useReducedMotion()` from `framer-motion` and provide an instant or clean static fallback.
5. **No Static `will-change`:** Never declare `willChange: "transform, opacity"` in permanent styles or inline styles. It exhausts GPU VRAM on mobile.
6. **No Off-Screen RAF Loops:** Animation loops (such as canvas/video scrubbing or continuous rotation) must pause via `IntersectionObserver` when scrolled out of view.
7. **Linear Easing for Scroll-Linked:** Any animation tied to `useScroll` / `scrollYProgress` must use `linear` easing so it stays 1:1 with user touch/scroll gestures.

---

## 2. Refactoring Tasks & Target Files

### Task 1: Create Centralized Motion Tokens
**Target File:** `lib/motion.ts` (Create if not present)
```ts
export const EASE = {
  signature: [0.22, 1, 0.36, 1], // Entrance / hero reveals
  exit: [0.4, 0, 1, 1],          // Exit dismissals
  settle: [0.34, 1.4, 0.64, 1],  // Micro-interactions / subtle overshoot
  linear: "linear",              // Scroll-linked scrubbing only
} as const;
```

---

### Task 2: Refactor `ProductAssemblySection.tsx` & `AssemblyScene.tsx`
**Target Files:**
- `components/home/ProductAssembly/ProductAssemblySection.tsx`
- `components/home/ProductAssembly/AssemblyScene.tsx`
- `components/home/ProductAssembly/AssemblyComponent.tsx`

**Required Changes:**
1. **Reduce Scroll Height:**
   Change `h-[500vh]` to `h-[220vh] sm:h-[250vh]` on desktop.
2. **Handle Reduced Motion:**
   Add `const shouldReduceMotion = useReducedMotion();`.
   If active:
   - Make the container `h-auto` and unpinned.
   - Hide the floating exploding parts.
   - Immediately render the assembled machine (`final-machine.jpg`) and technical spec card.
3. **Handle Mobile Responsiveness:**
   On mobile screens (`< 768px`), disable sticky pinning so the user does not experience scroll locking. Present the assembly progression as a compact, fluid 2-step card.
4. **Remove Static `willChange` in `AssemblyComponent.tsx`:**
   Remove line 84 `willChange: "transform, opacity"`. Let Framer Motion manage GPU compositing during active transforms.
5. **Add Automated QA Selectors:**
   - Add `data-scene="product-assembly"` to the outer `<section>`.
   - Add `data-el="assembly-hud"` to the HUD progress badge.
   - Add `data-el="final-machine"` to the final machine image container.
   - Add `data-el="specs-card"` to the technical specs CTA card.

---

### Task 3: Optimize `MainframeHero.tsx`
**Target File:** `components/home/MainframeHero.tsx`

**Required Changes:**
1. **IntersectionObserver for Video Loop:**
   Wrap the `tick` animation loop so `requestAnimationFrame` only runs when `containerRef` is visible in the viewport.
2. **Respect `useReducedMotion()`:**
   If `shouldReduceMotion` is true:
   - Do not bind `mousemove` / `touchmove` listeners.
   - Set the video frame statically to `SCAN_CENTER` (0.78s direct camera eye contact).

---

### Task 4: Optimize `CinematicProductSection.tsx` & `CinematicProductStage.tsx`
**Target Files:**
- `components/cinematic/CinematicProductSection.tsx`
- `components/cinematic/CinematicProductStage.tsx`

**Required Changes:**
1. **Pause RAF when Off-Screen:**
   Pause `updateLoop` via `IntersectionObserver` when the section scrolls out of view.
2. **Eliminate Layout Thrashing in `DraggableAmbientTile`:**
   Do not call `getBoundingClientRect()` inside physics frame loops (`physicsStep`). Read and cache viewport/stage bounds once on mount and on window resize.
3. **Add Scene Selectors:**
   Add `data-scene="cinematic-orbit"` and `data-el="orbit-stage"`.

---

### Task 5: CSS & Global Motion Polish
**Target File:** `app/globals.css`

**Required Changes:**
1. Remove `will-change: transform;` from `.animate-marquee` (line 127).
2. Remove or isolate `scroll-behavior: smooth;` from the root `html` tag during scrubbed scroll scenes to prevent inertia fighting.

---

## 3. Declarative Specification: `storyboard.json`

Create `storyboard.json` at the root of `D:\Website`:
```json
{
  "$schema": "https://raw.githubusercontent.com/cinematic-web/schemas/main/storyboard.schema.json",
  "project": "OM AUTOMATION",
  "version": "1.0.0",
  "scenes": [
    {
      "id": "mainframe-hero",
      "message": "Immediate OEM credibility with eye-contact responsive tracking and fast dispatch CTA.",
      "scroll": { "start": 0.0, "end": 0.15 },
      "technique": "video-scrub",
      "techniqueRationale": "Precise interactive head gaze tracking calibrated between 0.0s and 1.9s.",
      "pinned": false,
      "reducedMotion": "instant",
      "mobile": { "technique": "video-scrub", "pinned": false }
    },
    {
      "id": "product-assembly",
      "message": "Every precision component aligns to assemble a 24,000 RPM high-tolerance CNC machine.",
      "scroll": { "start": 0.35, "end": 0.60 },
      "technique": "scroll-linked",
      "techniqueRationale": "Signature moment showing multi-part exploded CAD components joining into the final product.",
      "pinned": true,
      "camera": "push-in",
      "elements": [
        { "selector": "[data-scene='product-assembly'] [data-el='assembly-hud']", "role": "support", "reveal": 0.10 },
        { "selector": "[data-scene='product-assembly'] [data-el='final-machine']", "role": "subject", "reveal": 0.75 },
        { "selector": "[data-scene='product-assembly'] [data-el='specs-card']", "role": "context", "reveal": 0.85 }
      ],
      "mobile": {
        "technique": "scroll-linked",
        "pinned": false,
        "notes": "Unpinned on mobile; displays as progressive 2-step view without screen locking."
      },
      "reducedMotion": "instant"
    }
  ],
  "budgets": {
    "desktop": { "fpsMedian": 55, "fpsP5": 30, "maxLongFrameRatio": 0.02, "maxLcpMs": 2000, "maxCls": 0.05 },
    "mobile": { "fpsMedian": 50, "fpsP5": 26, "maxLongFrameRatio": 0.03, "maxLcpMs": 2500, "maxCls": 0.05 }
  }
}
```

---

## 4. Verification & QA Criteria
Before marking the implementation as complete, verify:
- [ ] No horizontal overflow at 375px, 768px, and 1440px viewports (0px overflow).
- [ ] Turning on `prefers-reduced-motion` immediately disables scroll locking in `ProductAssemblySection` and locks the hero gaze to center.
- [ ] Scrolling past `ProductAssemblySection` requires only ~2.2 screens of scroll instead of 5 screens.
- [ ] No continuous RAF execution in browser dev tools when the browser is idle at the bottom of the page.
