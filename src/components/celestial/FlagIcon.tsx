// Celestial — flag / globe SVG icons replacing flag & globe EMOJIS at
// render time.
//
// WHY (user complaint, round 13): Windows ships no country-flag emoji font,
// so the two-codepoint regional-indicator sequences render as plain LETTERS
// ("US", "JP", "IR") instead of flags. The fix: every flag-ish emoji in
// event data (🇺🇸 🇯🇵 🇮🇷 🌍 🌐 🌏) is swapped — at RENDER time only, the
// data files keep their emoji values — for the matching SVG asset under
// /public/flags/: us.svg, jp.svg, ir.svg, int.svg (wireframe globe).
//
// Pure presentational module — no hooks, safe on server & client.

import { cn } from "@/lib/utils";

/** flag assets available in /public/flags (int = the globe) */
export type FlagCode = "us" | "jp" | "ir" | "int";

/**
 * Exact-codepoint emoji → flag-asset map.
 *
 * Regional-indicator flags are TWO codepoints (🇺🇸 = U+1F1FA U+1F1F8, the
 * "US" pair Windows renders as letters) and globe emojis are one; all are
 * written with explicit escapes so the sequences can never drift through
 * editor/encoding accidents. Keys resolve to the real characters at parse
 * time, so lookups match the literal emoji strings in the event data.
 */
const FLAG_EMOJI_CODES: Readonly<Record<string, FlagCode>> = {
  "\u{1F1FA}\u{1F1F8}": "us", // 🇺🇸 United States
  "\u{1F1EF}\u{1F1F5}": "jp", // 🇯🇵 Japan
  "\u{1F1EE}\u{1F1F7}": "ir", // 🇮🇷 Iran
  "\u{1F30D}": "int", // 🌍 globe (Europe/Africa)
  "\u{1F310}": "int", // 🌐 globe with meridians
  "\u{1F30F}": "int", // 🌏 globe (Asia/Australia)
};

/** emoji decoration codepoints some platforms append (stripped on retry) */
const DECORATIONS = new Set(["\u{FE0F}", "\u{200D}"]);

/**
 * Map an event's emoji string to a /flags asset code.
 *
 * Handles the exact two-codepoint regional-indicator sequences (the form
 * used throughout the event data), retries after stripping variation
 * selectors / ZWJ, then falls back to a contains-scan. Returns null for
 * every regular pictogram emoji (those keep rendering as characters).
 */
export function flagEmojiToCode(emoji: string): FlagCode | null {
  const direct = FLAG_EMOJI_CODES[emoji];
  if (direct) return direct;

  // tolerate FE0F / ZWJ decorations appended to the sequence
  const stripped = Array.from(emoji)
    .filter((ch) => !DECORATIONS.has(ch))
    .join("");
  if (stripped !== emoji) {
    const retry = FLAG_EMOJI_CODES[stripped];
    if (retry) return retry;
  }

  // last resort: the flag sequence may sit inside a longer decorated string
  for (const seq of Object.keys(FLAG_EMOJI_CODES)) {
    if (emoji.includes(seq)) return FLAG_EMOJI_CODES[seq];
  }
  return null;
}

/**
 * Small rounded flag (or globe) image from /flags/*.svg. Scales with the
 * inherited font size (1em tall, 3:2 wide — the assets' viewBox ratio), so
 * it drop-in replaces an emoji glyph inside any text-size context. Pass a
 * custom className (e.g. "text-2xl" or explicit h-/w-) to size it.
 */
export function FlagIcon({
  code,
  className,
}: {
  code: FlagCode;
  className?: string;
}) {
  return (
    <img
      src={`/flags/${code}.svg`}
      alt=""
      aria-hidden
      draggable={false}
      className={cn(
        "pointer-events-none inline-block h-[1em] w-[1.5em] select-none rounded-[2px] object-cover align-[-0.125em]",
        className,
      )}
    />
  );
}

/**
 * Render an event's emoji: flag/globe emojis become <FlagIcon/> SVGs (the
 * Windows-letters fix), every other emoji renders as the character itself.
 * Decorative by design (aria-hidden) — the event's name text sits right
 * next to it in every usage site.
 */
export function EventGlyph({
  emoji,
  className,
}: {
  emoji: string;
  className?: string;
}) {
  const code = flagEmojiToCode(emoji);
  if (code) return <FlagIcon code={code} className={className} />;
  return (
    <span aria-hidden className={cn("leading-none", className)}>
      {emoji}
    </span>
  );
}
