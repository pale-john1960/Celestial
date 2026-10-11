// Celestial — client data layer: typed fetchers + TanStack Query hooks
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { EventInstance, SourceSettings } from "@/lib/events";

export interface EventsResponse {
  events: EventInstance[];
  usOnline: boolean;
  japanOnline: boolean;
}

export interface NtpResponse {
  ok: boolean;
  ntpMs: number;
  deviceMs: number;
  offsetMs: number;
  rttMs: number;
  server: string;
}

export interface ImportedRow {
  id: string;
  iso: string;
  jalaliIso: string;
  title: string;
  description: string | null;
  isHoliday: boolean;
  recurYearly: boolean;
  /** per-event dot color (#rrggbb lowercase) — null = category default */
  color: string | null;
  sourceName: string;
}

export interface ImportResult {
  imported: number;
  errors: string[];
}

const SOURCE_KEYS = [
  "international",
  "us",
  "japan",
  "persianCultural",
  "persianReligious",
  "persianNational",
  "imported",
  "online",
] as const;

/** Stable hash of source flags — part of every events cache key */
export function sourcesHash(sources: SourceSettings): string {
  return SOURCE_KEYS.map((k) => (sources[k] ? 1 : 0)).join("");
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* keep status message */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export async function fetchEvents(
  from: string,
  to: string,
  sources: SourceSettings,
): Promise<EventsResponse> {
  const params = new URLSearchParams({ from, to });
  for (const key of SOURCE_KEYS) params.set(key, sources[key] ? "1" : "0");
  return fetchJson<EventsResponse>(`/api/events?${params.toString()}`);
}

/** Aggregated events for an iso range, keyed by [from, to, sourcesHash] */
export function useEvents(
  from: string,
  to: string,
  sources: SourceSettings,
  enabled = true,
) {
  const hash = sourcesHash(sources);
  return useQuery<EventsResponse>({
    queryKey: ["events", from, to, hash],
    queryFn: () => fetchEvents(from, to, sources),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && from.length > 0 && to.length > 0 && from <= to,
  });
}

/** One NTP sync on mount; manual refresh via refetch() */
export function useNtpSync() {
  return useQuery<NtpResponse>({
    queryKey: ["ntp"],
    queryFn: () => fetchJson<NtpResponse>("/api/time/ntp"),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 0,
  });
}

/** All imported events (wide range) for the import dialog list */
export function useImportedEvents(
  from = "1900-01-01",
  to = "2100-12-31",
  enabled = true,
) {
  return useQuery<ImportedRow[]>({
    queryKey: ["imported", from, to],
    queryFn: async () => {
      const res = await fetchJson<{ events: ImportedRow[] }>(
        `/api/events/imported?from=${from}&to=${to}`,
      );
      return res.events;
    },
    staleTime: 60 * 1000,
    enabled,
  });
}

/** POST an uploaded file; throws with the first server error reason */
export async function importEventsFile(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/events/import", { method: "POST", body: form });
  const data = (await res.json().catch(() => null)) as ImportResult | null;
  if (!res.ok || !data) {
    throw new Error(data?.errors?.[0] ?? `HTTP ${res.status}`);
  }
  return data;
}

export interface CustomEventInput {
  iso: string;
  title: string;
  description?: string;
  isHoliday?: boolean;
  recurYearly?: boolean;
  /** per-event dot color "#rrggbb" — null/omitted = category default */
  color?: string | null;
}

export interface UpdateEventInput extends CustomEventInput {
  id: string;
}

/** Create a single manual event (✍️) — POST /api/events/custom */
export async function createCustomEvent(
  input: CustomEventInput,
): Promise<ImportedRow> {
  const res = await fetchJson<{ event: ImportedRow }>("/api/events/custom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.event;
}

/** Edit an existing event row (anchor of a recurring series) — PATCH */
export async function updateEvent(input: UpdateEventInput): Promise<ImportedRow> {
  const res = await fetchJson<{ event: ImportedRow }>("/api/events/custom", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.event;
}

export async function deleteImportedEvents(opts: {
  id?: string;
  all?: boolean;
}): Promise<{ ok: boolean; deleted: number }> {
  const params = new URLSearchParams();
  if (opts.id) params.set("id", opts.id);
  if (opts.all) params.set("all", "1");
  return fetchJson<{ ok: boolean; deleted: number }>(
    `/api/events/imported?${params.toString()}`,
    { method: "DELETE" },
  );
}

/** Invalidate every events/imported query (after import or delete) */
export function useInvalidateEvents() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["events"] });
    queryClient.invalidateQueries({ queryKey: ["imported"] });
  };
}
