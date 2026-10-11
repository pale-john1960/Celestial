// GET /api/events — aggregated events for an iso range (all sources)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aggregateEvents } from "@/lib/events";
import type { EventInstance, SourceSettings } from "@/lib/events";
import type { ImportedEvent } from "@prisma/client";
import { parseIso, isoDate } from "@/lib/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function rowToInstance(row: ImportedEvent): EventInstance {
  const g = parseIso(row.iso) ?? { year: 1970, month: 1, day: 1 };
  const manual = row.sourceName === "manual";
  return {
    id: `imp-${row.id}`,
    ruleId: "imported",
    category: "imported",
    iso: row.iso,
    gregorian: g,
    isHoliday: row.isHoliday,
    emoji: manual ? "✍️" : "📥",
    names: { en: row.title, ja: row.title, fa: row.title },
    descriptions: {
      en: row.description ?? "",
      ja: row.description ?? "",
      fa: row.description ?? "",
    },
    source: manual ? "manual" : "imported",
    provider: manual ? "manual" : undefined,
    dbId: row.id,
    ...(row.recurYearly ? { recurring: true, anchorIso: row.iso } : {}),
  };
}

/**
 * Map a row to instances for [from, to]. Non-recurring rows → the single
 * anchor instance (range-checked by the caller's query). Yearly-recurring
 * rows additionally expand to every year in the range: date = (y, month,
 * day) of the anchor, except a Feb 29 anchor in a non-leap year → Feb 28
 * (documented fallback). Same dbId everywhere so deleting the row kills
 * the whole series; ids are unique per year (dedupe-safe).
 */
function rowToInstances(
  row: ImportedEvent,
  from: string,
  to: string,
  fromYear: number,
  toYear: number,
): EventInstance[] {
  const anchor = rowToInstance(row);
  if (!row.recurYearly) return [anchor];

  const out: EventInstance[] = [];
  const anchorG = parseIso(row.iso);
  if (anchorG) {
    for (let y = fromYear; y <= toYear; y++) {
      if (y === anchorG.year) continue;
      // Feb 29 anchor in a non-leap year falls back to Feb 28
      const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      const day =
        anchorG.month === 2 && anchorG.day === 29 && !leap ? 28 : anchorG.day;
      const iso = isoDate({ year: y, month: anchorG.month, day });
      if (iso < from || iso > to) continue;
      out.push({
        ...anchor,
        id: `imp-${row.id}-y${y}`,
        iso,
        gregorian: { year: y, month: anchorG.month, day },
      });
    }
  }
  // anchor instance first when it is inside the range
  if (row.iso >= from && row.iso <= to) out.unshift(anchor);
  return out;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const from = sp.get("from") ?? "";
    const to = sp.get("to") ?? "";
    const fromG = parseIso(from);
    const toG = parseIso(to);
    if (!fromG || !toG || from > to) {
      return NextResponse.json(
        { error: "invalid from/to range" },
        { status: 400 },
      );
    }

    // missing params default to 1 (enabled); explicit "0" disables
    const flag = (key: string) => sp.get(key) !== "0";
    const settings: SourceSettings = {
      international: flag("international"),
      us: flag("us"),
      japan: flag("japan"),
      persianCultural: flag("persianCultural"),
      persianReligious: flag("persianReligious"),
      persianNational: flag("persianNational"),
      imported: flag("imported"),
      online: flag("online"),
    };

    let imported: EventInstance[] = [];
    if (settings.imported) {
      // fetch in-range rows PLUS every yearly-recurring row (its expansion
      // can land inside the range even when the anchor is far outside, e.g.
      // a 1990 birthday anchor shown in 2026)
      const rows = await db.importedEvent.findMany({
        where: {
          OR: [{ iso: { gte: from, lte: to } }, { recurYearly: true }],
        },
        orderBy: { iso: "asc" },
      });
      imported = rows.flatMap((row) =>
        rowToInstances(row, from, to, fromG.year, toG.year),
      );
    }

    const result = await aggregateEvents(from, to, settings, imported);

    // ENGINE BUG WORKAROUND (see worklog 3-a): aggregateEvents emits online
    // US/JP instances once per in-range builtin instance of the same category
    // (duplicates). Dedupe by id here so the UI never shows repeats.
    const seen = new Set<string>();
    const events = result.events.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    return NextResponse.json({ ...result, events });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed to aggregate events" },
      { status: 500 },
    );
  }
}
