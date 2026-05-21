import { NextResponse } from "next/server";
import { ensureInit, exec, uid } from "@/lib/db";
import type { Topic } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  await ensureInit();
  const body = (await req.json().catch(() => null)) as
    | { name?: string; color?: string; icon?: string }
    | null;
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const t: Topic = {
    id: uid(),
    name: body.name.trim(),
    color: body.color || "#6366f1",
    icon: body.icon,
    createdAt: new Date().toISOString(),
  };
  await exec(
    "INSERT INTO topics (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)",
    [t.id, t.name, t.color, t.icon ?? null, t.createdAt]
  );
  return NextResponse.json(t);
}
