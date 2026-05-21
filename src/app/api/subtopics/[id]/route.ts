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
  // null out entry references rather than delete entries
  await exec("UPDATE entries SET subtopic_id = NULL WHERE subtopic_id = ?", [id]);
  await exec("DELETE FROM subtopics WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
