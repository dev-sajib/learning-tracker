"use client";

import { useEffect, useState } from "react";
import { prettyDate, prettyTime } from "@/lib/date";
import { Flame, Download, Upload, RotateCcw } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface Props {
  streak: number;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
}

export default function Header({ streak, onExport, onImport, onReset }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="surface px-5 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 text-sm">$</span>
          <h1 className="text-lg font-semibold">
            <span className="grad-text">devtrack</span>
            <span className="cursor" />
          </h1>
          <span className="chip glow text-emerald-300">v1.0 · localStorage</span>
        </div>
        <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>{now ? prettyDate(now) : "—"}</span>
          <span className="text-zinc-600">·</span>
          <span className="text-emerald-300 tabular-nums">{now ? prettyTime(now) : "--:--:--"}</span>
          <span className="text-zinc-600">·</span>
          <span className="inline-flex items-center gap-1 text-amber-300">
            <Flame size={12} /> {streak}-day streak
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <ThemeToggle />
        <button className="btn" onClick={onExport} title="Export JSON">
          <Download size={14} /> export
        </button>
        <button className="btn" onClick={onImport} title="Import JSON">
          <Upload size={14} /> import
        </button>
        <button className="btn" onClick={onReset} title="Clear all data">
          <RotateCcw size={14} /> reset
        </button>
      </div>
    </header>
  );
}
