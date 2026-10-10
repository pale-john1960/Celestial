// GET /api/events — aggregated events for an iso range (all sources)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aggregateEvents } from "@/lib/events";
import type { EventInstance, SourceSettings } from "@/lib/events";
import type { ImportedEvent } from "@prisma/client";
import { parseIso } from "@/lib/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function rowToInstance(row: ImportedEvent): EventInstance {
  const g = parseIso(row.iso) ?? { year: 1970, month: 1, day: 1 };
  return {
    id: `imp-${row.id}`,
    ruleId: "imported",
    category: "imported",
    iso: row.iso,
    gregorian: g,
    isHoliday: row.isHoliday,
    emoji: "📥",
    names: { en: row.title, ja: row.title, fa: row.title },
    descriptions: {
      en: row.description ?? "",
      ja: row.description ?? "",
      fa: row.description ?? "",
    },
    source: "imported",
    dbId: row.id,
  };
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
      const rows = await db.importedEvent.findMany({
        where: { iso: { gte: from, lte: to } },
        orderBy: { iso: "asc" },
      });
      imported = rows.map(rowToInstance);
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
