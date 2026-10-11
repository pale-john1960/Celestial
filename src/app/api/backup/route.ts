// POST /api/backup — restore a backup file: REPLACE ALL imported events with
// the body's `events` array (replace-all semantics, so the round-trip with
// the client's export is exact). Every row is validated with the same rules
// as POST /api/events/custom (iso range/format, title caps, description cap,
// boolean flags, #rrggbb color); the backup format additionally carries
// `sourceName` so manual ✍️ vs imported 📥 rows survive round-trips. The
// delete + insert run inside one transaction — a failed insert never leaves
// the calendar emptied.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gregorianToJalali, isoDate, parseIso } from "@/lib/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const MAX_ROWS = 5000;
const MAX_SOURCE_NAME = 256;

interface ValidatedRow {
  g: { year: number; month: number; day: number };
  title: string;
  description: string | null;
  isHoliday: boolean;
  recurYearly: boolean;
  color: string | null;
  sourceName: string;
}

/**
 * Validate one backup row — the custom-events POST rules verbatim, plus the
 * backup-specific optional `sourceName` (default "manual" when absent/blank).
 * Returns an error string when invalid.
 */
function validateRow(row: Record<string, unknown>): ValidatedRow | string {
  const { iso, title, description, isHoliday, recurYearly, color, sourceName } =
    row;

  if (typeof iso !== "string") return "missing iso date";
  const g = parseIso(iso);
  if (!g || g.year < MIN_YEAR || g.year > MAX_YEAR) {
    return `iso must be a valid date between ${MIN_YEAR} and ${MAX_YEAR}`;
  }

  if (typeof title !== "string" || title.trim().length < 1 || title.trim().length > 120) {
    return "title must be 1-120 characters";
  }

  if (
    description !== undefined &&
    description !== null &&
    (typeof description !== "string" || description.length > 500)
  ) {
    return "description must be a string of at most 500 characters";
  }

  if (isHoliday !== undefined && typeof isHoliday !== "boolean") {
    return "isHoliday must be a boolean";
  }

  if (recurYearly !== undefined && typeof recurYearly !== "boolean") {
    return "recurYearly must be a boolean";
  }

  // optional per-event color: "#rrggbb" (any hex case) or null (category default)
  if (
    color !== undefined &&
    color !== null &&
    (typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color))
  ) {
    return "color must be a #rrggbb hex string or null";
  }

  // backup-specific: preserve the original source (manual ✍️ vs imported 📥)
  if (
    sourceName !== undefined &&
    sourceName !== null &&
    (typeof sourceName !== "string" || sourceName.length > MAX_SOURCE_NAME)
  ) {
    return `sourceName must be a string of at most ${MAX_SOURCE_NAME} characters`;
  }

  return {
    g,
    title: title.trim(),
    description:
      typeof description === "string" && description.trim().length > 0
        ? description.trim()
        : null,
    isHoliday: isHoliday === true,
    recurYearly: recurYearly === true,
    color: typeof color === "string" ? color.toLowerCase() : null,
    sourceName:
      typeof sourceName === "string" && sourceName.trim().length > 0
        ? sourceName.trim()
        : "manual",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "invalid JSON body" },
        { status: 400 },
      );
    }

    const { events } = body as { events?: unknown };
    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: "missing events array" },
        { status: 400 },
      );
    }
    if (events.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `too many events: ${events.length} (max ${MAX_ROWS})` },
        { status: 400 },
      );
    }

    const rows: ValidatedRow[] = [];
    for (let i = 0; i < events.length; i++) {
      const row = events[i];
      if (!row || typeof row !== "object") {
        return NextResponse.json(
          { error: `invalid event at index ${i}: expected an object` },
          { status: 400 },
        );
      }
      const validated = validateRow(row as Record<string, unknown>);
      if (typeof validated === "string") {
        return NextResponse.json(
          { error: `invalid event at index ${i}: ${validated}` },
          { status: 400 },
        );
      }
      rows.push(validated);
    }

    // replace-all inside one transaction — an insert failure must not leave
    // the calendar emptied (interactive form; generous timeout for 5000 rows)
    const restored = await db.$transaction(
      async (tx) => {
        await tx.importedEvent.deleteMany({});
        if (rows.length === 0) return 0;
        const result = await tx.importedEvent.createMany({
          data: rows.map((r) => ({
            iso: isoDate(r.g),
            jalaliIso: isoDate(gregorianToJalali(r.g)),
            title: r.title,
            description: r.description,
            isHoliday: r.isHoliday,
            recurYearly: r.recurYearly,
            color: r.color,
            sourceName: r.sourceName,
          })),
        });
        return result.count;
      },
      { timeout: 30_000 },
    );

    return NextResponse.json({ restored });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "failed to restore backup",
      },
      { status: 500 },
    );
  }
}
