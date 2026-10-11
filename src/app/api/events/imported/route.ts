// GET /api/events/imported?from=&to= — list imported events for a range
// DELETE /api/events/imported?id=X | ?all=1 — remove one / all imported events
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseIso } from "@/lib/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    let from = sp.get("from") ?? "1900-01-01";
    let to = sp.get("to") ?? "2100-12-31";
    if (!parseIso(from)) from = "1900-01-01";
    if (!parseIso(to)) to = "2100-12-31";
    if (from > to) [from, to] = [to, from];

    const rows = await db.importedEvent.findMany({
      where: { iso: { gte: from, lte: to } },
      orderBy: [{ iso: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      events: rows.map((row) => ({
        id: row.id,
        iso: row.iso,
        jalaliIso: row.jalaliIso,
        title: row.title,
        description: row.description,
        isHoliday: row.isHoliday,
        recurYearly: row.recurYearly,
        sourceName: row.sourceName,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed to list imported events" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const id = sp.get("id");
    const all = sp.get("all") === "1";

    if (!all && !id) {
      return NextResponse.json(
        { error: "provide ?id=<eventId> or ?all=1" },
        { status: 400 },
      );
    }

    const result = all
      ? await db.importedEvent.deleteMany({})
      : await db.importedEvent.deleteMany({ where: { id: id as string } });
    return NextResponse.json({ ok: true, deleted: result.count });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed to delete imported events" },
      { status: 500 },
    );
  }
}
