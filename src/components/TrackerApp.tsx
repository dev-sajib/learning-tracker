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
  loadState, saveState, uid, exportState, importState, clearAll,
} from "@/lib/storage";
import type { TrackerState, Topic, Subtopic, Entry } from "@/lib/types";
import { today, ymd, subDays, parseISO } from "@/lib/date";

const EMPTY: TrackerState = { topics: [], subtopics: [], entries: [], version: 2 };

export default function TrackerApp() {
  const [state, setState] = useState<TrackerState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [quickAddCtl, setQuickAddCtl] = useState<{ tab: "topic" | "sub" | "log"; topicId?: string; ts: number } | null>(null);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const flashToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  // ---- mutations ----
  const addTopic = useCallback((name: string) => {
    setState((s) => {
      const color = TOPIC_COLORS[s.topics.length % TOPIC_COLORS.length];
      const t: Topic = { id: uid(), name, color, createdAt: new Date().toISOString() };
      return { ...s, topics: [...s.topics, t] };
    });
    flashToast(`+ topic: ${name}`);
  }, []);

  const addSubtopic = useCallback((topicId: string, name: string) => {
    setState((s) => {
      const sub: Subtopic = { id: uid(), topicId, name, createdAt: new Date().toISOString() };
      return { ...s, subtopics: [...s.subtopics, sub] };
    });
    flashToast(`+ subtopic: ${name}`);
  }, []);

  const deleteTopic = useCallback((topicId: string) => {
    setState((s) => ({
      ...s,
      topics: s.topics.filter((t) => t.id !== topicId),
      subtopics: s.subtopics.filter((sb) => sb.topicId !== topicId),
      entries: s.entries.filter((e) => e.topicId !== topicId),
    }));
  }, []);

  const deleteSubtopic = useCallback((subtopicId: string) => {
    setState((s) => ({
      ...s,
      subtopics: s.subtopics.filter((sb) => sb.id !== subtopicId),
      entries: s.entries.map((e) =>
        e.subtopicId === subtopicId ? { ...e, subtopicId: undefined } : e
      ),
    }));
  }, []);

  const logEntry = useCallback(
    (data: { topicId: string; subtopicId?: string; summary: string }) => {
      const entry: Entry = {
        id: uid(),
        topicId: data.topicId,
        subtopicId: data.subtopicId,
        date: today(),
        summary: data.summary,
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, entries: [entry, ...s.entries] }));
      flashToast(`✓ logged: ${data.summary.slice(0, 40)}${data.summary.length > 40 ? "…" : ""}`);
    },
    []
  );

  const deleteEntry = useCallback((id: string) => {
    setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));
  }, []);

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
    const json = exportState();
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
      const text = await f.text();
      if (importState(text)) {
        setState(loadState());
        flashToast("imported ✓");
      } else {
        flashToast("import failed.");
      }
    };
    input.click();
  };

  const handleReset = () => {
    if (!confirm("Wipe ALL local data? This cannot be undone.")) return;
    clearAll();
    setState(EMPTY);
    flashToast("reset complete.");
  };

  const seedDemo = () => {
    const now = new Date().toISOString();
    const js: Topic = { id: uid(), name: "JavaScript", color: "#fbbf24", createdAt: now };
    const py: Topic = { id: uid(), name: "Python", color: "#22d3ee", createdAt: now };
    const sd: Topic = { id: uid(), name: "System Design", color: "#a78bfa", createdAt: now };
    const subs: Subtopic[] = [
      { id: uid(), topicId: js.id, name: "Closures", createdAt: now },
      { id: uid(), topicId: js.id, name: "Promises", createdAt: now },
      { id: uid(), topicId: js.id, name: "Event Loop", createdAt: now },
      { id: uid(), topicId: py.id, name: "Decorators", createdAt: now },
      { id: uid(), topicId: sd.id, name: "Caching", createdAt: now },
    ];
    setState({ topics: [js, py, sd], subtopics: subs, entries: [], version: 2 });
    flashToast("starter topics added ✓");
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

      <Charts topics={state.topics} entries={state.entries} />

      <QuickAdd
        topics={state.topics}
        subtopics={state.subtopics}
        onAddTopic={addTopic}
        onAddSubtopic={addSubtopic}
        onLog={logEntry}
        controller={quickAddCtl}
      />

      <footer className="text-[11px] text-zinc-600 text-center py-4">
        <span className="text-emerald-500">$</span> devtrack — all data lives in your browser ·
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
