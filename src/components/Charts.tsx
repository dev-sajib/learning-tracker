"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, ymd,
} from "@/lib/date";
import type { Topic, Entry } from "@/lib/types";
import { useTheme } from "@/lib/theme";

interface Props {
  topics: Topic[];
  entries: Entry[];
}

export default function Charts({ topics, entries }: Props) {
  const { resolved } = useTheme();
  const isLight = resolved === "light";

  const palette = isLight
    ? {
        grid: "#e3e7ec",
        axis: "#6b7280",
        tick: "#4b5563",
        tooltipBg: "#ffffff",
        tooltipBorder: "#d6dbe2",
        tooltipLabel: "#374151",
        legend: "#374151",
        cursor: "rgba(5, 150, 105, 0.08)",
        pieStroke: "#ffffff",
        gradFrom: "#059669",
        gradTo: "#0891b2",
      }
    : {
        grid: "#1a1f26",
        axis: "#4b5563",
        tick: "#6b7280",
        tooltipBg: "#0b0d10",
        tooltipBorder: "#232a33",
        tooltipLabel: "#a1a1aa",
        legend: "#a1a1aa",
        cursor: "rgba(52, 211, 153, 0.05)",
        pieStroke: "#0b0d10",
        gradFrom: "#34d399",
        gradTo: "#22d3ee",
      };

  const monthData = useMemo(() => {
    const now = new Date();
    const days = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
    const map: Record<string, number> = {};
    for (const e of entries) map[e.date] = (map[e.date] ?? 0) + e.minutes;
    return days.map((d) => ({
      day: format(d, "d"),
      date: ymd(d),
      minutes: map[ymd(d)] ?? 0,
    }));
  }, [entries]);

  const topicData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of entries) map[e.topicId] = (map[e.topicId] ?? 0) + e.minutes;
    return topics
      .map((t) => ({ name: t.name, minutes: map[t.id] ?? 0, color: t.color }))
      .filter((d) => d.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);
  }, [topics, entries]);

  const monthLabel = format(new Date(), "MMMM yyyy");

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <section className="surface p-5 xl:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <span className="text-emerald-400">{">"}</span> monthly progress
            <span className="chip ml-2">{monthLabel}</span>
          </h2>
          <span className="text-[11px] text-zinc-500 tabular-nums">
            {monthData.reduce((a, d) => a + d.minutes, 0)} min total
          </span>
        </div>

        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={monthData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.gradFrom} stopOpacity={1} />
                  <stop offset="100%" stopColor={palette.gradTo} stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke={palette.axis} tick={{ fill: palette.tick, fontSize: 11 }} tickLine={false} axisLine={{ stroke: palette.grid }} />
              <YAxis stroke={palette.axis} tick={{ fill: palette.tick, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: palette.tooltipLabel }}
                formatter={(v) => [`${v} min`, "Learning"]}
                labelFormatter={(l) => `Day ${l}`}
                cursor={{ fill: palette.cursor }}
              />
              <Bar dataKey="minutes" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2 mb-3">
          <span className="text-emerald-400">{">"}</span> topic split
        </h2>
        {topicData.length === 0 ? (
          <div className="text-xs text-zinc-500 italic text-center py-12">
            log some learning to see your topic split
          </div>
        ) : (
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={topicData}
                  dataKey="minutes"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={84}
                  paddingAngle={3}
                  stroke={palette.pieStroke}
                  strokeWidth={2}
                >
                  {topicData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
                  formatter={(v, n) => [`${v} min`, n as string]}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, color: palette.legend }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
