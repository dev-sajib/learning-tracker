"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, FolderPlus, Layers, BookCheck, Sparkles, Command,
} from "lucide-react";
import type { Topic, Subtopic } from "@/lib/types";

type Tab = "topic" | "sub" | "log";

interface Props {
  topics: Topic[];
  subtopics: Subtopic[];
  onAddTopic: (name: string) => void;
  onAddSubtopic: (topicId: string, name: string) => void;
  onLog: (data: { topicId: string; subtopicId?: string; summary: string }) => void;
  /** force-open with a preselected tab + topic (e.g. from "+ subtopic" inline button) */
  controller?: { tab: Tab; topicId?: string; ts: number } | null;
}

export default function QuickAdd({
  topics, subtopics, onAddTopic, onAddSubtopic, onLog, controller,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("topic");

  // forms
  const [topicName, setTopicName] = useState("");
  const [subTopicId, setSubTopicId] = useState("");
  const [subName, setSubName] = useState("");
  const [logTopicId, setLogTopicId] = useState("");
  const [logSubId, setLogSubId] = useState("");
  const [logSummary, setLogSummary] = useState("");

  const firstFieldRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>(null);

  // open via external controller
  useEffect(() => {
    if (!controller) return;
    setTab(controller.tab);
    if (controller.tab === "sub" && controller.topicId) setSubTopicId(controller.topicId);
    if (controller.tab === "log" && controller.topicId) setLogTopicId(controller.topicId);
    setOpen(true);
  }, [controller]);

  // keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const inField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (meta && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (!open && !inField) {
        if (e.key === "t") { e.preventDefault(); setTab("topic"); setOpen(true); }
        else if (e.key === "s") { e.preventDefault(); setTab("sub"); setOpen(true); }
        else if (e.key === "l") { e.preventDefault(); setTab("log"); setOpen(true); }
      }
      if (open && e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // autofocus on open / tab change
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => firstFieldRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [open, tab]);

  // reset closeable forms
  useEffect(() => {
    if (!open) return;
    // soft-reset summary so users don't accidentally re-submit
    setLogSummary("");
  }, [open]);

  const subsForLog = useMemo(
    () => subtopics.filter((s) => s.topicId === logTopicId),
    [subtopics, logTopicId]
  );

  const submitTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const v = topicName.trim();
    if (!v) return;
    onAddTopic(v);
    setTopicName("");
    setOpen(false);
  };
  const submitSub = (e: React.FormEvent) => {
    e.preventDefault();
    const v = subName.trim();
    if (!subTopicId || !v) return;
    onAddSubtopic(subTopicId, v);
    setSubName("");
    setOpen(false);
  };
  const submitLog = (e: React.FormEvent) => {
    e.preventDefault();
    const v = logSummary.trim();
    if (!logTopicId || !v) return;
    onLog({ topicId: logTopicId, subtopicId: logSubId || undefined, summary: v });
    setLogSummary("");
    setOpen(false);
  };

  const TabBtn = ({ id, icon, label, kbd }: { id: Tab; icon: React.ReactNode; label: string; kbd: string }) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`flex-1 flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl border transition-all
        ${tab === id
          ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300 glow"
          : "border-[var(--border-2)] bg-[var(--card-2)] text-zinc-400 hover:border-[var(--border-2)] hover:text-zinc-200"}`}
    >
      <span className={tab === id ? "text-emerald-300" : "text-zinc-500"}>{icon}</span>
      <span className="text-xs font-medium">{label}</span>
      <span className="text-[9px] text-zinc-600 uppercase tracking-wider">key · {kbd}</span>
    </button>
  );

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 z-40 group flex items-center gap-2"
        aria-label="Quick add (Cmd+N)"
        title="Quick add — Cmd/Ctrl + N"
      >
        <span className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-emerald-400/30 text-emerald-300 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">
          <Command size={10} /> N · quick add
        </span>
        <span className="relative inline-flex items-center justify-center w-14 h-14 rounded-full text-white shadow-2xl"
          style={{
            background: "linear-gradient(135deg, #34d399 0%, #22d3ee 50%, #a78bfa 100%)",
            boxShadow: "0 10px 30px -8px rgba(52,211,153,0.55), 0 0 0 1px rgba(255,255,255,0.08) inset",
          }}
        >
          <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/30" />
          <Plus size={26} strokeWidth={2.5} className="relative" />
        </span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-3 md:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="surface relative w-full max-w-xl p-5 z-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="text-emerald-400" size={14} />
                  <span className="grad-text">quick add</span>
                  <span className="text-zinc-500 text-xs font-normal">
                    · <kbd className="px-1.5 py-0.5 rounded border border-[var(--border-2)] bg-[var(--card-2)] text-[10px]">Cmd</kbd>
                    <span className="text-zinc-600"> + </span>
                    <kbd className="px-1.5 py-0.5 rounded border border-[var(--border-2)] bg-[var(--card-2)] text-[10px]">N</kbd>
                  </span>
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="text-zinc-500 hover:text-zinc-200 transition-colors p-1"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <TabBtn id="topic" icon={<FolderPlus size={20} />} label="New topic" kbd="T" />
                <TabBtn id="sub" icon={<Layers size={20} />} label="New subtopic" kbd="S" />
                <TabBtn id="log" icon={<BookCheck size={20} />} label="Log learning" kbd="L" />
              </div>

              {tab === "topic" && (
                <form onSubmit={submitTopic} className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Topic name</span>
                    <input
                      ref={(el) => { firstFieldRef.current = el; }}
                      className="input"
                      placeholder="e.g. JavaScript, Python, System Design"
                      value={topicName}
                      onChange={(e) => setTopicName(e.target.value)}
                    />
                  </label>
                  <button className="btn btn-primary justify-center" type="submit" disabled={!topicName.trim()}>
                    <FolderPlus size={14} /> add topic
                  </button>
                </form>
              )}

              {tab === "sub" && (
                <form onSubmit={submitSub} className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Parent topic</span>
                    <select
                      ref={(el) => { firstFieldRef.current = el; }}
                      className="input"
                      value={subTopicId}
                      onChange={(e) => setSubTopicId(e.target.value)}
                      required
                    >
                      <option value="">— pick topic —</option>
                      {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Subtopic name</span>
                    <input
                      className="input"
                      placeholder="e.g. Closure, async/await, Promise chaining"
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                    />
                  </label>
                  <button className="btn btn-primary justify-center" type="submit" disabled={!subTopicId || !subName.trim()}>
                    <Layers size={14} /> add subtopic
                  </button>
                  {topics.length === 0 && (
                    <p className="text-[11px] text-amber-300/80 text-center">add a topic first ↑</p>
                  )}
                </form>
              )}

              {tab === "log" && (
                <form onSubmit={submitLog} className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Topic</span>
                      <select
                        ref={(el) => { firstFieldRef.current = el; }}
                        className="input"
                        value={logTopicId}
                        onChange={(e) => { setLogTopicId(e.target.value); setLogSubId(""); }}
                        required
                      >
                        <option value="">— pick topic —</option>
                        {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Subtopic (optional)</span>
                      <select
                        className="input"
                        value={logSubId}
                        onChange={(e) => setLogSubId(e.target.value)}
                        disabled={!logTopicId}
                      >
                        <option value="">— none —</option>
                        {subsForLog.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </label>
                  </div>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider">What did you learn?</span>
                    <textarea
                      className="input min-h-[110px] resize-y"
                      placeholder="// closures = function + its captured scope. used for data privacy + currying"
                      value={logSummary}
                      onChange={(e) => setLogSummary(e.target.value)}
                      required
                    />
                  </label>
                  <button className="btn btn-primary justify-center" type="submit" disabled={!logTopicId || !logSummary.trim()}>
                    <BookCheck size={14} /> commit learning
                  </button>
                  {topics.length === 0 && (
                    <p className="text-[11px] text-amber-300/80 text-center">add a topic first ↑</p>
                  )}
                </form>
              )}

              <div className="mt-4 pt-3 border-t border-[var(--border)] text-[10px] text-zinc-500 flex items-center justify-between">
                <span>shortcuts: <kbd className="px-1 rounded border border-[var(--border-2)]">T</kbd> topic · <kbd className="px-1 rounded border border-[var(--border-2)]">S</kbd> sub · <kbd className="px-1 rounded border border-[var(--border-2)]">L</kbd> log</span>
                <span><kbd className="px-1 rounded border border-[var(--border-2)]">Esc</kbd> close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
