export const EASE = {
  signature: [0.22, 1, 0.36, 1], // Entrance / hero reveals
  exit: [0.4, 0, 1, 1],          // Exit dismissals
  settle: [0.34, 1.4, 0.64, 1],  // Micro-interactions / subtle overshoot
  linear: "linear",              // Scroll-linked scrubbing only
} as const;

export type EaseKey = keyof typeof EASE;
