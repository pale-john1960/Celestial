// Celestial — seasonal particle overlay (petals / fireflies / leaves / snow)
// Pure CSS transform+opacity animation, deterministic layout (no hydration
// mismatch), 7 particles on mobile / 12 on ≥sm, none for reduced motion.
"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";

export type Season = "spring" | "summer" | "autumn" | "winter";

const PALETTE: Record<Season, string[]> = {
  spring: ["#F9A8C9", "#FAD0E0"],
  summer: ["#FFD98A", "#FFE9B8"],
  autumn: ["#E8A15A", "#C96F35"],
  winter: ["#FFFFFF", "#F5F2EC"],
};

/** tiny deterministic PRNG so server & client render identical layouts */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COUNT = 12;

function particleStyle(
  season: Season,
  left: number,
  size: number,
  dur: number,
  delay: number,
  drift: number,
  rot: number,
  color: string,
): CSSProperties {
  const base: CSSProperties = {
    left: `${left}%`,
    width: `${size}px`,
    height: `${season === "spring" || season === "autumn" ? Math.round(size * 0.8) : size}px`,
    background: color,
    // per-particle animation custom props (see globals.css)
    ["--dur" as string]: `${dur}s`,
    ["--delay" as string]: `${delay}s`,
    ["--drift-x" as string]: `${drift}px`,
    ["--rot" as string]: `${rot}deg`,
    ["--p-opacity" as string]: season === "summer" ? "1" : "0.9",
  };
  if (season === "spring") {
    return {
      ...base,
      borderRadius: "62% 38% 55% 45% / 55% 62% 38% 45%",
    };
  }
  if (season === "autumn") {
    return { ...base, borderRadius: "50% 12% 50% 12% / 60% 40% 60% 40%" };
  }
  if (season === "summer") {
    return {
      ...base,
      borderRadius: "9999px",
      boxShadow: "0 0 6px 2px rgba(255, 217, 138, 0.75)",
    };
  }
  return { ...base, borderRadius: "9999px" };
}

export function SeasonalParticles({ season }: { season: Season }) {
  const particles = useMemo(() => {
    const rand = mulberry32(
      season === "spring"
        ? 42
        : season === "summer"
          ? 1337
          : season === "autumn"
            ? 777
            : 2026,
    );
    return Array.from({ length: COUNT }, (_, i) => {
      const size =
        season === "winter"
          ? 3 + rand() * 3
          : season === "summer"
            ? 4 + rand() * 3
            : 6 + rand() * 5;
      return particleStyle(
        season,
        3 + rand() * 94, // left %
        Math.round(size),
        9 + rand() * 5, // 9–14s
        -(rand() * 14), // negative delay → mid-flight on load
        (rand() - 0.5) * 120, // drift −60..+60px
        120 + rand() * 300,
        PALETTE[season][i % PALETTE[season].length],
      );
    });
  }, [season]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
    >
      {particles.map((style, i) => (
        <span
          key={`${season}-${i}`}
          className={
            "celestial-particle" +
            (season === "summer" ? " celestial-firefly" : "") +
            (i >= 7 ? " hidden sm:block" : "")
          }
          style={style}
        />
      ))}
    </div>
  );
}
