// Celestial — theme-aware hero particle system (round 13 rework).
// Natural, wind-driven motion: petals/leaves tumble and sway on multi-phase
// paths while falling (a few leaves are gust-blown across the header),
// fireflies and sparkles wander closed loops with independent glow pulses,
// snow jitters down, stars twinkle in place, gold dust drifts diagonally
// with a shimmer. Pure CSS transform/opacity keyframes in globals.css driven
// by per-particle custom props — no JS timers, no requestAnimationFrame.
// Deterministic mulberry32 layout (no hydration mismatch); 6-8 particles on
// mobile / 10-14 on ≥sm; nothing at all for reduced motion (motion-reduce:hidden).
"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";

export type Season = "spring" | "summer" | "autumn" | "winter";

export type ParticleVariant =
  | "petals"
  | "fireflies"
  | "leaves"
  | "snow"
  | "stars"
  | "sparkles"
  | "goldDust";

/** tone tweaks for variants shared between several header themes */
export type ParticleTone = "default" | "cool" | "redGold" | "subdued";

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

/* #RRGGBB → rgba() string (for per-particle glow shadows) */
function rgba(hex: string, a: number): string {
  const v = hex.replace("#", "");
  const n = parseInt(v, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

const BASE_PALETTE: Record<ParticleVariant, string[]> = {
  petals: ["#F9A8C9", "#FAD0E0", "#FFF6FA"],
  fireflies: ["#FFD98A", "#FFE9B8"],
  leaves: ["#E8A15A", "#C96F35", "#D98A3D", "#B35C2A"],
  snow: ["#FFFFFF", "#F5F2EC"],
  stars: ["#F5F2EC"],
  sparkles: ["#E0559C", "#4ECDC4", "#FFD98A"],
  goldDust: ["#E8C468", "#F5DEA8"],
};

/** per-tone palette overrides (variant × tone → colors) */
const TONE_PALETTE: Partial<
  Record<ParticleVariant, Partial<Record<ParticleTone, string[]>>>
> = {
  // japanese — softer, whiter sakura pinks
  petals: { subdued: ["#F6C9D8", "#FBE9EF", "#FFFDF8"] },
  // korean — cool pale-gold / moon-green lanterns instead of warm amber
  fireflies: { cool: ["#F0ECC8", "#D8E6DA"] },
  // chinese — festive red-gold (lantern festival) instead of plain gold
  goldDust: { redGold: ["#E8C468", "#E09552", "#D25F4A"] },
};

function paletteOf(variant: ParticleVariant, tone: ParticleTone): string[] {
  return TONE_PALETTE[variant]?.[tone] ?? BASE_PALETTE[variant];
}

interface VariantSpec {
  /** particle animation class (globals.css) */
  cls: string;
  count: number;
  mobileCount: number;
  /** px size range [min, max] */
  size: [number, number];
  /** animation duration range in seconds */
  dur: [number, number];
  seed: number;
}

const VARIANT_SPECS: Record<ParticleVariant, VariantSpec> = {
  petals: { cls: "celestial-petal", count: 12, mobileCount: 7, size: [6, 11], dur: [10, 16], seed: 42 },
  fireflies: { cls: "celestial-firefly", count: 11, mobileCount: 7, size: [4, 7], dur: [13, 20], seed: 1337 },
  leaves: { cls: "celestial-leaf", count: 12, mobileCount: 7, size: [7, 12], dur: [8, 13], seed: 777 },
  snow: { cls: "celestial-snow", count: 14, mobileCount: 8, size: [3, 6], dur: [9, 15], seed: 2026 },
  stars: { cls: "celestial-star", count: 14, mobileCount: 8, size: [1, 2.5], dur: [3.5, 7], seed: 555 },
  sparkles: { cls: "celestial-sparkle", count: 10, mobileCount: 6, size: [3, 6], dur: [14, 22], seed: 909 },
  goldDust: { cls: "celestial-dust", count: 14, mobileCount: 8, size: [2, 4], dur: [16, 28], seed: 626 },
};

/** irregular petal / leaf silhouettes — cycled per particle for variety */
const PETAL_RADIUS = [
  "62% 38% 55% 45% / 55% 62% 38% 45%",
  "45% 55% 62% 38% / 62% 45% 55% 38%",
  "55% 45% 38% 62% / 38% 55% 62% 45%",
];
const LEAF_RADIUS = [
  "50% 12% 50% 12% / 60% 40% 60% 40%",
  "12% 50% 12% 50% / 40% 60% 40% 60%",
  "45% 20% 55% 15% / 55% 45% 38% 62%",
];

interface BuiltParticle {
  className: string;
  style: CSSProperties;
}

/** petals — tumble (rotate + rotateY) on a multi-phase sway while falling */
function petalStyle(rand: () => number, colors: string[], i: number, pace: number): CSSProperties {
  const size = 6 + rand() * 5;
  const color = colors[i % colors.length];
  return {
    left: `${3 + rand() * 94}%`,
    width: `${Math.round(size)}px`,
    height: `${Math.round(size * 0.8)}px`,
    background: color,
    borderRadius: PETAL_RADIUS[i % PETAL_RADIUS.length],
    ["--dur" as string]: `${((10 + rand() * 6) * pace).toFixed(1)}s`,
    ["--delay" as string]: `-${(rand() * 16).toFixed(1)}s`,
    ["--sway" as string]: `${Math.round(24 + rand() * 46)}px`,
    ["--fall-y" as string]: `${Math.round(300 + rand() * 80)}px`,
    ["--rot" as string]: `${Math.round(140 + rand() * 320)}deg`,
    ["--p-opacity" as string]: (0.7 + rand() * 0.3).toFixed(2),
  };
}

/** leaves — like petals but sharper; blowers get the gust keyframe instead */
function leafStyle(rand: () => number, colors: string[], i: number, blow: boolean): CSSProperties {
  const size = 7 + rand() * 5;
  const color = colors[i % colors.length];
  const base: CSSProperties = {
    width: `${Math.round(size)}px`,
    height: `${Math.round(size * 0.75)}px`,
    background: color,
    borderRadius: LEAF_RADIUS[i % LEAF_RADIUS.length],
    ["--delay" as string]: `-${(rand() * 12).toFixed(1)}s`,
    ["--rot" as string]: `${Math.round(320 + rand() * 420)}deg`,
    ["--p-opacity" as string]: (0.75 + rand() * 0.25).toFixed(2),
  };
  if (blow) {
    // gust riders: anchored at the start edge (left/top auto), the keyframe
    // carries them -12vw → 118vw across the header in a fixed vertical band
    return {
      ...base,
      ["--dur" as string]: `${(6.5 + rand() * 3).toFixed(1)}s`,
      ["--blow-y" as string]: `${Math.round(30 + rand() * 180)}px`,
      ["--blow-rise" as string]: `${Math.round(24 + rand() * 36)}px`,
    };
  }
  return {
    ...base,
    left: `${2 + rand() * 96}%`,
    ["--dur" as string]: `${(8 + rand() * 5).toFixed(1)}s`,
    ["--sway" as string]: `${Math.round(30 + rand() * 55)}px`,
    ["--fall-y" as string]: `${Math.round(300 + rand() * 90)}px`,
  };
}

/** snow — near-linear fall with a small horizontal jitter */
function snowStyle(rand: () => number, colors: string[], i: number): CSSProperties {
  const size = 3 + rand() * 3;
  return {
    left: `${3 + rand() * 94}%`,
    width: `${Math.round(size)}px`,
    height: `${Math.round(size)}px`,
    background: colors[i % colors.length],
    borderRadius: "9999px",
    ["--dur" as string]: `${(9 + rand() * 6).toFixed(1)}s`,
    ["--delay" as string]: `-${(rand() * 15).toFixed(1)}s`,
    ["--jit" as string]: `${Math.round(8 + rand() * 14)}px`,
    ["--fall-y" as string]: `${Math.round(300 + rand() * 80)}px`,
    ["--p-opacity" as string]: (0.8 + rand() * 0.2).toFixed(2),
  };
}

/** fireflies / sparkles — closed-loop wander + independent glow pulse */
function wanderStyle(
  rand: () => number,
  colors: string[],
  i: number,
  glowClass: "firefly" | "sparkle",
): CSSProperties {
  const size = 4 + rand() * 3;
  const color = colors[i % colors.length];
  return {
    left: `${4 + rand() * 92}%`,
    top: `${10 + rand() * 72}%`,
    width: `${size.toFixed(1)}px`,
    height: `${size.toFixed(1)}px`,
    background: color,
    borderRadius: "9999px",
    boxShadow: `0 0 ${glowClass === "firefly" ? 6 : 5}px 2px ${rgba(color, glowClass === "firefly" ? 0.75 : 0.85)}`,
    // sparkles sit as diamonds (static `rotate` composes with the animated transform)
    ...(glowClass === "sparkle" ? { rotate: "45deg" } : {}),
    ["--dur" as string]: `${(13 + rand() * 8).toFixed(1)}s`,
    ["--delay" as string]: `-${(rand() * 18).toFixed(1)}s`,
    // wander waypoints (looped; each firefly roams its own small patch)
    ["--wx1" as string]: `${Math.round((rand() - 0.5) * 64)}px`,
    ["--wy1" as string]: `${Math.round((rand() - 0.5) * 48)}px`,
    ["--wx2" as string]: `${Math.round((rand() - 0.5) * 64)}px`,
    ["--wy2" as string]: `${Math.round((rand() - 0.5) * 48)}px`,
    // glow pulse on its own clock (phase-shifted per particle)
    ["--glow-dur" as string]: `${(2.6 + rand() * 2.2).toFixed(1)}s`,
    ["--glow-delay" as string]: `-${(rand() * 4).toFixed(1)}s`,
  };
}

/** stars — fixed positions, opacity twinkle only */
function starStyle(rand: () => number, colors: string[], i: number): CSSProperties {
  const size = 1 + rand() * 1.6;
  const color = colors[i % colors.length];
  return {
    left: `${2 + rand() * 96}%`,
    top: `${2 + rand() * 52}%`,
    width: `${size.toFixed(1)}px`,
    height: `${size.toFixed(1)}px`,
    background: color,
    borderRadius: "9999px",
    boxShadow: `0 0 3px 1px ${rgba(color, 0.6)}`,
    ["--dur" as string]: `${(3.5 + rand() * 3.5).toFixed(1)}s`,
    ["--delay" as string]: `-${(rand() * 7).toFixed(1)}s`,
  };
}

/** gold dust — slow diagonal drift + shimmering opacity */
function dustStyle(rand: () => number, colors: string[], i: number): CSSProperties {
  const size = 2 + rand() * 2.5;
  const color = colors[i % colors.length];
  return {
    left: `${3 + rand() * 94}%`,
    top: `${5 + rand() * 80}%`,
    width: `${size.toFixed(1)}px`,
    height: `${size.toFixed(1)}px`,
    background: color,
    borderRadius: "9999px",
    boxShadow: `0 0 4px 1px ${rgba(color, 0.55)}`,
    ["--dur" as string]: `${(16 + rand() * 12).toFixed(1)}s`,
    ["--delay" as string]: `-${(rand() * 24).toFixed(1)}s`,
    ["--dx" as string]: `${Math.round((rand() - 0.35) * 130)}px`,
    ["--dy" as string]: `${Math.round(70 + rand() * 150)}px`,
    ["--shim-dur" as string]: `${(3.2 + rand() * 2.8).toFixed(1)}s`,
    ["--shim-delay" as string]: `-${(rand() * 6).toFixed(1)}s`,
    ["--p-opacity" as string]: (0.6 + rand() * 0.4).toFixed(2),
  };
}

function buildParticles(variant: ParticleVariant, tone: ParticleTone): BuiltParticle[] {
  const spec = VARIANT_SPECS[variant];
  const colors = paletteOf(variant, tone);
  // subdued (japanese): slower + visibly sparser
  const subdued = tone === "subdued";
  const pace = subdued ? 1.35 : 1;
  const count = subdued ? 8 : spec.count;
  const mobileCount = subdued ? 5 : spec.mobileCount;
  const rand = mulberry32(spec.seed + (tone === "default" ? 0 : 7919));

  // 3 of 12 leaves ride the gust (translateX-dominant blow-across)
  const blowers = variant === "leaves" ? new Set([2, 7, 10]) : new Set<number>();

  return Array.from({ length: count }, (_, i) => {
    let style: CSSProperties;
    let cls: string;
    switch (variant) {
      case "petals":
        style = petalStyle(rand, colors, i, pace);
        cls = spec.cls;
        break;
      case "leaves":
        style = leafStyle(rand, colors, i, blowers.has(i));
        cls = blowers.has(i) ? "celestial-leaf-blow" : spec.cls;
        break;
      case "snow":
        style = snowStyle(rand, colors, i);
        cls = spec.cls;
        break;
      case "stars":
        style = starStyle(rand, colors, i);
        cls = spec.cls;
        break;
      case "sparkles":
        style = wanderStyle(rand, colors, i, "sparkle");
        cls = spec.cls;
        break;
      case "fireflies":
        style = wanderStyle(rand, colors, i, "firefly");
        cls = spec.cls;
        break;
      default:
        style = dustStyle(rand, colors, i);
        cls = spec.cls;
    }
    return {
      className: `celestial-particle ${cls}${i >= mobileCount ? " hidden sm:block" : ""}`,
      style,
    };
  });
}

export function SeasonalParticles({
  variant,
  tone = "default",
}: {
  variant: ParticleVariant;
  tone?: ParticleTone;
}) {
  const particles = useMemo(
    () => buildParticles(variant, tone),
    [variant, tone],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
    >
      {particles.map((p, i) => (
        <span key={`${variant}-${tone}-${i}`} className={p.className} style={p.style} />
      ))}
    </div>
  );
}
