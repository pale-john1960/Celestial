// POST /api/events/custom — create a single manual event (✍️)
// PATCH /api/events/custom — edit an existing ImportedEvent row (manual ✍️ or
//   imported 📥; edits the ANCHOR of a recurring series → whole series updates)
// Stored as an ImportedEvent row with sourceName "manual" so it flows through
// the imported pipeline (list/delete/imported-source toggle) unchanged.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gregorianToJalali, isoDate, parseIso } from "@/lib/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

interface ValidatedEvent {
  g: { year: number; month: number; day: number };
  title: string;
  description: string | null;
  isHoliday: boolean;
  recurYearly: boolean;
}

/** Validate a create/update body; returns an error string when invalid */
function validate(body: Record<string, unknown>): ValidatedEvent | string {
  const { iso, title, description, isHoliday, recurYearly } = body;

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

  return {
    g,
    title: title.trim(),
    description:
      typeof description === "string" && description.trim().length > 0
        ? description.trim()
        : null,
    isHoliday: isHoliday === true,
    recurYearly: recurYearly === true,
  };
}

function rowJson(row: {
  id: string;
  iso: string;
  jalaliIso: string;
  title: string;
  description: string | null;
  isHoliday: boolean;
  recurYearly: boolean;
  sourceName: string;
}) {
  return {
    id: row.id,
    iso: row.iso,
    jalaliIso: row.jalaliIso,
    title: row.title,
    description: row.description,
    isHoliday: row.isHoliday,
    recurYearly: row.recurYearly,
    sourceName: row.sourceName,
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

    const validated = validate(body as Record<string, unknown>);
    if (typeof validated === "string") {
      return NextResponse.json({ error: validated }, { status: 400 });
    }

    const row = await db.importedEvent.create({
      data: {
        iso: isoDate(validated.g),
        jalaliIso: isoDate(gregorianToJalali(validated.g)),
        title: validated.title,
        description: validated.description,
        isHoliday: validated.isHoliday,
        recurYearly: validated.recurYearly,
        sourceName: "manual",
      },
    });

    return NextResponse.json({ event: rowJson(row) }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed to create event" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "invalid JSON body" },
        { status: 400 },
      );
    }
    const { id } = body as { id?: unknown };
    if (typeof id !== "string" || id.length < 1) {
      return NextResponse.json({ error: "missing event id" }, { status: 400 });
    }

    const validated = validate(body as Record<string, unknown>);
    if (typeof validated === "string") {
      return NextResponse.json({ error: validated }, { status: 400 });
    }

    const existing = await db.importedEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "event not found" },
        { status: 404 },
      );
    }

    const row = await db.importedEvent.update({
      where: { id },
      data: {
        iso: isoDate(validated.g),
        jalaliIso: isoDate(gregorianToJalali(validated.g)),
        title: validated.title,
        description: validated.description,
        isHoliday: validated.isHoliday,
        recurYearly: validated.recurYearly,
      },
    });

    return NextResponse.json({ event: rowJson(row) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed to update event" },
      { status: 500 },
    );
  }
}
