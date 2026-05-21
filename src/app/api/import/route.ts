import { NextResponse } from "next/server";
import { ensureInit, exec, rows, uid } from "@/lib/db";
import type { TrackerState, Topic, Subtopic, Entry } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ImportBody = Partial<TrackerState> & {
  // mode: "merge" appends + skips duplicates by id; "replace" wipes first
  mode?: "merge" | "replace";
};

export async function POST(req: Request) {
  await ensureInit();
  const body = (await req.json().catch(() => null)) as ImportBody | null;
  if (!body || !Array.isArray(body.topics)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  const mode = body.mode === "replace" ? "replace" : "merge";

  if (mode === "replace") {
    await exec("DELETE FROM entries");
    await exec("DELETE FROM subtopics");
    await exec("DELETE FROM topics");
  }

  const now = new Date().toISOString();
  const existingTopicIds = new Set(
    (await rows<{ id: string }>("SELECT id FROM topics")).map((r) => r.id)
  );
  const existingSubtopicIds = new Set(
    (await rows<{ id: string }>("SELECT id FROM subtopics")).map((r) => r.id)
  );
  const existingEntryIds = new Set(
    (await rows<{ id: string }>("SELECT id FROM entries")).map((r) => r.id)
  );

  let inserted = { topics: 0, subtopics: 0, entries: 0 };

  for (const t of body.topics as Topic[]) {
    if (!t.id || !t.name) continue;
    if (existingTopicIds.has(t.id)) continue;
    await exec(
      "INSERT INTO topics (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)",
      [t.id || uid(), t.name, t.color || "#6366f1", t.icon ?? null, t.createdAt || now]
    );
    inserted.topics++;
  }

  for (const s of (body.subtopics || []) as Subtopic[]) {
    if (!s.id || !s.topicId || !s.name) continue;
    if (existingSubtopicIds.has(s.id)) continue;
    await exec(
      "INSERT INTO subtopics (id, topic_id, name, created_at) VALUES (?, ?, ?, ?)",
      [s.id, s.topicId, s.name, s.createdAt || now]
    );
    inserted.subtopics++;
  }

  for (const e of (body.entries || []) as Entry[]) {
    if (!e.id || !e.topicId || !e.date || typeof e.summary !== "string") continue;
    if (existingEntryIds.has(e.id)) continue;
    await exec(
      "INSERT INTO entries (id, topic_id, subtopic_id, date, summary, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [e.id, e.topicId, e.subtopicId ?? null, e.date, e.summary, e.createdAt || now]
    );
    inserted.entries++;
  }

  return NextResponse.json({ ok: true, inserted });
}
