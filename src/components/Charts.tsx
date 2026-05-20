"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarDays, Tag, ListTree } from "lucide-react";
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, ymd, subDays, parseISO,
} from "@/lib/date";
import type { Topic, Subtopic, Entry } from "@/lib/types";
import { useTheme } from "@/lib/theme";

interface Props {
  topics: Topic[];
  subtopics: Subtopic[];
  entries: Entry[];
}

type Detail =
  | { kind: "date"; date: string }
  | { kind: "topic"; topicId: string };

export default function Charts({ topics, subtopics, entries }: Props) {
  const { resolved } = useTheme();
  const isLight = resolved === "light";
  const [detail, setDetail] = useState<Detail | null>(null);

  const palette = isLight
    ? {
        grid: "#e3e7ec", axis: "#6b7280", tick: "#4b5563",
        tooltipBg: "#ffffff", tooltipBorder: "#d6dbe2", tooltipLabel: "#374151",
        legend: "#374151", cursor: "rgba(5, 150, 105, 0.08)",
        pieStroke: "#ffffff", gradFrom: "#059669", gradTo: "#0891b2",
        lineStroke: "#7c3aed",
      }
    : {
        grid: "#1a1f26", axis: "#4b5563", tick: "#6b7280",
        tooltipBg: "#0b0d10", tooltipBorder: "#232a33", tooltipLabel: "#a1a1aa",
        legend: "#a1a1aa", cursor: "rgba(52, 211, 153, 0.05)",
        pieStroke: "#0b0d10", gradFrom: "#34d399", gradTo: "#22d3ee",
        lineStroke: "#a78bfa",
      };

  const monthData = useMemo(() => {
    const now = new Date();
    const days = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
    const map: Record<string, number> = {};
    for (const e of entries) map[e.date] = (map[e.date] ?? 0) + 1;
    return days.map((d) => ({
      day: format(d, "d"),
      date: ymd(d),
      entries: map[ymd(d)] ?? 0,
    }));
  }, [entries]);

  const growthData = useMemo(() => {
    const days: { date: string; label: string }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = subDays(new Date(), i);
      days.push({ date: ymd(d), label: format(d, "MMM d") });
    }
    let cum = 0;
    const counts: Record<string, number> = {};
    for (const e of entries) counts[e.date] = (counts[e.date] ?? 0) + 1;
    const startKey = days[0].date;
    for (const e of entries) if (e.date < startKey) cum += 1;
    return days.map((d) => {
      cum += counts[d.date] ?? 0;
      return { label: d.label, date: d.date, total: cum };
    });
  }, [entries]);

  const topicData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of entries) map[e.topicId] = (map[e.topicId] ?? 0) + 1;
    return topics
      .map((t) => ({ id: t.id, name: t.name, value: map[t.id] ?? 0, color: t.color }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [topics, entries]);

  const monthLabel = format(new Date(), "MMMM yyyy");
  const totalMonth = monthData.reduce((a, d) => a + d.entries, 0);

  // Detail data
  const detailEntries = useMemo(() => {
    if (!detail) return [];
    const sorted = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (detail.kind === "date") return sorted.filter((e) => e.date === detail.date);
    return sorted.filter((e) => e.topicId === detail.topicId);
  }, [detail, entries]);

  const detailMeta = useMemo(() => {
    if (!detail) return null;
    if (detail.kind === "date") {
      const d = parseISO(detail.date);
      return {
        icon: <CalendarDays size={16} className="text-emerald-300" />,
        title: format(d, "EEEE, MMMM d, yyyy"),
        subtitle: detail.date === ymd(new Date()) ? "today" : format(d, "yyyy-MM-dd"),
        accent: "#34d399",
      };
    }
    const t = topics.find((x) => x.id === detail.topicId);
    return {
      icon: <Tag size={16} style={{ color: t?.color ?? "#34d399" }} />,
      title: t?.name ?? "Topic",
      subtitle: "all entries for this topic",
      accent: t?.color ?? "#34d399",
    };
  }, [detail, topics]);

  const tname = (id: string) => topics.find((t) => t.id === id);
  const sname = (id?: string) => (id ? subtopics.find((s) => s.id === id)?.name : undefined);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="surface p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <span className="text-emerald-400">{">"}</span> monthly progress
              <span className="chip ml-2">{monthLabel}</span>
              <span className="text-[10px] text-zinc-500 ml-1 hidden md:inline">· click a bar</span>
            </h2>
            <span className="text-[11px] text-zinc-500 tabular-nums">
              {totalMonth} {totalMonth === 1 ? "entry" : "entries"} this month
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
                <YAxis stroke={palette.axis} tick={{ fill: palette.tick, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: palette.tooltipLabel }}
                  formatter={(v) => [`${v} ${v === 1 ? "entry" : "entries"} · click to view`, "Logged"]}
                  labelFormatter={(l) => `Day ${l}`}
                  cursor={{ fill: palette.cursor }}
                />
                <Bar
                  dataKey="entries"
                  fill="url(#barGrad)"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(d) => {
                    const p = d as unknown as { entries?: number; date?: string };
                    if (p?.date && (p.entries ?? 0) > 0) setDetail({ kind: "date", date: p.date });
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2 mb-3">
            <span className="text-emerald-400">{">"}</span> topic split
            <span className="text-[10px] text-zinc-500 ml-1 hidden md:inline">· click a slice</span>
          </h2>
          {topicData.length === 0 ? (
            <div className="text-xs text-zinc-500 italic text-center py-12">
              log entries to see your topic split
            </div>
          ) : (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={topicData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={84}
                    paddingAngle={3}
                    stroke={palette.pieStroke}
                    strokeWidth={2}
                    cursor="pointer"
                    onClick={(d) => {
                      const p = d as unknown as { payload?: { id?: string }; id?: string };
                      const id = p?.payload?.id ?? p?.id;
                      if (id) setDetail({ kind: "topic", topicId: id });
                    }}
                  >
                    {topicData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
                    formatter={(v, n) => [`${v} ${v === 1 ? "entry" : "entries"} · click to view`, n as string]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: palette.legend }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <section className="surface p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <span className="text-emerald-400">{">"}</span> growth curve
            <span className="chip ml-2">last 30 days</span>
            <span className="text-[10px] text-zinc-500 ml-1 hidden md:inline">· click a point</span>
          </h2>
          <span className="text-[11px] text-zinc-500 tabular-nums">
            {entries.length} total
          </span>
        </div>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <LineChart data={growthData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={palette.gradFrom} />
                  <stop offset="100%" stopColor={palette.lineStroke} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" stroke={palette.axis} tick={{ fill: palette.tick, fontSize: 10 }} tickLine={false} axisLine={{ stroke: palette.grid }} interval={4} />
              <YAxis stroke={palette.axis} tick={{ fill: palette.tick, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: palette.tooltipLabel }}
                formatter={(v) => [`${v} total · click point for that day`, "Cumulative"]}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="url(#lineGrad)"
                strokeWidth={2.5}
                dot={false}
                activeDot={({
                  r: 5,
                  fill: palette.gradFrom,
                  style: { cursor: "pointer" },
                  onClick: (props: unknown) => {
                    const dp = props as { payload?: { date?: string } } | undefined;
                    const date = dp?.payload?.date;
                    if (date) setDetail({ kind: "date", date });
                  },
                }) as unknown as React.ComponentProps<typeof Line>["activeDot"]}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Detail modal */}
      <AnimatePresence>
        {detail && detailMeta && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-3 md:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) setDetail(null); }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetail(null)} />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="surface relative w-full max-w-2xl max-h-[80vh] flex flex-col z-10 shadow-2xl overflow-hidden"
              onKeyDown={(e) => { if (e.key === "Escape") setDetail(null); }}
              tabIndex={-1}
            >
              {/* accent strip */}
              <div className="h-1 w-full" style={{ background: detailMeta.accent }} />

              <div className="p-5 flex items-center justify-between border-b border-[var(--border)]">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: `color-mix(in oklab, ${detailMeta.accent} 18%, transparent)`,
                      border: `1px solid color-mix(in oklab, ${detailMeta.accent} 45%, transparent)`,
                    }}
                  >
                    {detailMeta.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate">{detailMeta.title}</h3>
                    <p className="text-[11px] text-zinc-500">{detailMeta.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="chip glow text-emerald-300 tabular-nums">
                    {detailEntries.length} {detailEntries.length === 1 ? "entry" : "entries"}
                  </span>
                  <button
                    onClick={() => setDetail(null)}
                    className="text-zinc-500 hover:text-zinc-200 transition-colors p-1"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto p-5 flex flex-col gap-3">
                {detailEntries.length === 0 && (
                  <div className="text-xs text-zinc-500 italic text-center py-8 flex flex-col items-center gap-2">
                    <ListTree size={20} className="text-zinc-600" />
                    nothing logged here yet.
                  </div>
                )}
                {detailEntries.map((e) => {
                  const t = tname(e.topicId);
                  const sn = sname(e.subtopicId);
                  return (
                    <div key={e.id} className="surface-2 px-4 py-3 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        {detail.kind === "topic" && (
                          <span className="text-[10px] text-zinc-500 tabular-nums">
                            {format(parseISO(e.date), "MMM d, yyyy")}
                          </span>
                        )}
                        {detail.kind === "topic" && <span className="text-zinc-700">·</span>}
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
                        <span className="ml-auto text-[10px] text-zinc-600 tabular-nums">
                          {format(parseISO(e.createdAt), "HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-200 whitespace-pre-wrap break-words leading-relaxed">
                        {e.summary}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="px-5 py-3 border-t border-[var(--border)] text-[10px] text-zinc-500 flex items-center justify-between">
                <span>
                  {detail.kind === "date" ? "click another bar to switch days" : "click another slice to switch topics"}
                </span>
                <span><kbd className="px-1 rounded border border-[var(--border-2)]">Esc</kbd> close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
