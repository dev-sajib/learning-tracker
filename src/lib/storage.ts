"use client";

import type { TrackerState, Topic, Subtopic, Entry } from "./types";

const LOCAL_KEY = "devtrack:v1";
const MIGRATED_KEY = "devtrack:migrated:v1";

const EMPTY: TrackerState = {
  topics: [],
  subtopics: [],
  entries: [],
  version: 2,
};

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as T;
}

// === reads ===

export async function fetchState(): Promise<TrackerState> {
  const res = await fetch("/api/state", { cache: "no-store" });
  return jsonOrThrow<TrackerState>(res);
}

// === mutations ===

export async function createTopic(name: string, color?: string): Promise<Topic> {
  const res = await fetch("/api/topics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, color }),
  });
  return jsonOrThrow<Topic>(res);
}

export async function deleteTopic(id: string): Promise<void> {
  const res = await fetch(`/api/topics/${encodeURIComponent(id)}`, { method: "DELETE" });
  await jsonOrThrow(res);
}

export async function createSubtopic(topicId: string, name: string): Promise<Subtopic> {
  const res = await fetch("/api/subtopics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ topicId, name }),
  });
  return jsonOrThrow<Subtopic>(res);
}

export async function deleteSubtopic(id: string): Promise<void> {
  const res = await fetch(`/api/subtopics/${encodeURIComponent(id)}`, { method: "DELETE" });
  await jsonOrThrow(res);
}

export async function createEntry(data: {
  topicId: string;
  subtopicId?: string;
  summary: string;
  date?: string;
}): Promise<Entry> {
  const res = await fetch("/api/entries", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return jsonOrThrow<Entry>(res);
}

export async function deleteEntry(id: string): Promise<void> {
  const res = await fetch(`/api/entries/${encodeURIComponent(id)}`, { method: "DELETE" });
  await jsonOrThrow(res);
}

export async function importState(
  payload: TrackerState,
  mode: "merge" | "replace" = "merge"
): Promise<void> {
  const res = await fetch("/api/import", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...payload, mode }),
  });
  await jsonOrThrow(res);
}

export async function resetAll(): Promise<void> {
  const res = await fetch("/api/reset", { method: "POST" });
  await jsonOrThrow(res);
}

// === export (client-side from a snapshot) ===

export function exportJSON(state: TrackerState): string {
  return JSON.stringify(state, null, 2);
}

// === one-time localStorage -> DB migration ===

type LegacyEntry = Partial<Entry> & { minutes?: number; notes?: string };

function readLegacy(): TrackerState | null {
  if (typeof window === "undefined") return null;
  if (window.localStorage.getItem(MIGRATED_KEY)) return null;
  const raw = window.localStorage.getItem(LOCAL_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<TrackerState> & { entries?: LegacyEntry[] };
    if (!Array.isArray(parsed.topics)) return null;
    const now = new Date().toISOString();
    return {
      topics: parsed.topics,
      subtopics: parsed.subtopics ?? [],
      entries: (parsed.entries ?? []).map((e: LegacyEntry) => ({
        id: e.id ?? uid(),
        topicId: e.topicId!,
        subtopicId: e.subtopicId,
        date: e.date!,
        summary: e.summary ?? e.notes ?? "(no summary)",
        createdAt: e.createdAt ?? now,
      })),
      version: 2,
    };
  } catch {
    return null;
  }
}

function markMigrated() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MIGRATED_KEY, "1");
}

/**
 * On first load: if localStorage has data and DB is empty, push localStorage → DB.
 * Sets a flag so this only runs once per browser. Returns true if a migration ran.
 */
export async function migrateLocalStorageIfNeeded(current: TrackerState): Promise<boolean> {
  const legacy = readLegacy();
  if (!legacy) return false;
  const dbEmpty =
    current.topics.length === 0 &&
    current.subtopics.length === 0 &&
    current.entries.length === 0;
  if (!dbEmpty) {
    markMigrated();
    return false;
  }
  if (legacy.topics.length === 0 && legacy.entries.length === 0) {
    markMigrated();
    return false;
  }
  await importState(legacy, "merge");
  markMigrated();
  return true;
}

export type { Topic, Subtopic, Entry, TrackerState };
export { EMPTY };
