"use client";

import { useMemo } from "react";
import { ymd, subDays, format } from "@/lib/date";
import type { Entry } from "@/lib/types";

interface Props {
  entries: Entry[];
  weeks?: number;
}

export default function Heatmap({ entries, weeks = 18 }: Props) {
  const { grid, counts } = useMemo(() => {
    const days = weeks * 7;
    const counts: Record<string, number> = {};
    for (const e of entries) counts[e.date] = (counts[e.date] ?? 0) + 1;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = subDays(today, days - 1);

    const cells: { date: string; count: number; label: string }[] = [];
    for (let i = 0; i < days; i++) {
      const d = subDays(today, days - 1 - i);
      const key = ymd(d);
      cells.push({ date: key, count: counts[key] ?? 0, label: format(d, "EEE, MMM d") });
    }

    const grid: { date: string; count: number; label: string }[][] = [];
    const startDow = start.getDay();
    let col: ({ date: string; count: number; label: string } | null)[] = Array(startDow).fill(null);
    for (const c of cells) {
      col.push(c);
      if (col.length === 7) {
        grid.push(col as { date: string; count: number; label: string }[]);
        col = [];
      }
    }
    if (col.length > 0) {
      while (col.length < 7) col.push(null);
      grid.push(col as { date: string; count: number; label: string }[]);
    }
    return { grid, counts };
  }, [entries, weeks]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const activeDays = Object.values(counts).filter((n) => n > 0).length;

  const level = (n: number) => {
    if (n === 0) return 0;
    if (n === 1) return 1;
    if (n === 2) return 2;
    if (n <= 4) return 3;
    return 4;
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <section className="surface p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <span className="text-emerald-400">{">"}</span> growth heatmap
          <span className="chip ml-2">last {weeks} weeks</span>
        </h2>
        <div className="text-[11px] text-zinc-500">
          {activeDays} active days · {total} entries
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <div className="flex flex-col gap-[3px] justify-around text-[10px] text-zinc-500 pr-1 select-none">
          {dayLabels.map((d, i) => (
            <span key={d} className={i % 2 === 1 ? "opacity-100" : "opacity-0"}>{d}</span>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {grid.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              {col.map((cell, ri) =>
                cell ? (
                  <div
                    key={ri}
                    className={`hm-cell hm-${level(cell.count)} transition-transform hover:scale-125 cursor-default`}
                    title={`${cell.label} — ${cell.count} ${cell.count === 1 ? "entry" : "entries"}`}
                  />
                ) : (
                  <div key={ri} className="hm-cell opacity-0" />
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-zinc-500">
        <span>less</span>
        <span className="hm-cell" />
        <span className="hm-cell hm-1" />
        <span className="hm-cell hm-2" />
        <span className="hm-cell hm-3" />
        <span className="hm-cell hm-4" />
        <span>more</span>
      </div>
    </section>
  );
}
