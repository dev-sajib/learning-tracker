"use client";

import type { TrackerState, Topic, Subtopic, Entry } from "./types";

const KEY = "devtrack:v1";

const EMPTY: TrackerState = {
  topics: [],
  subtopics: [],
  entries: [],
  version: 2,
};

export const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36));

// migrate legacy entries: { minutes, notes } -> { summary }
function migrate(raw: unknown): TrackerState {
  type LegacyEntry = Partial<Entry> & { minutes?: number; notes?: string };
  const s = raw as Partial<TrackerState> & { entries?: LegacyEntry[] };
  return {
    topics: s.topics ?? [],
    subtopics: s.subtopics ?? [],
    entries: (s.entries ?? []).map((e: LegacyEntry) => ({
      id: e.id ?? uid(),
      topicId: e.topicId!,
      subtopicId: e.subtopicId,
      date: e.date!,
      summary: e.summary ?? e.notes ?? "(no summary)",
      createdAt: e.createdAt ?? new Date().toISOString(),
    })),
    version: 2,
  };
}

export function loadState(): TrackerState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    return migrate(JSON.parse(raw));
  } catch {
    return EMPTY;
  }
}

export function saveState(state: TrackerState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

export function exportState(): string {
  return JSON.stringify(loadState(), null, 2);
}

export function importState(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.topics)) return false;
    saveState(migrate(parsed));
    return true;
  } catch {
    return false;
  }
}

export function clearAll() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export type { Topic, Subtopic, Entry, TrackerState };
