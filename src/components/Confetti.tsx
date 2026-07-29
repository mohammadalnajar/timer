"use client";

import { useMemo } from "react";
import type { Template } from "@/lib/templates";

const PIECE_COUNT = 24;

/**
 * A one-shot fall when the date lands. CSS-only, so it costs nothing after the
 * animation ends, and `prefers-reduced-motion` hides it entirely.
 */
export function Confetti({ template, seed = 1 }: { template: Template; seed?: number }) {
  const pieces = useMemo(() => {
    // Deterministic pseudo-random so server and client agree.
    let state = seed * 9301 + 49297;
    const next = () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };

    const colors = [template.colors.primary, template.colors.accent, template.colors.fg];

    return Array.from({ length: PIECE_COUNT }, (_, i) => ({
      key: i,
      left: `${next() * 100}%`,
      background: colors[i % colors.length],
      duration: `${2.6 + next() * 2.2}s`,
      delay: `${next() * 1.6}s`,
      drift: `${(next() - 0.5) * 220}px`,
      spin: `${next() * 900 - 450}deg`,
      width: `${6 + next() * 5}px`,
      height: `${10 + next() * 8}px`,
    }));
  }, [template, seed]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.key}
          className="confetti-piece"
          style={
            {
              left: p.left,
              background: p.background,
              width: p.width,
              height: p.height,
              "--duration": p.duration,
              "--delay": p.delay,
              "--drift": p.drift,
              "--spin": p.spin,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
