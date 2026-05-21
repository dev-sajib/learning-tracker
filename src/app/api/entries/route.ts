import { NextResponse } from "next/server";
import { ensureInit, exec, uid } from "@/lib/db";
import type { Entry } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  await ensureInit();
  const body = (await req.json().catch(() => null)) as
    | { topicId?: string; subtopicId?: string | null; summary?: string; date?: string }
    | null;
  if (!body || typeof body.topicId !== "string" || typeof body.summary !== "string" || !body.summary.trim()) {
    return NextResponse.json({ error: "topicId + summary required" }, { status: 400 });
  }
  const e: Entry = {
    id: uid(),
    topicId: body.topicId,
    subtopicId: body.subtopicId ?? undefined,
    date: body.date || todayLocal(),
    summary: body.summary.trim(),
    createdAt: new Date().toISOString(),
  };
  await exec(
    "INSERT INTO entries (id, topic_id, subtopic_id, date, summary, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [e.id, e.topicId, e.subtopicId ?? null, e.date, e.summary, e.createdAt]
  );
  return NextResponse.json(e);
}
