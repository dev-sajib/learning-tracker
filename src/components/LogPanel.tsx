"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, BookCheck } from "lucide-react";
import type { Topic, Subtopic } from "@/lib/types";

interface Props {
  topics: Topic[];
  subtopics: Subtopic[];
  onLog: (data: { topicId: string; subtopicId?: string; summary: string }) => void;
}

export default function LogPanel({ topics, subtopics, onLog }: Props) {
  const [topicId, setTopicId] = useState<string>("");
  const [subtopicId, setSubtopicId] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [flash, setFlash] = useState(false);

  const subs = useMemo(
    () => subtopics.filter((s) => s.topicId === topicId),
    [subtopics, topicId]
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = summary.trim();
    if (!topicId || !v) return;
    onLog({ topicId, subtopicId: subtopicId || undefined, summary: v });
    setSummary("");
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  };

  const charCount = summary.length;

  return (
    <section className="surface p-5 flex flex-col gap-4 relative overflow-hidden">
      {flash && (
        <motion.div
          initial={{ opacity: 0.7, scale: 0.95 }}
          animate={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 pointer-events-none bg-emerald-400/10 z-10"
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <span className="text-emerald-400">{">"}</span> log learning · today
        </h2>
        <span className="chip glow-cyan text-cyan-300">
          <BookCheck size={11} /> what I learned
        </span>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Topic</span>
            <select
              className="input"
              value={topicId}
              onChange={(e) => { setTopicId(e.target.value); setSubtopicId(""); }}
              required
            >
              <option value="">— pick topic —</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Subtopic (optional)</span>
            <select
              className="input"
              value={subtopicId}
              onChange={(e) => setSubtopicId(e.target.value)}
              disabled={!topicId}
            >
              <option value="">— none —</option>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider">
              What did you learn?
            </span>
            <span className="text-[10px] text-zinc-600 tabular-nums">{charCount}</span>
          </div>
          <textarea
            className="input min-h-[120px] resize-y"
            placeholder={`// e.g.\n// closures = function + its lexical environment\n// each call captures the outer scope, used for data privacy + currying`}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          className="btn btn-primary justify-center"
          disabled={!topicId || !summary.trim()}
        >
          <Zap size={14} /> commit learning
        </button>
      </form>
    </section>
  );
}
