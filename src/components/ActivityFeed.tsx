"use client";

import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import { format, parseISO, today } from "@/lib/date";
import type { Topic, Subtopic, Entry } from "@/lib/types";

interface Props {
  topics: Topic[];
  subtopics: Subtopic[];
  entries: Entry[];
  onDelete: (id: string) => void;
}

export default function ActivityFeed({ topics, subtopics, entries, onDelete }: Props) {
  const todayKey = today();

  const grouped = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const byDate: Record<string, Entry[]> = {};
    for (const e of sorted) (byDate[e.date] ??= []).push(e);
    return Object.entries(byDate).slice(0, 14); // last 14 days with entries
  }, [entries]);

  const tname = (id: string) => topics.find((t) => t.id === id);
  const sname = (id?: string) => (id ? subtopics.find((s) => s.id === id)?.name : undefined);

  const totalToday = entries
    .filter((e) => e.date === todayKey)
    .reduce((a, e) => a + e.minutes, 0);

  return (
    <section className="surface p-5 flex flex-col gap-3 max-h-[640px]">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <span className="text-emerald-400">{">"}</span> activity log
        </h2>
        <span className="chip glow text-emerald-300 tabular-nums">today: {totalToday}m</span>
      </div>

      <div className="overflow-y-auto pr-1 flex flex-col gap-4">
        {grouped.length === 0 && (
          <div className="text-xs text-zinc-500 italic text-center py-12">
            no entries yet. log your first learning above ↑
          </div>
        )}
        {grouped.map(([date, list]) => {
          const d = parseISO(date);
          const label =
            date === todayKey
              ? "Today"
              : format(d, "EEE, MMM d");
          const total = list.reduce((a, e) => a + e.minutes, 0);
          return (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] text-zinc-500 tabular-nums">{total}m</span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {list.map((e) => {
                  const t = tname(e.topicId);
                  const sn = sname(e.subtopicId);
                  return (
                    <li
                      key={e.id}
                      className="surface-2 px-3 py-2 text-xs flex flex-col gap-1 group"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: t?.color ?? "#666", boxShadow: `0 0 8px ${t?.color ?? "#666"}80` }}
                        />
                        <span className="font-medium text-zinc-200">{t?.name ?? "—"}</span>
                        {sn && (
                          <>
                            <span className="text-zinc-600">/</span>
                            <span className="text-cyan-300">{sn}</span>
                          </>
                        )}
                        <span className="text-zinc-500 tabular-nums ml-auto">{e.minutes}m</span>
                        <button
                          onClick={() => onDelete(e.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-opacity"
                          title="delete entry"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      {e.notes && (
                        <div className="text-zinc-400 pl-4 whitespace-pre-wrap break-words">
                          <span className="text-zinc-600">//</span> {e.notes}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
