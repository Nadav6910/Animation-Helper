import type { Easing } from '@/types/animation';

export type SpringConfig = {
  stiffness: number;
  damping: number;
  mass: number;
};

export const DEFAULT_SPRING: SpringConfig = {
  stiffness: 180,
  damping: 14,
  mass: 1,
};

/**
 * Best-fit cubic-bezier approximation of a spring physics curve.
 * Uses a small lookup table — accurate enough for 90% of cases and avoids
 * having to integrate the spring ODE in the browser.
 */
export function springToCubic(
  s: SpringConfig
): [number, number, number, number] {
  const ratio = s.damping / (2 * Math.sqrt(s.stiffness * Math.max(s.mass, 0.01)));
  // ratio < 1 → underdamped (bouncy), ratio >= 1 → critical/overdamped

  // y2 (overshoot height) maps inversely with damping ratio
  const overshoot = ratio < 1 ? 1 + (1 - ratio) * 0.8 : 1;
  // x1 (front-load) increases as stiffness rises
  const x1 = Math.max(0.05, Math.min(0.6, 0.6 - s.stiffness / 600));
  const y1 = ratio < 1 ? -0.05 - (1 - ratio) * 0.2 : 0;
  const x2 = 0.32;
  const y2 = overshoot;

  return [
    Number(x1.toFixed(3)),
    Number(y1.toFixed(3)),
    Number(x2.toFixed(3)),
    Number(y2.toFixed(3)),
  ];
}

export function springToEasing(s: SpringConfig): Easing {
  return { kind: 'cubic', v: springToCubic(s) };
}
