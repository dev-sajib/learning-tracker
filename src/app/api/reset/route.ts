import { NextResponse } from "next/server";
import { ensureInit, exec } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  await ensureInit();
  await exec("DELETE FROM entries");
  await exec("DELETE FROM subtopics");
  await exec("DELETE FROM topics");
  return NextResponse.json({ ok: true });
}
