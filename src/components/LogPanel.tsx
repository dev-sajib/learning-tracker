"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, Clock } from "lucide-react";
import type { Topic, Subtopic } from "@/lib/types";

interface Props {
  topics: Topic[];
  subtopics: Subtopic[];
  onLog: (data: { topicId: string; subtopicId?: string; minutes: number; notes?: string }) => void;
}

export default function LogPanel({ topics, subtopics, onLog }: Props) {
  const [topicId, setTopicId] = useState<string>("");
  const [subtopicId, setSubtopicId] = useState<string>("");
  const [minutes, setMinutes] = useState<string>("30");
  const [notes, setNotes] = useState<string>("");
  const [flash, setFlash] = useState(false);

  const subs = useMemo(
    () => subtopics.filter((s) => s.topicId === topicId),
    [subtopics, topicId]
  );

  const quick = [15, 30, 45, 60, 90];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseInt(minutes, 10);
    if (!topicId || !m || m <= 0) return;
    onLog({
      topicId,
      subtopicId: subtopicId || undefined,
      minutes: m,
      notes: notes.trim() || undefined,
    });
    setNotes("");
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  };

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
          <Zap size={11} /> ship it
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

        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Minutes</span>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              className="input w-28 tabular-nums"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              required
            />
            <div className="flex gap-1.5 flex-wrap">
              {quick.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setMinutes(String(q))}
                  className={`chip hover:border-emerald-400/60 transition-colors ${minutes === String(q) ? "glow text-emerald-300" : ""}`}
                >
                  <Clock size={10} /> {q}m
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Notes (optional)</span>
          <textarea
            className="input min-h-[64px] resize-y"
            placeholder="// today I learned about closures — lexical scoping & captured vars..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <button
          type="submit"
          className="btn btn-primary justify-center"
          disabled={!topicId || !minutes}
        >
          <Zap size={14} /> commit learning
        </button>
      </form>
    </section>
  );
}
