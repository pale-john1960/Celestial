// POST /api/events/custom — create a single manual event (✍️)
// Stored as an ImportedEvent row with sourceName "manual" so it flows through
// the imported pipeline (list/delete/imported-source toggle) unchanged.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gregorianToJalali, isoDate, parseIso } from "@/lib/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "invalid JSON body" },
        { status: 400 },
      );
    }
    const { iso, title, description, isHoliday } = body as {
      iso?: unknown;
      title?: unknown;
      description?: unknown;
      isHoliday?: unknown;
    };

    if (typeof iso !== "string") {
      return NextResponse.json({ error: "missing iso date" }, { status: 400 });
    }
    const g = parseIso(iso);
    if (!g || g.year < MIN_YEAR || g.year > MAX_YEAR) {
      return NextResponse.json(
        { error: `iso must be a valid date between ${MIN_YEAR} and ${MAX_YEAR}` },
        { status: 400 },
      );
    }

    if (typeof title !== "string" || title.trim().length < 1 || title.trim().length > 120) {
      return NextResponse.json(
        { error: "title must be 1-120 characters" },
        { status: 400 },
      );
    }

    if (
      description !== undefined &&
      description !== null &&
      (typeof description !== "string" || description.length > 500)
    ) {
      return NextResponse.json(
        { error: "description must be a string of at most 500 characters" },
        { status: 400 },
      );
    }

    if (isHoliday !== undefined && typeof isHoliday !== "boolean") {
      return NextResponse.json(
        { error: "isHoliday must be a boolean" },
        { status: 400 },
      );
    }

    const desc =
      typeof description === "string" && description.trim().length > 0
        ? description.trim()
        : null;

    const row = await db.importedEvent.create({
      data: {
        iso: isoDate(g),
        jalaliIso: isoDate(gregorianToJalali(g)),
        title: title.trim(),
        description: desc,
        isHoliday: isHoliday === true,
        sourceName: "manual",
      },
    });

    return NextResponse.json(
      {
        event: {
          id: row.id,
          iso: row.iso,
          jalaliIso: row.jalaliIso,
          title: row.title,
          description: row.description,
          isHoliday: row.isHoliday,
          sourceName: row.sourceName,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed to create event" },
      { status: 500 },
    );
  }
}
