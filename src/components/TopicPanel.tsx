"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FolderPlus, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import type { Topic, Subtopic, Entry } from "@/lib/types";

interface Props {
  topics: Topic[];
  subtopics: Subtopic[];
  entries: Entry[];
  onAddTopic: (name: string) => void;
  onAddSubtopic: (topicId: string, name: string) => void;
  onDeleteTopic: (topicId: string) => void;
  onDeleteSubtopic: (subtopicId: string) => void;
}

const TOPIC_COLORS = [
  "#34d399", "#22d3ee", "#a78bfa", "#fbbf24",
  "#f472b6", "#60a5fa", "#fb7185", "#84cc16",
];

export default function TopicPanel({
  topics, subtopics, entries,
  onAddTopic, onAddSubtopic, onDeleteTopic, onDeleteSubtopic,
}: Props) {
  const [topicName, setTopicName] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [subName, setSubName] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const submitTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const v = topicName.trim();
    if (!v) return;
    onAddTopic(v);
    setTopicName("");
  };

  const submitSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTopic) return;
    const v = subName.trim();
    if (!v) return;
    onAddSubtopic(activeTopic, v);
    setSubName("");
  };

  const countFor = (topicId: string, subtopicId?: string) =>
    entries.filter((e) => e.topicId === topicId && (subtopicId ? e.subtopicId === subtopicId : true)).length;

  return (
    <section className="surface p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <span className="text-emerald-400">{">"}</span> topics &amp; subtopics
        </h2>
        <span className="chip">{topics.length} topics · {subtopics.length} subs</span>
      </div>

      <form onSubmit={submitTopic} className="flex gap-2">
        <input
          className="input"
          placeholder="new topic (e.g. JS, Python, System Design)"
          value={topicName}
          onChange={(e) => setTopicName(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">
          <FolderPlus size={14} /> add
        </button>
      </form>

      <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
        {topics.length === 0 && (
          <div className="text-xs text-zinc-500 italic px-2 py-6 text-center">
            no topics yet. add your first topic above ↑
          </div>
        )}
        {topics.map((t) => {
          const subs = subtopics.filter((s) => s.topicId === t.id);
          const isOpen = expanded[t.id] ?? true;
          const total = countFor(t.id);
          return (
            <div key={t.id} className="surface-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  className="flex items-center gap-2 text-left flex-1 min-w-0"
                  onClick={() => setExpanded((x) => ({ ...x, [t.id]: !isOpen }))}
                >
                  {isOpen ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: t.color, boxShadow: `0 0 10px ${t.color}80` }}
                  />
                  <span className="font-medium truncate">{t.name}</span>
                  <span className="chip ml-1">{subs.length}</span>
                  <span className="text-[11px] text-zinc-500 ml-auto tabular-nums">
                    {total} {total === 1 ? "entry" : "entries"}
                  </span>
                </button>
                <button
                  className="text-zinc-600 hover:text-red-400 transition-colors"
                  onClick={() => {
                    if (confirm(`Delete topic "${t.name}" and all its data?`)) onDeleteTopic(t.id);
                  }}
                  title="delete topic"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 ml-5 flex flex-col gap-1.5">
                      {subs.map((s) => {
                        const sc = countFor(t.id, s.id);
                        return (
                          <div
                            key={s.id}
                            className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md hover:bg-white/3 group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-zinc-600">└</span>
                              <span className="text-zinc-300 truncate">{s.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-500 tabular-nums">{sc}×</span>
                              <button
                                className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-opacity"
                                onClick={() => onDeleteSubtopic(s.id)}
                                title="delete subtopic"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {activeTopic === t.id ? (
                        <form onSubmit={submitSub} className="flex gap-2 mt-2">
                          <input
                            autoFocus
                            className="input text-xs py-1.5"
                            placeholder="subtopic name (e.g. Closure)"
                            value={subName}
                            onChange={(e) => setSubName(e.target.value)}
                            onBlur={() => {
                              if (!subName.trim()) setActiveTopic(null);
                            }}
                          />
                          <button className="btn btn-primary text-xs" type="submit">add</button>
                        </form>
                      ) : (
                        <button
                          onClick={() => setActiveTopic(t.id)}
                          className="text-[11px] text-emerald-400/80 hover:text-emerald-300 mt-1 inline-flex items-center gap-1 self-start"
                        >
                          <Plus size={11} /> add subtopic
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export { TOPIC_COLORS };
