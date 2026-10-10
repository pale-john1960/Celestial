// POST /api/events/import — multipart file import (JSON / TXT / CSV, ≤256KB, ≤500 events)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseAuto } from "@/lib/import/parse";
import { gregorianToJalali, isoDate, parseIso } from "@/lib/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 256 * 1024;
const MAX_EVENTS = 500;
const ALLOWED_EXT = [".json", ".txt", ".csv"];

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { imported: 0, errors: ["missing multipart field 'file'"] },
        { status: 400 },
      );
    }
    const lower = file.name.toLowerCase();
    if (!ALLOWED_EXT.some((ext) => lower.endsWith(ext))) {
      return NextResponse.json(
        { imported: 0, errors: ["only .json, .txt and .csv files are accepted"] },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { imported: 0, errors: ["file too large (max 256KB)"] },
        { status: 400 },
      );
    }

    const text = await file.text();
    const parsed = parseAuto(file.name, text);

    if (parsed.events.length === 0) {
      return NextResponse.json(
        { imported: 0, errors: parsed.errors.length ? parsed.errors : ["no valid events found"] },
        { status: 400 },
      );
    }
    if (parsed.events.length > MAX_EVENTS) {
      return NextResponse.json(
        { imported: 0, errors: [`too many events: ${parsed.events.length} (max ${MAX_EVENTS})`] },
        { status: 400 },
      );
    }

    const rows = parsed.events.map((e) => {
      const g = parseIso(e.iso)!;
      return {
        iso: e.iso,
        jalaliIso: isoDate(gregorianToJalali(g)),
        title: e.title,
        description: e.description ?? null,
        isHoliday: e.isHoliday ?? false,
        sourceName: file.name,
      };
    });

    const result = await db.importedEvent.createMany({ data: rows });

    return NextResponse.json({
      imported: result.count,
      errors: parsed.errors,
    });
  } catch (err) {
    return NextResponse.json(
      {
        imported: 0,
        errors: [err instanceof Error ? err.message : "import failed"],
      },
      { status: 500 },
    );
  }
}
