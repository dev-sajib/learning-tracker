import { NextResponse } from "next/server";
import { ensureInit, exec } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureInit();
  const { id } = await params;
  await exec("DELETE FROM entries WHERE topic_id = ?", [id]);
  await exec("DELETE FROM subtopics WHERE topic_id = ?", [id]);
  await exec("DELETE FROM topics WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
