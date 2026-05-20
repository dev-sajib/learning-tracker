"use client";

import { motion } from "framer-motion";
import { BookOpen, Layers, NotebookPen, CalendarDays, Trophy, Flame } from "lucide-react";
import type { ReactNode } from "react";

interface StatProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ReactNode;
  accent?: "emerald" | "cyan" | "violet" | "amber";
}

function StatCard({ label, value, hint, icon, accent = "emerald" }: StatProps) {
  const ring = {
    emerald: "before:bg-emerald-400/40",
    cyan: "before:bg-cyan-400/40",
    violet: "before:bg-violet-400/40",
    amber: "before:bg-amber-400/40",
  }[accent];

  const textColor = {
    emerald: "text-emerald-300",
    cyan: "text-cyan-300",
    violet: "text-violet-300",
    amber: "text-amber-300",
  }[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`surface relative overflow-hidden p-4 before:content-[''] before:absolute before:-top-10 before:-right-10 before:w-32 before:h-32 before:rounded-full before:blur-3xl ${ring}`}
    >
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span className="uppercase tracking-wider">{label}</span>
        <span className={textColor}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-zinc-500">{hint}</div>}
    </motion.div>
  );
}

interface Props {
  topics: number;
  subtopics: number;
  totalEntries: number;
  todayEntries: number;
  weekEntries: number;
  monthEntries: number;
  streak: number;
  longestStreak: number;
}

export default function Stats({
  topics, subtopics, totalEntries, todayEntries, weekEntries, monthEntries, streak, longestStreak,
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard label="Topics" value={topics} hint={`${subtopics} subtopics`} icon={<BookOpen size={16} />} accent="emerald" />
      <StatCard label="Learned" value={totalEntries} hint="total entries logged" icon={<NotebookPen size={16} />} accent="cyan" />
      <StatCard label="Today" value={todayEntries} hint={todayEntries === 0 ? "nothing logged yet" : "entries today"} icon={<Layers size={16} />} accent="violet" />
      <StatCard label="This week" value={weekEntries} hint="entries (7d)" icon={<CalendarDays size={16} />} accent="cyan" />
      <StatCard label="This month" value={monthEntries} hint="entries (MTD)" icon={<CalendarDays size={16} />} accent="emerald" />
      <StatCard
        label="Streak"
        value={<span className="inline-flex items-center gap-1">{streak}<Flame className="text-amber-400" size={18} /></span>}
        hint={`best: ${longestStreak}${longestStreak > 0 && longestStreak === streak ? " · personal best!" : ""}`}
        icon={<Trophy size={16} />}
        accent="amber"
      />
    </div>
  );
}
