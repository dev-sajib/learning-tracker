"use client";

import type { TrackerState, Topic, Subtopic, Entry } from "./types";

const KEY = "devtrack:v1";

const EMPTY: TrackerState = {
  topics: [],
  subtopics: [],
  entries: [],
  version: 1,
};

export const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36));

export function loadState(): TrackerState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as TrackerState;
    return {
      topics: parsed.topics ?? [],
      subtopics: parsed.subtopics ?? [],
      entries: parsed.entries ?? [],
      version: parsed.version ?? 1,
    };
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
    const parsed = JSON.parse(json) as TrackerState;
    if (!parsed || !Array.isArray(parsed.topics)) return false;
    saveState(parsed);
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
