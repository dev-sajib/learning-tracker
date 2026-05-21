import { NextResponse } from "next/server";
import { ensureInit, rows } from "@/lib/db";
import type { Topic, Subtopic, Entry } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TopicRow = { id: string; name: string; color: string; icon: string | null; created_at: string };
type SubtopicRow = { id: string; topic_id: string; name: string; created_at: string };
type EntryRow = { id: string; topic_id: string; subtopic_id: string | null; date: string; summary: string; created_at: string };

export async function GET() {
  await ensureInit();
  const [tRows, sRows, eRows] = await Promise.all([
    rows<TopicRow>("SELECT id, name, color, icon, created_at FROM topics ORDER BY created_at ASC"),
    rows<SubtopicRow>("SELECT id, topic_id, name, created_at FROM subtopics ORDER BY created_at ASC"),
    rows<EntryRow>("SELECT id, topic_id, subtopic_id, date, summary, created_at FROM entries ORDER BY created_at DESC"),
  ]);

  const topics: Topic[] = tRows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    icon: r.icon ?? undefined,
    createdAt: r.created_at,
  }));
  const subtopics: Subtopic[] = sRows.map((r) => ({
    id: r.id,
    topicId: r.topic_id,
    name: r.name,
    createdAt: r.created_at,
  }));
  const entries: Entry[] = eRows.map((r) => ({
    id: r.id,
    topicId: r.topic_id,
    subtopicId: r.subtopic_id ?? undefined,
    date: r.date,
    summary: r.summary,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ topics, subtopics, entries, version: 2 });
}
