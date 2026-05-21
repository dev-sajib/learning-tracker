import { NextResponse } from "next/server";
import { ensureInit, exec, uid } from "@/lib/db";
import type { Subtopic } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  await ensureInit();
  const body = (await req.json().catch(() => null)) as
    | { topicId?: string; name?: string }
    | null;
  if (!body || typeof body.topicId !== "string" || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "topicId + name required" }, { status: 400 });
  }
  const s: Subtopic = {
    id: uid(),
    topicId: body.topicId,
    name: body.name.trim(),
    createdAt: new Date().toISOString(),
  };
  await exec(
    "INSERT INTO subtopics (id, topic_id, name, created_at) VALUES (?, ?, ?, ?)",
    [s.id, s.topicId, s.name, s.createdAt]
  );
  return NextResponse.json(s);
}
