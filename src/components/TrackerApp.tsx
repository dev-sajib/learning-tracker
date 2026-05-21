"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import Header from "./Header";
import Stats from "./Stats";
import TopicPanel, { TOPIC_COLORS } from "./TopicPanel";
import LogPanel from "./LogPanel";
import Heatmap from "./Heatmap";
import Charts from "./Charts";
import ActivityFeed from "./ActivityFeed";
import QuickAdd from "./QuickAdd";
import {
  EMPTY,
  fetchState,
  createTopic,
  deleteTopic as apiDeleteTopic,
  createSubtopic,
  deleteSubtopic as apiDeleteSubtopic,
  createEntry,
  deleteEntry as apiDeleteEntry,
  importState as apiImportState,
  resetAll as apiResetAll,
  exportJSON,
  migrateLocalStorageIfNeeded,
} from "@/lib/storage";
import type { TrackerState, Topic, Subtopic, Entry } from "@/lib/types";
import { today, ymd, subDays, parseISO } from "@/lib/date";

export default function TrackerApp() {
  const [state, setState] = useState<TrackerState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [quickAddCtl, setQuickAddCtl] = useState<{ tab: "topic" | "sub" | "log"; topicId?: string; ts: number } | null>(null);

  const flashToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const reload = useCallback(async () => {
    const fresh = await fetchState();
    setState(fresh);
    return fresh;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await fetchState();
        if (cancelled) return;
        const migrated = await migrateLocalStorageIfNeeded(fresh);
        if (cancelled) return;
        if (migrated) {
          const after = await fetchState();
          if (cancelled) return;
          setState(after);
          flashToast("local data imported to db ✓");
        } else {
          setState(fresh);
        }
      } catch (e) {
        console.error("load failed", e);
        flashToast("failed to load from db");
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [flashToast]);

  // ---- mutations (optimistic with rollback) ----

  const addTopic = useCallback(
    async (name: string) => {
      const color = TOPIC_COLORS[state.topics.length % TOPIC_COLORS.length];
      const tempId = `tmp-${Math.random().toString(36).slice(2)}`;
      const optimistic: Topic = { id: tempId, name, color, createdAt: new Date().toISOString() };
      setState((s) => ({ ...s, topics: [...s.topics, optimistic] }));
      try {
        const real = await createTopic(name, color);
        setState((s) => ({
          ...s,
          topics: s.topics.map((t) => (t.id === tempId ? real : t)),
        }));
        flashToast(`+ topic: ${name}`);
      } catch (e) {
        console.error(e);
        setState((s) => ({ ...s, topics: s.topics.filter((t) => t.id !== tempId) }));
        flashToast("failed to add topic");
      }
    },
    [state.topics.length, flashToast]
  );

  const addSubtopic = useCallback(
    async (topicId: string, name: string) => {
      const tempId = `tmp-${Math.random().toString(36).slice(2)}`;
      const optimistic: Subtopic = { id: tempId, topicId, name, createdAt: new Date().toISOString() };
      setState((s) => ({ ...s, subtopics: [...s.subtopics, optimistic] }));
      try {
        const real = await createSubtopic(topicId, name);
        setState((s) => ({
          ...s,
          subtopics: s.subtopics.map((sb) => (sb.id === tempId ? real : sb)),
        }));
        flashToast(`+ subtopic: ${name}`);
      } catch (e) {
        console.error(e);
        setState((s) => ({ ...s, subtopics: s.subtopics.filter((sb) => sb.id !== tempId) }));
        flashToast("failed to add subtopic");
      }
    },
    [flashToast]
  );

  const deleteTopic = useCallback(
    async (topicId: string) => {
      const snapshot = state;
      setState((s) => ({
        ...s,
        topics: s.topics.filter((t) => t.id !== topicId),
        subtopics: s.subtopics.filter((sb) => sb.topicId !== topicId),
        entries: s.entries.filter((e) => e.topicId !== topicId),
      }));
      try {
        await apiDeleteTopic(topicId);
      } catch (e) {
        console.error(e);
        setState(snapshot);
        flashToast("failed to delete topic");
      }
    },
    [state, flashToast]
  );

  const deleteSubtopic = useCallback(
    async (subtopicId: string) => {
      const snapshot = state;
      setState((s) => ({
        ...s,
        subtopics: s.subtopics.filter((sb) => sb.id !== subtopicId),
        entries: s.entries.map((e) =>
          e.subtopicId === subtopicId ? { ...e, subtopicId: undefined } : e
        ),
      }));
      try {
        await apiDeleteSubtopic(subtopicId);
      } catch (e) {
        console.error(e);
        setState(snapshot);
        flashToast("failed to delete subtopic");
      }
    },
    [state, flashToast]
  );

  const logEntry = useCallback(
    async (data: { topicId: string; subtopicId?: string; summary: string }) => {
      const tempId = `tmp-${Math.random().toString(36).slice(2)}`;
      const optimistic: Entry = {
        id: tempId,
        topicId: data.topicId,
        subtopicId: data.subtopicId,
        date: today(),
        summary: data.summary,
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, entries: [optimistic, ...s.entries] }));
      try {
        const real = await createEntry({
          topicId: data.topicId,
          subtopicId: data.subtopicId,
          summary: data.summary,
        });
        setState((s) => ({
          ...s,
          entries: s.entries.map((e) => (e.id === tempId ? real : e)),
        }));
        flashToast(`✓ logged: ${data.summary.slice(0, 40)}${data.summary.length > 40 ? "…" : ""}`);
      } catch (e) {
        console.error(e);
        setState((s) => ({ ...s, entries: s.entries.filter((en) => en.id !== tempId) }));
        flashToast("failed to log entry");
      }
    },
    [flashToast]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const snapshot = state;
      setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));
      try {
        await apiDeleteEntry(id);
      } catch (e) {
        console.error(e);
        setState(snapshot);
        flashToast("failed to delete entry");
      }
    },
    [state, flashToast]
  );

  // ---- derived ----
  const todayKey = today();

  const streak = useMemo(() => {
    if (state.entries.length === 0) return 0;
    const days = new Set(state.entries.map((e) => e.date));
    let n = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    if (!days.has(ymd(cursor))) {
      cursor = subDays(cursor, 1);
    }
    while (days.has(ymd(cursor))) {
      n++;
      cursor = subDays(cursor, 1);
    }
    return n;
  }, [state.entries]);

  const longestStreak = useMemo(() => {
    if (state.entries.length === 0) return 0;
    const days = Array.from(new Set(state.entries.map((e) => e.date))).sort();
    let longest = 1;
    let cur = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = parseISO(days[i - 1]);
      const now = parseISO(days[i]);
      const diff = Math.round((now.getTime() - prev.getTime()) / 86400000);
      if (diff === 1) { cur++; longest = Math.max(longest, cur); }
      else cur = 1;
    }
    return longest;
  }, [state.entries]);

  const todayEntries = useMemo(
    () => state.entries.filter((e) => e.date === todayKey).length,
    [state.entries, todayKey]
  );

  const weekEntries = useMemo(() => {
    const start = ymd(subDays(new Date(), 6));
    return state.entries.filter((e) => e.date >= start && e.date <= todayKey).length;
  }, [state.entries, todayKey]);

  const monthEntries = useMemo(() => {
    const m = todayKey.slice(0, 7);
    return state.entries.filter((e) => e.date.startsWith(m)).length;
  }, [state.entries, todayKey]);

  // ---- import/export/reset ----
  const handleExport = () => {
    const json = exportJSON(state);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devtrack-${todayKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flashToast("exported.");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      try {
        const text = await f.text();
        const parsed = JSON.parse(text) as TrackerState;
        if (!Array.isArray(parsed.topics)) throw new Error("invalid file");
        await apiImportState(parsed, "merge");
        await reload();
        flashToast("imported ✓");
      } catch (e) {
        console.error(e);
        flashToast("import failed.");
      }
    };
    input.click();
  };

  const handleReset = async () => {
    if (!confirm("Wipe ALL data in the database? This cannot be undone.")) return;
    try {
      await apiResetAll();
      setState(EMPTY);
      flashToast("reset complete.");
    } catch (e) {
      console.error(e);
      flashToast("reset failed.");
    }
  };

  const seedDemo = async () => {
    const now = new Date().toISOString();
    const seed: TrackerState = {
      topics: [
        { id: crypto.randomUUID(), name: "JavaScript", color: "#fbbf24", createdAt: now },
        { id: crypto.randomUUID(), name: "Python", color: "#22d3ee", createdAt: now },
        { id: crypto.randomUUID(), name: "System Design", color: "#a78bfa", createdAt: now },
      ],
      subtopics: [],
      entries: [],
      version: 2,
    };
    const subNames: Record<string, string[]> = {
      JavaScript: ["Closures", "Promises", "Event Loop"],
      Python: ["Decorators"],
      "System Design": ["Caching"],
    };
    for (const t of seed.topics) {
      for (const n of subNames[t.name] || []) {
        seed.subtopics.push({ id: crypto.randomUUID(), topicId: t.id, name: n, createdAt: now });
      }
    }
    try {
      await apiImportState(seed, "merge");
      await reload();
      flashToast("starter topics added ✓");
    } catch (e) {
      console.error(e);
      flashToast("seed failed.");
    }
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500 text-sm">
        loading devtrack<span className="cursor" />
      </div>
    );
  }

  const isEmpty = state.topics.length === 0 && state.entries.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4">
      <Header
        streak={streak}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
      />

      <Stats
        topics={state.topics.length}
        subtopics={state.subtopics.length}
        totalEntries={state.entries.length}
        todayEntries={todayEntries}
        weekEntries={weekEntries}
        monthEntries={monthEntries}
        streak={streak}
        longestStreak={longestStreak}
      />

      {isEmpty && (
        <div className="surface p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 text-xl">{">"}</span>
            <div>
              <div className="text-sm font-semibold">
                welcome, dev <span className="cursor" />
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                add a topic (e.g. <code className="text-emerald-300">JS</code>) and a subtopic
                (e.g. <code className="text-cyan-300">Closure</code>). then write <em>what you
                learned</em>. your growth curve starts now.
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={seedDemo}>
            <Sparkles size={14} /> seed starter topics
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TopicPanel
          topics={state.topics}
          subtopics={state.subtopics}
          entries={state.entries}
          onAddTopic={addTopic}
          onAddSubtopic={addSubtopic}
          onDeleteTopic={deleteTopic}
          onDeleteSubtopic={deleteSubtopic}
          onOpenQuickSub={(topicId) =>
            setQuickAddCtl({ tab: "sub", topicId, ts: Date.now() })
          }
        />
        <LogPanel
          topics={state.topics}
          subtopics={state.subtopics}
          onLog={logEntry}
        />
        <ActivityFeed
          topics={state.topics}
          subtopics={state.subtopics}
          entries={state.entries}
          onDelete={deleteEntry}
        />
      </div>

      <Heatmap entries={state.entries} />

      <Charts topics={state.topics} subtopics={state.subtopics} entries={state.entries} />

      <QuickAdd
        topics={state.topics}
        subtopics={state.subtopics}
        onAddTopic={addTopic}
        onAddSubtopic={addSubtopic}
        onLog={logEntry}
        controller={quickAddCtl}
      />

      <footer className="text-[11px] text-zinc-600 text-center py-4">
        <span className="text-emerald-500">$</span> devtrack — synced to db ·
        export often · keep shipping<span className="cursor" />
      </footer>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 right-6 chip glow text-emerald-300 backdrop-blur-md bg-black/60 px-4 py-2 text-xs max-w-[80vw] truncate"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
